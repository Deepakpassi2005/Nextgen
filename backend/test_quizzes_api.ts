import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testQuizzes() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'don12@gmail.com',
      password: 'don12345'
    });

    const token = loginRes.data.data.token;
    console.log('Token obtained');

    console.log('Fetching teacher quizzes...');
    const quizRes = await axios.get(`${BASE_URL}/teacher/quizzes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Quiz Response status:', quizRes.status);
    console.log('Quiz Data length:', quizRes.data.data?.length);
  } catch (err: any) {
    console.error('Test failed:', err.response?.status, err.response?.data || err.message);
  }
}

testQuizzes();
