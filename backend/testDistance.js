const mongoose = require('mongoose');
const Barber = require('./models/Barber');

async function testDistance() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/barber-queue');
    console.log('Connected to MongoDB');
    
    // User's location from screenshot
    const userLat = 22.5981;
    const userLon = 72.8237;
    
    console.log(`\n📍 User Location: [${userLon}, ${userLat}]`);
    console.log(`🔗 https://www.google.com/maps?q=${userLat},${userLon}\n`);
    
    // Get all barbers
    const allBarbers = await Barber.find({});
    console.log(`\n📊 Total barbers in database: ${allBarbers.length}\n`);
    
    // Calculate distance to each barber
    allBarbers.forEach((barber, i) => {
      const barberLon = barber.location.coordinates[0];
      const barberLat = barber.location.coordinates[1];
      
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = (barberLat - userLat) * Math.PI / 180;
      const dLon = (barberLon - userLon) * Math.PI / 180;
      
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(barberLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;
      
      console.log(`${i + 1}. ${barber.shopName}`);
      console.log(`   Coordinates: [${barberLon}, ${barberLat}]`);
      console.log(`   🔗 https://www.google.com/maps?q=${barberLat},${barberLon}`);
      console.log(`   Distance: ${distanceKm.toFixed(2)} km`);
      console.log(`   Within 5km?: ${distanceKm <= 5 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Status: ${barber.status}`);
      console.log(`   isOpen: ${barber.isOpen}\n`);
    });
    
    // Test geospatial query
    console.log('\n🔍 Testing geospatial query with 5km radius...');
    const nearbyBarbers = await Barber.findNearby(userLon, userLat, 5000);
    console.log(`Found ${nearbyBarbers.length} barbers within 5km\n`);
    
    // Test with 100km radius
    console.log('🔍 Testing geospatial query with 100km radius...');
    const nearbyBarbers100 = await Barber.findNearby(userLon, userLat, 100000);
    console.log(`Found ${nearbyBarbers100.length} barbers within 100km\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDistance();
