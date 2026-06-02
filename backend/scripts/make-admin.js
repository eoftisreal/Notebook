const mongoose = require('mongoose');
const User = require('../src/models/User');
const env = require('../src/config/env');

async function makeAdmin() {
  const username = process.argv[2];

  if (!username) {
    console.error('Error: Please provide a username.');
    console.error('Usage: npm run make-admin <username>');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB.');

    const user = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: { isAdmin: true } },
      { new: true }
    );

    if (!user) {
      console.error(`Error: User with username "${username}" not found. Please ensure the user has completed signup.`);
      process.exit(1);
    }

    console.log(`Success! User ${user.username} is now an admin.`);
    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

makeAdmin();
