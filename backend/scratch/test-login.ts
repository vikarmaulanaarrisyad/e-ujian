import axios from 'axios';

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'Admin123!'
    });
    console.log('Login successful! Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error: any) {
    console.error('Login failed! Status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testLogin();
