const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

console.log('MONGO_URI is:', process.env.MONGO_URI ? 'DEFINED' : 'UNDEFINED');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

const inspect = async () => {
    await connectDB();

    const Barber = require('./models/Barber');
    const BarberShop = require('./models/BarberShop');

    console.log('\n--- Checking Barber Collection ---');
    const barbers = await Barber.find({});
    console.log(`Total Barbers: ${barbers.length}`);
    barbers.forEach(b => {
        console.log(`- ${b.shopName} (${b.email}): [${b.location.coordinates}] Status: ${b.status}`);
    });

    console.log('\n--- Checking BarberShop Collection ---');
    const shops = await BarberShop.find({});
    console.log(`Total BarberShops: ${shops.length}`);
    shops.forEach(s => {
        console.log(`- ${s.name}: [${s.location.coordinates}] Active: ${s.isActive}`);
    });

    // Test Query
    const lat = 22.5981;
    const lon = 72.8237;
    console.log(`\n--- Testing Geospatial Query for [${lon}, ${lat}] ---`);

    try {
        const nearbyBarbers = await Barber.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    $maxDistance: 500000 // 500km just to be sure
                }
            }
        });
        console.log(`Found ${nearbyBarbers.length} barbers near location (500km radius).`);
        nearbyBarbers.forEach(b => {
            const dist = getDistance(lon, lat, b.location.coordinates[0], b.location.coordinates[1]);
            console.log(`- ${b.shopName}: ${dist.toFixed(2)} km away`);
        });

    } catch (err) {
        console.error('Query Error:', err.message);
    }

    process.exit();
};

function getDistance(lon1, lat1, lon2, lat2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

inspect();
