import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';

async function check() {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'Ekamma');
        const coupons = await db.collection('coupons').find({}).toArray();
        console.log('COUPONS_FOUND:', JSON.stringify(coupons, null, 2));

        const users = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log('ADMIN_USERS:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role })), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

check();
