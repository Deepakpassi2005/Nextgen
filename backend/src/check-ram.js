const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://appuser:apppass@cluster0.e9d53ib.mongodb.net/?appName=Cluster0');
    console.log('Connected to DB');
    
    const Student = mongoose.connection.collection('students');
    const ram = await Student.findOne({ firstName: /ram/i });
    
    console.log('Student Ram:', JSON.stringify(ram, null, 2));
    
    if (ram && ram.userId) {
      console.log('UserId found:', ram.userId);
    } else {
      console.log('CRITICAL: No userId linked to this student!');
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
