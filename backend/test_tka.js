require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({where: {username: 'admin_dawuhan1'}});
  if(!user) return console.log('no user');
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET || 'supersecret_jwt_key_here',
    { expiresIn: '1d' }
  );
  try {
    const res = await fetch('http://localhost:5000/api/documents/tka-batch', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(res.status, data.students.length, 'students');
    } else {
      const text = await res.text();
      console.log('Error status:', res.status);
      console.log('Error data:', text);
    }
  } catch(err) {
    console.log('Error message:', err.message);
  }
}
test();
