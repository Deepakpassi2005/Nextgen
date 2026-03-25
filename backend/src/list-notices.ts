import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const Notice = mongoose.model('Notice', new mongoose.Schema({}, { strict: false }));
  const notices = await Notice.find().limit(5);
  console.log(JSON.stringify(notices.map(n => ({ id: n._id, title: n.title })), null, 2));
  await mongoose.connection.close();
}

run();
