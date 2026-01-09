const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/barber-queue')
  .then(async () => {
    console.log('Connected to MongoDB');

    // Check Barber collection
    const Barber = mongoose.model('Barber', new mongoose.Schema({}, { strict: false }));
    const barbers = await Barber.find({});
    
    console.log('\n=== BARBER COLLECTION ===');
    console.log('Total barbers:', barbers.length);
    barbers.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.shopName || b.name}`);
      console.log('   ShopId:', b.shopId || b._id);
      console.log('   Location:', b.location?.coordinates);
      console.log('   IsOpen:', b.isOpen);
      console.log('   Status:', b.status);
    });

    // Check BarberShop collection
    const BarberShop = mongoose.model('BarberShop', new mongoose.Schema({}, { strict: false }));
    const barberShops = await BarberShop.find({});
    
    console.log('\n\n=== BARBERSHOP COLLECTION ===');
    console.log('Total barbershops:', barberShops.length);
    barberShops.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.shopName || b.name}`);
      console.log('   ShopId:', b.shopId || b._id);
      console.log('   Location:', b.location?.coordinates);
      console.log('   IsOpen:', b.isOpen);
      console.log('   IsActive:', b.isActive);
    });

    await mongoose.connection.close();
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
