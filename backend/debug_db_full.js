const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
const dotenv = require('dotenv');

dotenv.config();

const inspectAllData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue');

        console.log('--- Barbers ---');
        const barbers = await Barber.find({});
        console.log(`Found ${barbers.length} barbers`);
        if (barbers.length > 0) {
            console.log(JSON.stringify(barbers, null, 2));
        }

        console.log('\n--- BarberShops ---');
        const shops = await BarberShop.find({});
        console.log(`Found ${shops.length} shops`);
        if (shops.length > 0) {
            console.log(JSON.stringify(shops, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectAllData();
