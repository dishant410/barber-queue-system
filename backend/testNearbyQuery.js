const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/barber-queue')
  .then(async () => {
    console.log('Connected to MongoDB');

    // User's current location
    const userLat = 22.5980937;
    const userLon = 72.8237365;
    const maxDistance = 5000;

    console.log(`\n🔍 Searching for barbers near: ${userLat}, ${userLon} within ${maxDistance}m (${maxDistance/1000}km)`);

    const Barber = mongoose.model('Barber', new mongoose.Schema({}, { strict: false }));
    
    // Test the exact query used in the controller
    const barbers = await Barber.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLon, userLat]
          },
          $maxDistance: maxDistance
        }
      },
      status: 'active'
    }).limit(50);

    console.log(`\n✅ Found ${barbers.length} barbers from Barber collection`);
    
    barbers.forEach((b, i) => {
      // Calculate distance manually
      const R = 6371; // Earth's radius in km
      const dLat = (userLat - b.location.coordinates[1]) * Math.PI / 180;
      const dLon = (userLon - b.location.coordinates[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(b.location.coordinates[1] * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      console.log(`\n${i + 1}. ${b.shopName}`);
      console.log(`   ShopId: ${b.shopId}`);
      console.log(`   Location: [${b.location.coordinates[0]}, ${b.location.coordinates[1]}]`);
      console.log(`   Distance: ${distance.toFixed(2)} km (${(distance * 1000).toFixed(0)} m)`);
      console.log(`   Status: ${b.status}`);
      console.log(`   IsOpen: ${b.isOpen}`);
    });

    // Also check all barbers without distance filter
    console.log('\n\n--- ALL BARBERS (no distance filter) ---');
    const allBarbers = await Barber.find({ status: 'active' });
    console.log(`Total active barbers: ${allBarbers.length}`);
    
    allBarbers.forEach((b) => {
      const R = 6371;
      const dLat = (userLat - b.location.coordinates[1]) * Math.PI / 180;
      const dLon = (userLon - b.location.coordinates[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(b.location.coordinates[1] * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      console.log(`\n${b.shopName}: ${distance.toFixed(2)} km - ${distance <= 5 ? '✅ WITHIN 5km' : '❌ TOO FAR'}`);
    });

    await mongoose.connection.close();
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
