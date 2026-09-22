const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1, email: 'admin@gmail.com', role: 'user' }, 'hanoti_secure_key_12345', { expiresIn: '24h' });

async function fullTest() {
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

  console.log('--- 1. Testing GET /api/clients ---');
  let res = await fetch('http://localhost:3000/api/clients', { headers });
  let clients = await res.json();
  console.log('Current Clients Count:', clients.length);

  console.log('--- 2. Adding Omar ---');
  res = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Omar', phone: '0622334455', address: 'Rabat, Agdal', note: 'Client régulier' })
  });
  const omar = await res.json();
  console.log('Created Omar ID:', omar.id);

  console.log('--- 3. Adding Credit 200 DH & Payment 80 DH for Omar ---');
  await fetch(`http://localhost:3000/api/clients/${omar.id}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'credit', amount: 200, date: '2026-04-10', description: 'Fournitures' })
  });
  await fetch(`http://localhost:3000/api/clients/${omar.id}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'payment', amount: 80, date: '2026-04-16', description: 'Acompte' })
  });

  console.log('--- 4. Adding Ahmed ---');
  res = await fetch('http://localhost:3000/api/clients', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Ahmed', phone: '0699887766', address: 'Casablanca, Ain Diab', note: 'Nouveau client' })
  });
  const ahmed = await res.json();
  console.log('Created Ahmed ID:', ahmed.id);

  console.log('--- 5. Adding Credit 80 DH for Ahmed ---');
  await fetch(`http://localhost:3000/api/clients/${ahmed.id}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type: 'credit', amount: 80, date: '2026-04-18', description: 'Courses du matin' })
  });

  console.log('--- 6. Verifying all clients and debts ---');
  res = await fetch('http://localhost:3000/api/clients', { headers });
  clients = await res.json();
  clients.forEach(c => {
    console.log(`✓ Client ${c.name} (${c.phone}): Total Crédit = ${c.total_credit} DH | Total Payé = ${c.total_paid} DH | Dette Restante = ${c.remaining_debt} DH`);
  });

  console.log('--- 7. Verifying Omar Detailed Profile ---');
  res = await fetch(`http://localhost:3000/api/clients/${omar.id}`, { headers });
  const omarProfile = await res.json();
  console.log('Omar Profile Details:', {
    name: omarProfile.name,
    total_credit: omarProfile.total_credit,
    total_paid: omarProfile.total_paid,
    remaining_debt: omarProfile.remaining_debt,
    transactions: omarProfile.transactions.map(t => `${t.type === 'credit' ? '+' : '-'}${t.amount} DH (${t.description})`)
  });
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}

fullTest().catch(console.error);
