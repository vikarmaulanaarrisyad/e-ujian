const http = require('http');

// First login
const loginData = JSON.stringify({
  username: 'superadmin',
  password: 'superadmin123'
});

const loginReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Login Response:', body);
  });
});

loginReq.write(loginData);
loginReq.end();
