async function test() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_dawuhan1',
        password: 'Admin123!'
      })
    });
    const data = await res.json();
    console.log('Login Status:', res.status, data);
  } catch (err) {
    console.error('Login Failed!', err);
  }
}
test();
