const mongoose = require('mongoose');
const Barber = require('./models/Barber');

async function checkBarbers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/barber-queue');
    console.log('Connected to MongoDB');
    
    const count = await Barber.countDocuments();
    console.log(`\n📊 Total barbers in database: ${count}`);
    
    const barbers = await Barber.find({}).limit(5);
    console.log('\n📍 First 5 barbers:');
    barbers.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.shopName}`);
      console.log(`   Coordinates: [${b.location.coordinates[0]}, ${b.location.coordinates[1]}]`);
      console.log(`   Status: ${b.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBarbers();
