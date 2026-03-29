import axios from 'axios';

async function test() {
  try {
    console.log('Testing endpoint...');
    const res = await axios.get('http://localhost:5000/api/student/dashboard');
    console.log('Status:', res.status);
    console.log('Data:', res.data);
  } catch (err: any) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
}

test();
