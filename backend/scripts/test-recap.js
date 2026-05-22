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
    const data = JSON.parse(body);
    const token = data.token;
    
    // Now GET /api/grades/recap
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api/grades/recap',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res2 => {
      console.log('GET /recap status:', res2.statusCode);
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        try {
          const parsed = JSON.parse(body2);
          console.log(JSON.stringify(parsed, null, 2).substring(0, 500)); // Log first 500 chars to avoid huge output
        } catch(e) {
          console.log(body2);
        }
      });
    });
  });
});

loginReq.write(loginData);
loginReq.end();
