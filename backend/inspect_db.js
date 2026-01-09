const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const inspectData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue');

        const barbers = await Barber.find({});
        fs.writeFileSync('barber_data.json', JSON.stringify(barbers, null, 2));
        console.log('Data written to barber_data.json');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectData();
