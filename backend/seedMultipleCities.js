const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BarberShop = require('./models/BarberShop');

dotenv.config();

// Barbers in MULTIPLE cities across India
const multiCityBarbers = [
  // ===== SURAT, GUJARAT =====
  {
    name: 'Surat Style Hub',
    ownerName: 'Ravi Patel',
    ownerPhone: '9123456701',
    location: {
      type: 'Point',
      coordinates: [72.8311, 21.1702] // Surat city center
    },
    address: {
      street: 'Ring Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395002'
    },
    shopId: `surat-style-hub-${Date.now()}`,
    averageRating: 4.6,
    totalReviews: 220,
    services: ['haircut', 'shave', 'beard-trim', 'styling'],
    operatingHours: { opening: '09:00', closing: '21:00' },
    isActive: true
  },
  {
    name: 'Diamond City Salon',
    ownerName: 'Kiran Shah',
    ownerPhone: '9123456702',
    location: {
      type: 'Point',
      coordinates: [72.8400, 21.1750] // ~1km from center
    },
    address: {
      street: 'Athwa Lines',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007'
    },
    shopId: `diamond-city-salon-${Date.now() + 1}`,
    averageRating: 4.7,
    totalReviews: 310,
    services: ['haircut', 'shave', 'styling', 'facial'],
    operatingHours: { opening: '08:00', closing: '22:00' },
    isActive: true
  },
  {
    name: 'Textile Hub Cuts',
    ownerName: 'Mehul Desai',
    ownerPhone: '9123456703',
    location: {
      type: 'Point',
      coordinates: [72.8250, 21.1680]
    },
    address: {
      street: 'Nanpura',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395001'
    },
    shopId: `textile-hub-cuts-${Date.now() + 2}`,
    averageRating: 4.5,
    totalReviews: 180,
    services: ['haircut', 'shave', 'beard-trim'],
    operatingHours: { opening: '10:00', closing: '20:00' },
    isActive: true
  },

  // ===== MUMBAI, MAHARASHTRA =====
  {
    name: 'Mumbai Premium Cuts',
    ownerName: 'Arjun Kapoor',
    ownerPhone: '9123456704',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760] // Mumbai - Bandra
    },
    address: {
      street: 'Linking Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050'
    },
    shopId: `mumbai-premium-cuts-${Date.now() + 3}`,
    averageRating: 4.9,
    totalReviews: 450,
    services: ['haircut', 'shave', 'styling', 'facial', 'beard-trim'],
    operatingHours: { opening: '09:00', closing: '23:00' },
    isActive: true
  },
  {
    name: 'Bollywood Styles',
    ownerName: 'Salman Khan',
    ownerPhone: '9123456705',
    location: {
      type: 'Point',
      coordinates: [72.8700, 19.0800]
    },
    address: {
      street: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050'
    },
    shopId: `bollywood-styles-${Date.now() + 4}`,
    averageRating: 4.8,
    totalReviews: 520,
    services: ['haircut', 'styling', 'beard-trim'],
    operatingHours: { opening: '10:00', closing: '22:00' },
    isActive: true
  },

  // ===== AHMEDABAD, GUJARAT =====
  {
    name: 'Heritage Hair Studio',
    ownerName: 'Chirag Patel',
    ownerPhone: '9123456706',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225] // Ahmedabad
    },
    address: {
      street: 'CG Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380009'
    },
    shopId: `heritage-hair-studio-${Date.now() + 5}`,
    averageRating: 4.6,
    totalReviews: 280,
    services: ['haircut', 'shave', 'beard-trim', 'styling'],
    operatingHours: { opening: '09:00', closing: '21:00' },
    isActive: true
  },
  {
    name: 'Sabarmati Salon',
    ownerName: 'Pratik Shah',
    ownerPhone: '9123456707',
    location: {
      type: 'Point',
      coordinates: [72.5650, 23.0280]
    },
    address: {
      street: 'Ashram Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380013'
    },
    shopId: `sabarmati-salon-${Date.now() + 6}`,
    averageRating: 4.4,
    totalReviews: 195,
    services: ['haircut', 'shave', 'facial'],
    operatingHours: { opening: '08:00', closing: '20:00' },
    isActive: true
  },

  // ===== DELHI =====
  {
    name: 'Capital Cuts',
    ownerName: 'Rohit Sharma',
    ownerPhone: '9123456708',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // Delhi - Connaught Place
    },
    address: {
      street: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    shopId: `capital-cuts-${Date.now() + 7}`,
    averageRating: 4.7,
    totalReviews: 380,
    services: ['haircut', 'shave', 'styling', 'beard-trim'],
    operatingHours: { opening: '09:00', closing: '22:00' },
    isActive: true
  },

  // ===== PUNE, MAHARASHTRA =====
  {
    name: 'Oxford Hair Lounge',
    ownerName: 'Nikhil Joshi',
    ownerPhone: '9123456709',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204] // Pune
    },
    address: {
      street: 'FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004'
    },
    shopId: `oxford-hair-lounge-${Date.now() + 8}`,
    averageRating: 4.5,
    totalReviews: 240,
    services: ['haircut', 'shave', 'styling'],
    operatingHours: { opening: '10:00', closing: '21:00' },
    isActive: true
  },

  // ===== BANGALORE, KARNATAKA =====
  {
    name: 'Silicon Valley Salon',
    ownerName: 'Suresh Kumar',
    ownerPhone: '9123456710',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716] // Bangalore
    },
    address: {
      street: 'MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    shopId: `silicon-valley-salon-${Date.now() + 9}`,
    averageRating: 4.8,
    totalReviews: 420,
    services: ['haircut', 'shave', 'styling', 'beard-trim', 'facial'],
    operatingHours: { opening: '09:00', closing: '22:00' },
    isActive: true
  }
];

const seedMultipleCities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barber-queue');
    console.log('✅ Connected to MongoDB');

    await BarberShop.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const created = await BarberShop.insertMany(multiCityBarbers);
    console.log(`\n✅ Created ${created.length} barber shops across India!`);

    // Group by city
    const cities = {};
    created.forEach(shop => {
      if (!cities[shop.address.city]) {
        cities[shop.address.city] = [];
      }
      cities[shop.address.city].push(shop);
    });

    console.log('\n📍 Barbers by City:\n');
    Object.keys(cities).forEach(city => {
      console.log(`\n🏙️  ${city.toUpperCase()} (${cities[city].length} shops)`);
      cities[city].forEach((shop, idx) => {
        console.log(`   ${idx + 1}. ${shop.name} - ${shop.address.street}`);
        console.log(`      📍 [${shop.location.coordinates[0]}, ${shop.location.coordinates[1]}]`);
        console.log(`      ⭐ ${shop.averageRating} (${shop.totalReviews} reviews)`);
      });
    });

    console.log('\n\n🌟 DYNAMIC LOCATION SYSTEM ACTIVE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ When user in Surat opens app → Shows Surat barbers');
    console.log('✅ When user in Mumbai opens app → Shows Mumbai barbers');
    console.log('✅ When user in Delhi opens app → Shows Delhi barbers');
    console.log('✅ System automatically detects location & filters within 5km!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database closed');
    process.exit();
  }
};

seedMultipleCities();
