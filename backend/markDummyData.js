/**
 * Mark Dummy Data as Test Data
 * 
 * This script identifies dummy/test barbers and marks them with isTestData: true
 * so they are excluded from customer queries.
 * 
 * Run with: node markDummyData.js
 */

const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue';

async function markDummyData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Dummy indicators
    const dummyIndicators = [
      'test', 'dummy', 'sample', 'seed', 'demo', 'example',
      'barber-shop-', 'shop-1', 'shop-2', 'shop-3', 'shop-4', 'shop-5',
      'modern-cuts', 'classic-cuts', 'style-studio', 'trim-time', 'sharp-cuts',
      'elite-salon', 'gents-salon', 'urban-style'
    ];

    const dummyPattern = dummyIndicators.join('|');
    const regex = new RegExp(dummyPattern, 'i');

    // Find and mark dummy barbers
    const dummyBarbers = await Barber.find({
      $or: [
        { shopId: regex },
        { shopName: regex },
        { ownerName: regex },
        { phone: /^(1234567890|9999999999|0000000000)$/ }
      ]
    });

    // Find and mark dummy shops
    const dummyShops = await BarberShop.find({
      $or: [
        { shopId: regex },
        { name: regex },
        { ownerName: regex },
        { ownerPhone: /^(1234567890|9999999999|0000000000)$/ }
      ]
    });

    console.log('📊 Analysis:');
    console.log(`   Found ${dummyBarbers.length} dummy barbers`);
    console.log(`   Found ${dummyShops.length} dummy shops\n`);

    if (dummyBarbers.length > 0) {
      console.log('🏪 Dummy Barbers to be marked:');
      dummyBarbers.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.shopName} (${b.shopId})`);
      });
    }

    if (dummyShops.length > 0) {
      console.log('\n🏪 Dummy Shops to be marked:');
      dummyShops.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.shopId})`);
      });
    }

    // Mark as test data
    const barberResult = await Barber.updateMany(
      {
        $or: [
          { shopId: regex },
          { shopName: regex },
          { ownerName: regex },
          { phone: /^(1234567890|9999999999|0000000000)$/ }
        ]
      },
      { $set: { isTestData: true } }
    );

    const shopResult = await BarberShop.updateMany(
      {
        $or: [
          { shopId: regex },
          { name: regex },
          { ownerName: regex },
          { ownerPhone: /^(1234567890|9999999999|0000000000)$/ }
        ]
      },
      { $set: { isTestData: true } }
    );

    console.log('\n✅ Marking Complete!');
    console.log(`   ✓ Marked ${barberResult.modifiedCount} barbers as test data`);
    console.log(`   ✓ Marked ${shopResult.modifiedCount} shops as test data\n`);

    // Show real barbers (isTestData: false or not set)
    const realBarbers = await Barber.find({ 
      $or: [
        { isTestData: false },
        { isTestData: { $exists: false } }
      ]
    }).select('shopName shopId phone isTestData');

    const realShops = await BarberShop.find({ 
      $or: [
        { isTestData: false },
        { isTestData: { $exists: false } }
      ]
    }).select('name shopId ownerPhone isTestData');

    console.log('✅ Real Barbers (will be shown to customers):');
    if (realBarbers.length > 0) {
      realBarbers.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.shopName} - ${b.shopId}`);
      });
    } else {
      console.log('   (None - all barbers are marked as test data)');
    }

    console.log('\n✅ Real Shops (will be shown to customers):');
    if (realShops.length > 0) {
      realShops.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} - ${s.shopId}`);
      });
    } else {
      console.log('   (None - all shops are marked as test data)');
    }

    if (realBarbers.length === 0 && realShops.length === 0) {
      console.log('\n⚠️  WARNING: No real barbers found!');
      console.log('   Customers will see an empty list.');
      console.log('   Please register a real barber shop through the registration form.\n');
    }

    await mongoose.connection.close();
    console.log('\n📦 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

markDummyData();
