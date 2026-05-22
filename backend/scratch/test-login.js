async function testLogin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      })
    });
    console.log('Login Response Status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

testLogin();
