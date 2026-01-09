const mongoose = require('mongoose');
const Barber = require('./models/Barber');

async function addNearbyBarbers() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/barber-queue');
    console.log('Connected to MongoDB');
    
    // User location from screenshot: 22.5981, 72.8237
    const userLat = 22.5981;
    const userLon = 72.8237;
    
    console.log(`\n📍 Adding barbers near user location: ${userLat}, ${userLon}\n`);
    
    // Create barbers within 5km of the user's location
    const barbersToAdd = [
      {
        shopName: "Classic Cuts Salon",
        ownerName: "Rajesh Kumar",
        email: "classiccuts@example.com",
        password: "password123",
        phone: "9876543210",
        location: {
          type: "Point",
          coordinates: [72.8250, 22.6000] // ~2.1 km away
        },
        address: {
          street: "123 Main Street",
          city: "Ahmedabad",
          state: "Gujarat",
          zipCode: "380001",
          country: "India"
        },
        services: ["haircut", "shave", "beard-trim"],
        openingTime: "09:00",
        closingTime: "21:00",
        rating: 4.5,
        hasParking: true,
        hasAC: true,
        isOpen: true,
        status: "active"
      },
      {
        shopName: "Royal Barbershop",
        ownerName: "Amit Shah",
        email: "royalbarbershop@example.com",
        password: "password123",
        phone: "9876543211",
        location: {
          type: "Point",
          coordinates: [72.8300, 22.6020] // ~2.8 km away
        },
        address: {
          street: "456 MG Road",
          city: "Ahmedabad",
          state: "Gujarat",
          zipCode: "380002",
          country: "India"
        },
        services: ["haircut", "shave", "styling", "facial"],
        openingTime: "10:00",
        closingTime: "22:00",
        rating: 4.7,
        hasParking: false,
        hasAC: true,
        isOpen: true,
        status: "active"
      },
      {
        shopName: "Modern Style Studio",
        ownerName: "Vikas Patel",
        email: "modernstyle@example.com",
        password: "password123",
        phone: "9876543212",
        location: {
          type: "Point",
          coordinates: [72.8200, 22.5950] // ~1.5 km away
        },
        address: {
          street: "789 CG Road",
          city: "Ahmedabad",
          state: "Gujarat",
          zipCode: "380009",
          country: "India"
        },
        services: ["haircut", "shave", "beard-trim", "styling"],
        openingTime: "08:00",
        closingTime: "20:00",
        rating: 4.3,
        hasParking: true,
        hasAC: true,
        isOpen: true,
        status: "active"
      },
      {
        shopName: "Trendy Cuts",
        ownerName: "Karan Desai",
        email: "trendycuts@example.com",
        password: "password123",
        phone: "9876543213",
        location: {
          type: "Point",
          coordinates: [72.8220, 22.6030] // ~2.5 km away
        },
        address: {
          street: "321 Ashram Road",
          city: "Ahmedabad",
          state: "Gujarat",
          zipCode: "380006",
          country: "India"
        },
        services: ["haircut", "styling", "haircut-shave"],
        openingTime: "09:30",
        closingTime: "21:30",
        rating: 4.6,
        hasParking: true,
        hasAC: false,
        isOpen: true,
        status: "active"
      },
      {
        shopName: "Elite Grooming Lounge",
        ownerName: "Suresh Mehta",
        email: "elitegrooming@example.com",
        password: "password123",
        phone: "9876543214",
        location: {
          type: "Point",
          coordinates: [72.8280, 22.5970] // ~1.8 km away
        },
        address: {
          street: "567 SG Highway",
          city: "Ahmedabad",
          state: "Gujarat",
          zipCode: "380015",
          country: "India"
        },
        services: ["haircut", "shave", "beard-trim", "facial", "styling"],
        openingTime: "10:00",
        closingTime: "22:00",
        rating: 4.8,
        hasParking: true,
        hasAC: true,
        isOpen: true,
        status: "active"
      }
    ];
    
    console.log(`📝 Creating ${barbersToAdd.length} barber shops...\n`);
    
    for (const barberData of barbersToAdd) {
      try {
        const barber = await Barber.create(barberData);
        console.log(`✅ Created: ${barber.shopName} (shopId: ${barber.shopId})`);
        console.log(`   Location: ${barber.location.coordinates[1]}, ${barber.location.coordinates[0]}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Skipped: ${barberData.shopName} (already exists)`);
        } else {
          console.error(`❌ Error creating ${barberData.shopName}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ Done! Testing nearby query...\n');
    
    // Test the query
    const nearbyBarbers = await Barber.findNearby(userLon, userLat, 5000);
    console.log(`🎉 Found ${nearbyBarbers.length} barbers within 5km of user location\n`);
    
    nearbyBarbers.forEach((barber, i) => {
      const distance = barber.getDistance(userLon, userLat);
      console.log(`${i + 1}. ${barber.shopName} - ${distance} km`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addNearbyBarbers();
