import express from 'express';
import { getOrdersCollection, getUsersCollection, getProductsCollection } from '../../utils/database';
import globalEventEmitter, { events } from '../../utils/events';

const router = express.Router();

export const authorizeAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // For the stream endpoint we will allow connections and rely on frontend auth logic for now
    // or token in query params. 
    next();
};

// REST API to get recent orders
router.get('/', authorizeAdmin, async (req, res) => {
    try {
        const ordersCollection = getOrdersCollection();
        const rows = await ordersCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        // Collect all unique userIds and productIds from orders
        const missingUserIds = new Set<string>();
        const productIds = new Set<string>();
        
        rows.forEach(row => {
            if (!row.customerEmail && row.userId) {
                missingUserIds.add(row.userId as string);
            }
            if (Array.isArray(row.items)) {
                row.items.forEach((item: any) => {
                    if (item && item.id && !item.adminProductId) {
                        productIds.add(item.id);
                    }
                });
            }
        });

        // Batch look up user emails from the users collection
        let userEmailMap: Record<string, { email: string; firstName?: string; lastName?: string }> = {};
        if (missingUserIds.size > 0) {
            const usersCollection = getUsersCollection();
            const userDocs = await usersCollection
                .find({ id: { $in: Array.from(missingUserIds) } })
                .project({ id: 1, email: 1, firstName: 1, lastName: 1, _id: 0 })
                .toArray();

            for (const u of userDocs) {
                userEmailMap[u.id] = {
                    email: u.email,
                    firstName: u.firstName,
                    lastName: u.lastName
                };
            }
        }

        // Batch look up missing adminProductIds from products collection
        let productMap: Record<string, string> = {};
        if (productIds.size > 0) {
            const productsCollection = getProductsCollection();
            const productDocs = await productsCollection
                .find({ id: { $in: Array.from(productIds) } })
                .project({ id: 1, adminProductId: 1, _id: 0 })
                .toArray();

            for (const p of productDocs) {
                if (p.adminProductId) {
                    productMap[p.id] = p.adminProductId;
                }
            }
        }

        const orders = rows.map((row) => {
            const { _id, ...rest } = row;
            
            // Map missing adminProductIds
            if (Array.isArray(rest.items)) {
                rest.items = rest.items.map((item: any) => {
                    if (item && item.id && !item.adminProductId && productMap[item.id]) {
                        return { ...item, adminProductId: productMap[item.id] };
                    }
                    return item;
                });
            }
            
            // If the order has no customerEmail, try to fill it from user lookup
            if (!rest.customerEmail && rest.userId && userEmailMap[rest.userId]) {
                const userData = userEmailMap[rest.userId];
                rest.customerEmail = userData.email;
                if (!rest.customerName && !rest.name) {
                    const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim();
                    if (fullName) {
                        rest.customerName = fullName;
                    }
                }
            }
            return rest;
        });

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// SSE Endpoint for real-time updates
router.get('/stream', authorizeAdmin, (req, res) => {
    // Setup SSE Headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Send an initial connected message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Define the listener for new orders
    const newOrderListener = (orderData: unknown) => {
        res.write(`data: ${JSON.stringify({ type: 'new_order', order: orderData })}\n\n`);
    };

    // Subscribe to the global Event Emitter
    globalEventEmitter.on(events.NEW_ORDER, newOrderListener);

    // Clean up when the client disconnects
    req.on('close', () => {
        globalEventEmitter.off(events.NEW_ORDER, newOrderListener);
        res.end();
    });
});

export default router;
