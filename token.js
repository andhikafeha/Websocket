const jwt = require('jsonwebtoken');

const token = jwt.sign({ user_id: '67890' }, 'test1', { expiresIn: '1h' });
console.log('Generated Token:', token);
