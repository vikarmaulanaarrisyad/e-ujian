const axios = require('axios');
async function test() {
  try {
    // We need to login first to get the token
    const login = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@bustanulhuda.com', // wait, I don't know the admin email
      password: 'password'
    });
  } catch (err) {
    console.log(err.message);
  }
}
test();
