fetch('http://localhost:3001/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' })
}).then(res => res.text()).then(text => console.log('Response:', text)).catch(err => console.error('Error:', err));
