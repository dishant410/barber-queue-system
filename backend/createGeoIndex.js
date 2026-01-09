const mongoose = require('mongoose');
const Barber = require('./models/Barber');

async function createIndex() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/barber-queue');
    console.log('✅ Connected to MongoDB');
    
    // Check existing indexes
    const indexes = await Barber.collection.getIndexes();
    console.log('\n📋 Existing indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    // Create 2dsphere index
    console.log('\n🔧 Creating 2dsphere index on location field...');
    await Barber.collection.createIndex({ location: '2dsphere' });
    console.log('✅ 2dsphere index created successfully!');
    
    // Test geospatial query
    console.log('\n🔍 Testing geospatial query...');
    const nearby = await Barber.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [72.8237, 22.5981]
          },
          $maxDistance: 5000
        }
      }
    }).limit(5);
    
    console.log(`\n✅ Found ${nearby.length} barbers within 5km:`);
    nearby.forEach((b, i) => {
      console.log(`${i + 1}. ${b.shopName}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createIndex();
