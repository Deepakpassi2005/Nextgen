const axios = require('axios');
const jwt = require('jsonwebtoken');

const secret = 'your_secret';
const ramId = '69b539041ef0231c6cdc126d';

async function test() {
  const payload = {
    sub: ramId,
    email: 'ram@gmail.com',
    role: 'student',
    name: 'Ram Sita'
  };
  
  const token = jwt.sign(payload, secret);
  console.log('Using Token:', token);
  
  try {
    const res = await axios.get('http://localhost:5000/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('SUCCESS:', res.status);
    console.log('DataKeys:', Object.keys(res.data.data));
  } catch (err) {
    console.log('FAILED:', err.response?.status);
    console.log('ErrorBody:', JSON.stringify(err.response?.data, null, 2));
  }
}

test();
