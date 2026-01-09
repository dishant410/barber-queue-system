const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BarberShop = require('./models/BarberShop');

// Load environment variables
dotenv.config();

// Sample barber data for different locations
// Centered around user's current location (23.0225, 72.5714)
// Coordinates spread within 5km radius
const sampleBarbers = [
  {
    shopName: 'Sanskar Hair Studio',
    ownerName: 'Sanskar',
    phone: '9876543210',
    email: 'sanskar@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225] // At user's location
    },
    address: {
      street: 'Main Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.5,
    totalRatings: 150,
    services: ['haircut', 'shave', 'beard-trim', 'styling'],
    openingTime: '09:00',
    closingTime: '20:00',
    isOpen: true,
    hasParking: true,
    hasAC: true,
    averageWaitTime: 15
  },
  {
    shopName: 'Amrut Salon',
    ownerName: 'Amrut Singh',
    phone: '9876543211',
    email: 'amrut@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5750, 23.0250] // ~0.5 km northeast
    },
    address: {
      street: 'Station Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.7,
    totalRatings: 200,
    services: ['haircut', 'shave', 'styling', 'facial'],
    openingTime: '08:00',
    closingTime: '21:00',
    isOpen: true,
    hasParking: false,
    hasAC: true,
    averageWaitTime: 20
  },
  {
    shopName: 'Test Shop',
    ownerName: 'Test Owner',
    phone: '9876543212',
    email: 'test@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5680, 23.0200] // ~0.6 km southwest
    },
    address: {
      street: 'College Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.2,
    totalRatings: 89,
    services: ['haircut', 'shave'],
    openingTime: '10:00',
    closingTime: '19:00',
    isOpen: true,
    hasParking: true,
    hasAC: false,
    averageWaitTime: 10
  },
  {
    shopName: 'Premium Cuts',
    ownerName: 'Rajesh Kumar',
    phone: '9876543213',
    email: 'premium@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5800, 23.0280] // ~1.2 km northeast
    },
    address: {
      street: 'Highway Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.8,
    totalRatings: 320,
    services: ['haircut', 'shave', 'haircut-shave', 'styling', 'beard-trim'],
    openingTime: '09:00',
    closingTime: '22:00',
    isOpen: true,
    hasParking: true,
    hasAC: true,
    averageWaitTime: 25
  },
  {
    shopName: 'Style Zone',
    ownerName: 'Vikram Patel',
    phone: '9876543214',
    email: 'stylezone@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5650, 23.0230] // ~0.8 km west
    },
    address: {
      street: 'Market Area',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.6,
    totalRatings: 175,
    services: ['haircut', 'styling', 'facial'],
    openingTime: '10:00',
    closingTime: '20:00',
    isOpen: true,
    hasParking: false,
    hasAC: true,
    averageWaitTime: 18
  },
  {
    shopName: 'Royal Hair Salon',
    ownerName: 'Jay Shah',
    phone: '9876543215',
    email: 'royal@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5760, 23.0190] // ~1.8 km southeast
    },
    address: {
      street: 'GID Campus Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.4,
    totalRatings: 95,
    services: ['haircut', 'shave', 'beard-trim'],
    openingTime: '09:30',
    closingTime: '20:30',
    isOpen: true,
    hasParking: true,
    hasAC: true,
    averageWaitTime: 12
  },
  {
    shopName: 'Modern Cuts',
    ownerName: 'Hardik Desai',
    phone: '9876543216',
    email: 'modern@example.com',
    location: {
      type: 'Point',
      coordinates: [72.5700, 23.0300] // ~1.3 km northwest
    },
    address: {
      street: 'Temple Road',
      city: 'Changa',
      state: 'Gujarat',
      zipCode: '388421',
      country: 'India'
    },
    rating: 4.3,
    totalRatings: 112,
    services: ['haircut', 'styling'],
    openingTime: '10:00',
    closingTime: '21:00',
    isOpen: true,
    hasParking: false,
    hasAC: false,
    averageWaitTime: 8
  }
];

// Connect to MongoDB and seed data
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing barbers
    await BarberShop.deleteMany({});
    console.log('🗑️  Cleared existing barber data');

    // Insert sample barbers
    const createdBarbers = await BarberShop.insertMany(sampleBarbers);
    console.log(`✅ Successfully created ${createdBarbers.length} sample barbers`);

    // Display created barbers
    console.log('\n📋 Created Barbers in Changa, Gujarat:');
    createdBarbers.forEach((barber, index) => {
      console.log(`\n${index + 1}. ${barber.shopName}`);
      console.log(`   Shop ID: ${barber.shopId}`);
      console.log(`   Location: [${barber.location.coordinates[0]}, ${barber.location.coordinates[1]}]`);
      console.log(`   Address: ${barber.address.street}, ${barber.address.city}`);
      console.log(`   Rating: ${barber.rating} ⭐`);
      console.log(`   Status: ${barber.status}`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📍 All salons are now located in Changa, Gujarat (within 5km radius)');
    console.log('   The system automatically detects YOUR location and shows nearby salons.');
    console.log('\nℹ️  When you visit the app, it will:');
    console.log('   1. Detect your current GPS location');
    console.log('   2. Search for salons within 5km of YOU');
    console.log('   3. Update dynamically as you move to different areas');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit();
  }
};

// Run the seed function
seedDatabase();
