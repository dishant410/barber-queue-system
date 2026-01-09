/**
 * Check Real vs Test Barbers in Database
 * 
 * Shows which barbers will be visible to customers
 * Run with: node checkRealBarbers.js
 */

const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue';

async function checkRealBarbers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Count all
    const totalBarbers = await Barber.countDocuments();
    const totalShops = await BarberShop.countDocuments();

    // Count real (what customers will see)
    const realBarbers = await Barber.countDocuments({ 
      isTestData: { $ne: true },
      status: 'active'
    });
    
    const realShops = await BarberShop.countDocuments({ 
      isTestData: { $ne: true },
      isActive: true
    });

    // Count test data
    const testBarbers = await Barber.countDocuments({ isTestData: true });
    const testShops = await BarberShop.countDocuments({ isTestData: true });

    console.log('📊 DATABASE SUMMARY');
    console.log('===================\n');
    
    console.log('Barber Collection:');
    console.log(`   Total: ${totalBarbers}`);
    console.log(`   ✅ Real (visible to customers): ${realBarbers}`);
    console.log(`   🧪 Test/Dummy (hidden): ${testBarbers}\n`);

    console.log('BarberShop Collection:');
    console.log(`   Total: ${totalShops}`);
    console.log(`   ✅ Real (visible to customers): ${realShops}`);
    console.log(`   🧪 Test/Dummy (hidden): ${testShops}\n`);

    console.log('👥 CUSTOMER VIEW:');
    console.log(`   Customers will see: ${realBarbers + realShops} barber shops\n`);

    // List real barbers
    if (realBarbers > 0) {
      console.log('✅ REAL BARBERS (from Barber collection):');
      const barbers = await Barber.find({ 
        isTestData: { $ne: true },
        status: 'active'
      }).select('shopName shopId phone ownerName location');
      
      barbers.forEach((b, i) => {
        console.log(`\n   ${i + 1}. ${b.shopName}`);
        console.log(`      Shop ID: ${b.shopId}`);
        console.log(`      Owner: ${b.ownerName}`);
        console.log(`      Phone: ${b.phone}`);
        console.log(`      Location: [${b.location.coordinates[1]}, ${b.location.coordinates[0]}]`);
      });
      console.log('');
    }

    // List real shops
    if (realShops > 0) {
      console.log('✅ REAL SHOPS (from BarberShop collection):');
      const shops = await BarberShop.find({ 
        isTestData: { $ne: true },
        isActive: true
      }).select('name shopId ownerPhone ownerName location');
      
      shops.forEach((s, i) => {
        console.log(`\n   ${i + 1}. ${s.name}`);
        console.log(`      Shop ID: ${s.shopId}`);
        console.log(`      Owner: ${s.ownerName}`);
        console.log(`      Phone: ${s.ownerPhone}`);
        console.log(`      Location: [${s.location.coordinates[1]}, ${s.location.coordinates[0]}]`);
      });
      console.log('');
    }

    // List test data (if any)
    if (testBarbers > 0 || testShops > 0) {
      console.log('🧪 TEST DATA (hidden from customers):');
      
      if (testBarbers > 0) {
        const testB = await Barber.find({ isTestData: true }).select('shopName shopId');
        console.log(`\n   Test Barbers (${testBarbers}):`);
        testB.forEach((b, i) => {
          console.log(`      ${i + 1}. ${b.shopName} (${b.shopId})`);
        });
      }

      if (testShops > 0) {
        const testS = await BarberShop.find({ isTestData: true }).select('name shopId');
        console.log(`\n   Test Shops (${testShops}):`);
        testS.forEach((s, i) => {
          console.log(`      ${i + 1}. ${s.name} (${s.shopId})`);
        });
      }
      console.log('');
    }

    // Warning if no real data
    if (realBarbers === 0 && realShops === 0) {
      console.log('⚠️  WARNING: NO REAL BARBERS FOUND!');
      console.log('   Customers will see an empty list when they search.');
      console.log('   \n   To fix this:');
      console.log('   1. Register a barber shop through the registration form');
      console.log('   2. Or run: node markDummyData.js (to review and unmark data)\n');
    }

    await mongoose.connection.close();
    console.log('📦 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkRealBarbers();
