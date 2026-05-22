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
    
    // Now GET /api/tenants
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: '/api/tenants',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res2 => {
      console.log('GET /tenants status:', res2.statusCode);
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log(body2);
      });
    });
  });
});

loginReq.write(loginData);
loginReq.end();
