const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://appuser:apppass@cluster0.e9d53ib.mongodb.net/?appName=Cluster0');
    console.log('Connected to DB');
    
    // Test native driver first
    const nativeRam = await mongoose.connection.collection('students').findOne({ _id: new mongoose.Types.ObjectId('69b539041ef0231c6cdc126d') });
    console.log('Native find by ObjectId:', nativeRam ? 'FOUND' : 'NOT FOUND');
    
    // Load schema
    const StudentSchema = new mongoose.Schema({}, { strict: false });
    // Prevent overwrite error if model already exists
    const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
    
    const mongooseRam = await Student.findById('69b539041ef0231c6cdc126d');
    console.log('Mongoose findById:', mongooseRam ? 'FOUND' : 'NOT FOUND');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
