const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');
const token = jwt.sign({ id: 2, rol: 'admin', email: 'test@admin.com', nombre: 'Test Admin' }, JWT_SECRET, { expiresIn: '8h' });

fetch('http://localhost:3001/api/usuarios/3/rol', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ rol: 'attendee' })
}).then(r => r.json()).then(console.log).catch(console.error);
