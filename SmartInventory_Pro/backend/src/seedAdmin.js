import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Business from './models/Business.js';
import User from './models/User.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory_pro');
let business = await Business.findOne({ code: 'DEMO' });
if (!business) business = await Business.create({ name: 'Demo Business', code: 'DEMO' });
let admin = await User.findOne({ email: 'jashureddy39@gmail.com', business: business._id });
if (!admin) {
  admin = await User.create({ name: 'Jaswanth', email: 'jashureddy39@gmail.com', passwordHash: await bcrypt.hash('jashu_39', 12), role: 'admin', business: business._id });
  console.log('Demo admin created: admin@example.com / jashu_39');
} else console.log('Demo admin already exists.');
await mongoose.disconnect();
