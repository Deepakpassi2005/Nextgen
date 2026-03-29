import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testFetch() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'don12@gmail.com',
      password: 'don12345'
    });

    const token = loginRes.data.data.token;
    console.log('Token obtained');

    console.log('Fetching profile...');
    const profileRes = await axios.get(`${BASE_URL}/teacher/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Profile Response:', JSON.stringify(profileRes.data, null, 2));
  } catch (err: any) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

testFetch();
