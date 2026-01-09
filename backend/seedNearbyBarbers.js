const mongoose = require('mongoose');
const Barber = require('./models/Barber');

/**
 * Seed barbers near user's current location: 22.5981, 72.8237
 * Creates shops within 2km radius
 */

const barbersNearUser = [
  {
    password: "password123",
    shopName: "Royal Cuts Barber Shop",
    ownerName: "Rajesh Patel",
    phone: "9876543210",
    email: "royal@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8250, 22.5990] // ~150m away
    },
    address: {
      street: "Shop 12, Ghod Dod Road",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.7,
    totalRatings: 245,
    currentQueueLength: 3,
    averageWaitTime: 20,
    services: ["haircut", "shave", "beard-trim", "styling"],
    isOpen: true,
    openingTime: "09:00",
    closingTime: "21:00",
    hasParking: true,
    hasAC: true,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Classic Barber Lounge",
    ownerName: "Kiran Shah",
    phone: "9876543211",
    email: "classic@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8270, 22.5970] // ~400m away
    },
    address: {
      street: "Ground Floor, Citylight Complex",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.5,
    totalRatings: 189,
    currentQueueLength: 5,
    averageWaitTime: 18,
    services: ["haircut", "shave", "haircut-shave", "facial"],
    isOpen: true,
    openingTime: "10:00",
    closingTime: "20:00",
    hasParking: false,
    hasAC: true,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Style Studio Men's Salon",
    ownerName: "Amit Desai",
    phone: "9876543212",
    email: "style@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8220, 22.5995] // ~300m away
    },
    address: {
      street: "Near Parle Point",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.8,
    totalRatings: 312,
    currentQueueLength: 2,
    averageWaitTime: 15,
    services: ["haircut", "styling", "beard-trim", "facial"],
    isOpen: true,
    openingTime: "09:30",
    closingTime: "21:30",
    hasParking: true,
    hasAC: true,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Gents Hair Studio",
    ownerName: "Dipak Kumar",
    phone: "9876543213",
    email: "gents@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8300, 22.6000] // ~700m away
    },
    address: {
      street: "Ring Road, Near Big Bazaar",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.3,
    totalRatings: 156,
    currentQueueLength: 4,
    averageWaitTime: 22,
    services: ["haircut", "shave", "haircut-shave"],
    isOpen: true,
    openingTime: "08:00",
    closingTime: "20:00",
    hasParking: false,
    hasAC: false,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Premium Cuts & Shaves",
    ownerName: "Vishal Mehta",
    phone: "9876543214",
    email: "premium@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8190, 22.5965] // ~600m away
    },
    address: {
      street: "VIP Road, Opposite Galaxy Cinema",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.9,
    totalRatings: 421,
    currentQueueLength: 6,
    averageWaitTime: 25,
    services: ["haircut", "shave", "styling", "beard-trim", "facial"],
    isOpen: true,
    openingTime: "10:00",
    closingTime: "22:00",
    hasParking: true,
    hasAC: true,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Quick Cuts Express",
    ownerName: "Mahesh Rao",
    phone: "9876543215",
    email: "quick@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8260, 22.6010] // ~900m away
    },
    address: {
      street: "Athwa Gate Main Road",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.2,
    totalRatings: 98,
    currentQueueLength: 1,
    averageWaitTime: 12,
    services: ["haircut", "shave"],
    isOpen: true,
    openingTime: "08:30",
    closingTime: "19:30",
    hasParking: false,
    hasAC: false,
    status: "active"
  },
  {
    password: "password123",
    shopName: "Elite Men's Grooming",
    ownerName: "Suresh Joshi",
    phone: "9876543216",
    email: "elite@barbershop.com",
    location: {
      type: "Point",
      coordinates: [72.8330, 22.5980] // ~1.5km away
    },
    address: {
      street: "Althan, Near L&T Circle",
      city: "Surat",
      state: "Gujarat",
      zipCode: "395007",
      country: "India"
    },
    rating: 4.6,
    totalRatings: 278,
    currentQueueLength: 7,
    averageWaitTime: 30,
    services: ["haircut", "shave", "styling", "beard-trim", "facial", "other"],
    isOpen: true,
    openingTime: "09:00",
    closingTime: "21:00",
    hasParking: true,
    hasAC: true,
    status: "active"
  }
];

async function seedBarbers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/barber-queue');

    console.log('🗑️  Clearing existing barbers...');
    await Barber.deleteMany({});

    console.log('🌱 Seeding barbers near location 22.5981, 72.8237...');
    const createdBarbers = await Barber.insertMany(barbersNearUser);

    console.log(`✅ Successfully seeded ${createdBarbers.length} barbers!`);
    console.log('\n📍 Barber Locations:');
    createdBarbers.forEach((barber, index) => {
      const [lng, lat] = barber.location.coordinates;
      console.log(`${index + 1}. ${barber.shopName}`);
      console.log(`   Location: ${lat}, ${lng}`);
      console.log(`   Queue: ${barber.currentQueueLength} people`);
      console.log(`   Rating: ${barber.rating} ⭐`);
      console.log('');
    });

    console.log('✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedBarbers();
