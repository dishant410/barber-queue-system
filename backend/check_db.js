const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue');

        const barberCount = await Barber.countDocuments();
        const barberShopCount = await BarberShop.countDocuments();

        const output = `Barber: ${barberCount}\nBarberShop: ${barberShopCount}`;
        console.log(output);
        fs.writeFileSync('db_counts.txt', output);

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('db_counts.txt', 'Error: ' + error.message);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
