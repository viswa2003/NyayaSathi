/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createAdminUser() {
  if (!MONGO_URI) throw new Error('MONGO_URI missing in env');

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  // Admin user details - CHANGE THESE!
  const adminEmail = 'admin@nyayasathi.com';
  const adminUsername = 'Admin';
  const adminPassword = 'admin123'; // Change this to a secure password

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log(`❌ Admin user with email ${adminEmail} already exists.`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // If user exists but is not admin, update role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`✅ Updated existing user to admin role.`);
      }
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const admin = new User({
        username: adminUsername,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin'
      });

      await admin.save();
      console.log(`✅ Admin user created successfully!`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!`);
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdminUser();
