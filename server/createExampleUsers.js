require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createExampleUsers() {
  await mongoose.connect(process.env.MONGO_URI);

  const users = [
    {
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      name: 'Anwalt Anton',
      email: 'anwalt@example.com',
      password: 'anwalt123',
      role: 'lawyer'
    },
    {
      name: 'Mandant Maria',
      email: 'mandant@example.com',
      password: 'mandant123',
      role: 'client'
    }
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`${u.role} existiert bereits:`, u.email);
      continue;
    }
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await User.create({
      name: u.name,
      email: u.email,
      password: hashedPassword,
      role: u.role
    });
    console.log(`${u.role} angelegt:`, u.email, 'Passwort:', u.password);
  }
  process.exit();
}

createExampleUsers();