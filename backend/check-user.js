const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name')
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    const user = await User.findOne({ email: 'megagigdev@gmail.com' }).lean();
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Has password hash:', !!user.passwordHash);
      console.log('WorkplaceId:', user.workplaceId);
    } else {
      console.log('User not found');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });