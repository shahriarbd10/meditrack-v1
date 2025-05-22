require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const users = [
  {
    name: 'Pharmacy One',
    email: 'pharmacy1@example.com',
    password: 'pharmacy123',
    role: 'pharmacy',
  },
  {
    name: 'Staff One',
    email: 'staff1@example.com',
    password: 'staff123',
    role: 'staff',
  },
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

async function seed() {
  try {
    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({ ...userData, password: hashedPassword });
        await user.save();
        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`User exists: ${userData.email}`);
      }
    }
    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
