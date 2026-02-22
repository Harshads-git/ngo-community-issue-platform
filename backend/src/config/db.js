require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n🧪 Testing MongoDB Connection...\n');

// Simple connection test
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB Connected!\n');
    console.log('📍 Connection Details:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}\n`);
    console.log('🎉 Your database setup is working perfectly!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CONNECTION FAILED!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Common Solutions:');
    console.error('1. Check if MONGODB_URI is set in .env file');
    console.error('2. Verify your password in the connection string');
    console.error('3. Make sure 0.0.0.0/0 is whitelisted in MongoDB Atlas');
    console.error('4. Check your internet connection\n');
    process.exit(1);
  });
