const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BarberShop = require('./models/BarberShop');

// Load environment variables
dotenv.config();

// Sample barber data at user's location (23.0225, 72.5714)
const sampleBarbers = [
  {
    name: 'Sanskar Hair Studio',
    ownerName: 'Sanskar',
    ownerPhone: '9876543210',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225]
    },
    address: {
      street: 'Main Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `sanskar-hair-studio-${Date.now()}`,
    averageRating: 4.5,
    totalReviews: 150,
    services: ['haircut', 'shave', 'beard-trim', 'styling'],
    operatingHours: {
      opening: '09:00',
      closing: '20:00'
    },
    isActive: true
  },
  {
    name: 'Amrut Salon',
    ownerName: 'Amrut Singh',
    ownerPhone: '9876543211',
    location: {
      type: 'Point',
      coordinates: [72.5750, 23.0250]
    },
    address: {
      street: 'Station Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `amrut-salon-${Date.now() + 1}`,
    averageRating: 4.7,
    totalReviews: 200,
    services: ['haircut', 'shave', 'styling', 'facial'],
    operatingHours: {
      opening: '08:00',
      closing: '21:00'
    },
    isActive: true
  },
  {
    name: 'Test Shop',
    ownerName: 'Test Owner',
    ownerPhone: '9876543212',
    location: {
      type: 'Point',
      coordinates: [72.5680, 23.0200]
    },
    address: {
      street: 'College Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `test-shop-${Date.now() + 2}`,
    averageRating: 4.2,
    totalReviews: 89,
    services: ['haircut', 'shave'],
    operatingHours: {
      opening: '10:00',
      closing: '19:00'
    },
    isActive: true
  },
  {
    name: 'Premium Cuts',
    ownerName: 'Rajesh Kumar',
    ownerPhone: '9876543213',
    location: {
      type: 'Point',
      coordinates: [72.5800, 23.0280]
    },
    address: {
      street: 'Highway Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `premium-cuts-${Date.now() + 3}`,
    averageRating: 4.8,
    totalReviews: 320,
    services: ['haircut', 'shave', 'haircut-shave', 'styling', 'beard-trim'],
    operatingHours: {
      opening: '09:00',
      closing: '22:00'
    },
    isActive: true
  },
  {
    name: 'Style Zone',
    ownerName: 'Vikram Patel',
    ownerPhone: '9876543214',
    location: {
      type: 'Point',
      coordinates: [72.5650, 23.0230]
    },
    address: {
      street: 'Market Area',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `style-zone-${Date.now() + 4}`,
    averageRating: 4.6,
    totalReviews: 175,
    services: ['haircut', 'styling', 'facial'],
    operatingHours: {
      opening: '10:00',
      closing: '20:00'
    },
    isActive: true
  },
  {
    name: 'Royal Hair Salon',
    ownerName: 'Jay Shah',
    ownerPhone: '9876543215',
    location: {
      type: 'Point',
      coordinates: [72.5760, 23.0190]
    },
    address: {
      street: 'GID Campus Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `royal-hair-salon-${Date.now() + 5}`,
    averageRating: 4.4,
    totalReviews: 95,
    services: ['haircut', 'shave', 'beard-trim'],
    operatingHours: {
      opening: '09:30',
      closing: '20:30'
    },
    isActive: true
  },
  {
    name: 'Modern Cuts',
    ownerName: 'Hardik Desai',
    ownerPhone: '9876543216',
    location: {
      type: 'Point',
      coordinates: [72.5700, 23.0300]
    },
    address: {
      street: 'Temple Road',
      city: 'Changa',
      state: 'Gujarat',
      pincode: '388421'
    },
    shopId: `modern-cuts-${Date.now() + 6}`,
    averageRating: 4.3,
    totalReviews: 112,
    services: ['haircut', 'shave', 'styling'],
    operatingHours: {
      opening: '09:00',
      closing: '20:00'
    },
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barber-queue');
    console.log('✅ Connected to MongoDB');

    await BarberShop.deleteMany({});
    console.log('🗑️  Cleared existing barber shop data');

    const createdShops = await BarberShop.insertMany(sampleBarbers);
    console.log(`✅ Created ${createdShops.length} barber shops`);

    createdShops.forEach((shop, index) => {
      console.log(`\n${index + 1}. ${shop.name}`);
      console.log(`   Location: [${shop.location.coordinates[0]}, ${shop.location.coordinates[1]}]`);
      console.log(`   Address: ${shop.address.street}, ${shop.address.city}`);
      console.log(`   Rating: ${shop.averageRating} ⭐ (${shop.totalReviews} reviews)`);
    });

    console.log('\n✅ Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit();
  }
};

seedDatabase();
