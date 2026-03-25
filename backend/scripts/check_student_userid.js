const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Student = mongoose.model('Student', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, email: String }));
    const students = await Student.find({ userId: { $exists: true } });
    
    console.log(`Found ${students.length} students with userId field`);
    students.forEach(s => {
      console.log(`Student: ${s.email}, userId: ${s.userId}`);
    });
    
    const allStudents = await Student.find();
    console.log(`Total students: ${allStudents.length}`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

check();
