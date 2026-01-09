const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/barber-queue')
  .then(async () => {
    console.log('Connected to MongoDB');

    // Check indexes on Barber collection
    const db = mongoose.connection.db;
    
    console.log('\n=== BARBER COLLECTION INDEXES ===');
    const barberIndexes = await db.collection('barbers').indexes();
    console.log(JSON.stringify(barberIndexes, null, 2));

    console.log('\n=== BARBERSHOP COLLECTION INDEXES ===');
    const barberShopIndexes = await db.collection('barbershops').indexes();
    console.log(JSON.stringify(barberShopIndexes, null, 2));

    await mongoose.connection.close();
    process.exit();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
