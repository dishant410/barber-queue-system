/**
 * Clean Dummy/Test Data from Database
 * 
 * This script removes all dummy barber shops and keeps only real registered ones.
 * Run with: node cleanDummyData.js
 */

const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-queue';

/**
 * Identify and remove dummy/test data
 */
async function cleanDummyData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Count before deletion
    const barberCountBefore = await Barber.countDocuments();
    const shopCountBefore = await BarberShop.countDocuments();
    
    console.log('\n📊 Current Database Status:');
    console.log(`   Barber collection: ${barberCountBefore} documents`);
    console.log(`   BarberShop collection: ${shopCountBefore} documents`);

    // Strategy 1: Remove barbers with test/dummy indicators in shopId or name
    const dummyIndicators = [
      'test', 'dummy', 'sample', 'seed', 'demo', 'example',
      'barber-shop-', 'shop-1', 'shop-2', 'shop-3', 'shop-4', 'shop-5',
      'modern-cuts', 'classic-cuts', 'style-studio', 'trim-time', 'sharp-cuts'
    ];

    // Build regex pattern for dummy detection
    const dummyPattern = dummyIndicators.join('|');
    const regex = new RegExp(dummyPattern, 'i');

    console.log('\n🔍 Identifying dummy data...');

    // Find dummy barbers
    const dummyBarbers = await Barber.find({
      $or: [
        { shopId: regex },
        { shopName: regex },
        { ownerName: regex },
        { phone: /^(1234567890|9999999999|0000000000)$/ } // Common test phone numbers
      ]
    });

    // Find dummy shops
    const dummyShops = await BarberShop.find({
      $or: [
        { shopId: regex },
        { name: regex },
        { ownerName: regex },
        { ownerPhone: /^(1234567890|9999999999|0000000000)$/ }
      ]
    });

    console.log(`\n📋 Found ${dummyBarbers.length} dummy barbers`);
    console.log(`📋 Found ${dummyShops.length} dummy shops`);

    if (dummyBarbers.length > 0) {
      console.log('\n🗑️  Dummy Barbers to be deleted:');
      dummyBarbers.forEach((barber, i) => {
        console.log(`   ${i + 1}. ${barber.shopName} (shopId: ${barber.shopId})`);
      });
    }

    if (dummyShops.length > 0) {
      console.log('\n🗑️  Dummy Shops to be deleted:');
      dummyShops.forEach((shop, i) => {
        console.log(`   ${i + 1}. ${shop.name} (shopId: ${shop.shopId})`);
      });
    }

    // Prompt for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n⚠️  Delete all dummy data? (yes/no): ', async (answer) => {
        readline.close();

        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          // Delete dummy data
          const deletedBarbers = await Barber.deleteMany({
            $or: [
              { shopId: regex },
              { shopName: regex },
              { ownerName: regex },
              { phone: /^(1234567890|9999999999|0000000000)$/ }
            ]
          });

          const deletedShops = await BarberShop.deleteMany({
            $or: [
              { shopId: regex },
              { name: regex },
              { ownerName: regex },
              { ownerPhone: /^(1234567890|9999999999|0000000000)$/ }
            ]
          });

          console.log('\n✅ Cleanup Complete!');
          console.log(`   🗑️  Deleted ${deletedBarbers.deletedCount} barbers`);
          console.log(`   🗑️  Deleted ${deletedShops.deletedCount} shops`);

          // Count after deletion
          const barberCountAfter = await Barber.countDocuments();
          const shopCountAfter = await BarberShop.countDocuments();

          console.log('\n📊 Final Database Status:');
          console.log(`   Barber collection: ${barberCountAfter} documents`);
          console.log(`   BarberShop collection: ${shopCountAfter} documents`);

          // List remaining real barbers
          const realBarbers = await Barber.find().select('shopName shopId phone');
          const realShops = await BarberShop.find().select('name shopId ownerPhone');

          if (realBarbers.length > 0) {
            console.log('\n✅ Real Barbers (from Barber collection):');
            realBarbers.forEach((barber, i) => {
              console.log(`   ${i + 1}. ${barber.shopName} - ${barber.shopId} - ${barber.phone}`);
            });
          }

          if (realShops.length > 0) {
            console.log('\n✅ Real Shops (from BarberShop collection):');
            realShops.forEach((shop, i) => {
              console.log(`   ${i + 1}. ${shop.name} - ${shop.shopId} - ${shop.ownerPhone}`);
            });
          }

          if (realBarbers.length === 0 && realShops.length === 0) {
            console.log('\n⚠️  No real barbers/shops found! Database is now empty.');
            console.log('   Please register a real barber shop through the registration form.');
          }

        } else {
          console.log('\n❌ Cleanup cancelled');
        }

        await mongoose.connection.close();
        console.log('\n📦 Database connection closed');
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Alternative: Delete ALL data (use with caution)
async function cleanAllData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('⚠️  WARNING: Delete ALL barbers and shops? (yes/no): ', async (answer) => {
        readline.close();

        if (answer.toLowerCase() === 'yes') {
          await Barber.deleteMany({});
          await BarberShop.deleteMany({});
          
          console.log('✅ All data deleted! Database is now empty.');
          console.log('   Please register real barber shops through the registration form.');
        } else {
          console.log('❌ Operation cancelled');
        }

        await mongoose.connection.close();
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the appropriate cleanup based on command line argument
const args = process.argv.slice(2);

if (args.includes('--all')) {
  console.log('🗑️  DELETE ALL MODE\n');
  cleanAllData();
} else {
  console.log('🧹 SMART CLEANUP MODE (removes only dummy/test data)\n');
  cleanDummyData();
}
