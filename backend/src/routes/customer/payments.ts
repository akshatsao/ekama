import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import Razorpay from "razorpay";
import { getOrdersCollection } from "../../utils/database";
import globalEventEmitter, { events } from "../../utils/events";
import { buildShiprocketOrderPayload, createShiprocketOrder } from "../../utils/shiprocket";

dotenv.config();

const router = express.Router();

type OrderDoc = {
  id: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  name?: string;
  items?: unknown[];
  totalAmount: number;
  status: string;
  shippingAddress?: string | null;
  shippingDetails?: {
    name?: string;
    phone?: string;
    addressLine?: string;
    locality?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  shiprocket?: {
    orderId?: number;
    shipmentId?: number;
    status?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

type OrderItemInput = {
  id?: string;
  adminProductId?: string;
  name?: string;
  quantity?: number;
  price?: number;
};

const normalizeOrderItems = (items: unknown[]) =>
  items
    .map((item) => (item && typeof item === 'object' ? (item as OrderItemInput) : null))
    .filter(Boolean)
    .map((item) => ({
      name: String(item?.name || 'Item'),
      sku: String(item?.adminProductId || item?.id || 'SKU'),
      quantity: Number(item?.quantity || 1),
      price: Number(item?.price || 0)
    }));

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay keys are not configured" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err: any) {
    console.error("Error creating Razorpay order", err);
    return res.status(500).json({ error: "Failed to create order", details: err.message || JSON.stringify(err) });
  }
});

router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: "Razorpay keys are not configured" });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing required payment fields" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature === razorpay_signature) {
    return res.json({ status: "ok" });
  }
  return res.status(400).json({ error: "Signature verification failed" });
});

router.post("/create-order-with-items", async (req, res) => {
  try {
    const { items, totalAmount, userId, customerEmail, customerName, shippingAddress, paymentMethod, name, shippingDetails } = req.body;

    if (!items || !totalAmount || !userId) {
      return res.status(400).json({ error: "Items, totalAmount, and userId are required" });
    }

    const orders = getOrdersCollection();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const orderDoc: OrderDoc = {
      id: orderId,
      userId,
      customerEmail: customerEmail || undefined,
      customerName: customerName || name || undefined,
      name: name || undefined,
      items: Array.isArray(items) ? items : [],
      totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress || null,
      shippingDetails: shippingDetails || null,
      paymentMethod: paymentMethod || 'razorpay',
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await orders.insertOne(orderDoc);

    // Broadcast the new order event to connected admin clients
    globalEventEmitter.emit(events.NEW_ORDER, orderDoc);

    return res.json({ orderId, status: 'pending' });
  } catch (err) {
    console.error("Error creating order with items", err);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

router.post("/update-order-status", async (req, res) => {
  try {
    const { orderId, status, paymentStatus, razorpayOrderId, razorpayPaymentId } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: "orderId and status are required" });
    }

    const orders = getOrdersCollection();
    const filter = razorpayOrderId
      ? { $or: [{ id: orderId }, { id: razorpayOrderId }] }
      : { id: orderId };
    const updates: Partial<OrderDoc> = {
      status,
      paymentStatus,
      updatedAt: new Date()
    };
    if (razorpayOrderId) {
      updates.id = razorpayOrderId;
    }

    const result = await orders.updateOne(filter, { $set: updates });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = await orders.findOne(filter);
    const orderRow = updated as OrderDoc | null;
    if (orderRow && !orderRow.shiprocket?.orderId) {
      const details = orderRow.shippingDetails || null;
      const shouldBook =
        (status && status !== 'pending') &&
        details?.addressLine &&
        details?.city &&
        details?.state &&
        details?.pincode &&
        details?.phone &&
        (orderRow.customerEmail || orderRow.customerName || orderRow.name);

      if (shouldBook) {
        try {
          const customerNameValue = orderRow.customerName || orderRow.name || 'Customer';
          const customerEmailValue = orderRow.customerEmail || 'no-reply@example.com';
          const orderItems = Array.isArray(orderRow.items) ? orderRow.items : [];
          const payload = buildShiprocketOrderPayload({
            orderId: orderRow.id,
            createdAt: orderRow.createdAt,
            customerName: customerNameValue,
            customerEmail: customerEmailValue,
            shippingPhone: details.phone || '',
            addressLine: details.addressLine || '',
            locality: details.locality || '',
            city: details.city || '',
            state: details.state || '',
            pincode: details.pincode || '',
            items: normalizeOrderItems(orderItems),
            paymentMethod: orderRow.paymentMethod || 'razorpay',
            totalAmount: Number(orderRow.totalAmount || 0)
          });

          const shiprocketResponse = await createShiprocketOrder(payload);
          await orders.updateOne(
            { id: orderRow.id },
            {
              $set: {
                shiprocket: {
                  orderId: shiprocketResponse.order_id,
                  shipmentId: shiprocketResponse.shipment_id,
                  status: shiprocketResponse.status
                },
                updatedAt: new Date()
              }
            }
          );
        } catch (shipErr) {
          console.error('Shiprocket booking failed:', shipErr);
        }
      }
    }

    return res.json({ success: true, orderId: razorpayOrderId || orderId });
  } catch (err) {
    console.error("Error updating order status", err);
    return res.status(500).json({ error: "Failed to update order status" });
  }
});

router.get("/user-orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const ordersCollection = getOrdersCollection();
    const rows: OrderDoc[] = await ordersCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const orders = rows.map((row: OrderDoc) => {
      const { _id, ...rest } = row as OrderDoc & { _id?: unknown };
      return rest;
    });

    return res.json({ orders });
  } catch (err) {
    console.error("Error fetching user orders", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
