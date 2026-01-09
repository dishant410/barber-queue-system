/**
 * Quick Debug - Check Your Barber Shop
 * 
 * This will show you why your barber isn't showing up for customers
 */

const mongoose = require('mongoose');
const Barber = require('./models/Barber');
const BarberShop = require('./models/BarberShop');
require('dotenv').config();

async function debugBarber() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barber-queue';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all barbers
    const allBarbers = await Barber.find({});
    const allShops = await BarberShop.find({});

    console.log('📊 TOTAL IN DATABASE:');
    console.log(`   Barber collection: ${allBarbers.length}`);
    console.log(`   BarberShop collection: ${allShops.length}\n`);

    if (allBarbers.length > 0) {
      console.log('🔍 BARBER COLLECTION DETAILS:\n');
      
      for (let i = 0; i < allBarbers.length; i++) {
        const b = allBarbers[i];
        console.log(`${i + 1}. ${b.shopName || b.name}`);
        console.log(`   Shop ID: ${b.shopId}`);
        console.log(`   Status: ${b.status}`);
        console.log(`   isTestData: ${b.isTestData || 'not set (will be visible)'}`);
        console.log(`   Location: [${b.location?.coordinates?.[1]}, ${b.location?.coordinates?.[0]}]`);
        console.log(`   Phone: ${b.phone}`);
        console.log(`   Owner: ${b.ownerName}`);
        
        // Check if it will be visible to customers
        const willBeVisible = b.status === 'active' && b.isTestData !== true;
        console.log(`   👁️  VISIBLE TO CUSTOMERS: ${willBeVisible ? '✅ YES' : '❌ NO'}`);
        
        if (!willBeVisible) {
          console.log(`   ⚠️  WHY NOT VISIBLE:`);
          if (b.status !== 'active') {
            console.log(`      - Status is "${b.status}" (needs to be "active")`);
          }
          if (b.isTestData === true) {
            console.log(`      - Marked as test data (isTestData: true)`);
          }
        }
        console.log('');
      }
    }

    if (allShops.length > 0) {
      console.log('🔍 BARBERSHOP COLLECTION DETAILS:\n');
      
      for (let i = 0; i < allShops.length; i++) {
        const s = allShops[i];
        console.log(`${i + 1}. ${s.name}`);
        console.log(`   Shop ID: ${s.shopId}`);
        console.log(`   isActive: ${s.isActive}`);
        console.log(`   isTestData: ${s.isTestData || 'not set (will be visible)'}`);
        console.log(`   Location: [${s.location?.coordinates?.[1]}, ${s.location?.coordinates?.[0]}]`);
        console.log(`   Phone: ${s.ownerPhone}`);
        console.log(`   Owner: ${s.ownerName}`);
        
        // Check if it will be visible to customers
        const willBeVisible = s.isActive && s.isTestData !== true;
        console.log(`   👁️  VISIBLE TO CUSTOMERS: ${willBeVisible ? '✅ YES' : '❌ NO'}`);
        
        if (!willBeVisible) {
          console.log(`   ⚠️  WHY NOT VISIBLE:`);
          if (!s.isActive) {
            console.log(`      - Not active (isActive: false)`);
          }
          if (s.isTestData === true) {
            console.log(`      - Marked as test data (isTestData: true)`);
          }
        }
        console.log('');
      }
    }

    // Show what customers will see
    const visibleBarbers = await Barber.find({
      status: 'active',
      isTestData: { $ne: true }
    });

    const visibleShops = await BarberShop.find({
      isActive: true,
      isTestData: { $ne: true }
    });

    console.log('\n👥 CUSTOMER VIEW (what they will see):');
    console.log(`   Total visible: ${visibleBarbers.length + visibleShops.length} barber shops\n`);

    if (visibleBarbers.length === 0 && visibleShops.length === 0) {
      console.log('❌ NO BARBERS VISIBLE TO CUSTOMERS!\n');
      console.log('🔧 TO FIX THIS, RUN ONE OF THESE COMMANDS:\n');
      
      if (allBarbers.length > 0 || allShops.length > 0) {
        console.log('Option 1: Update your barber to be visible:');
        console.log('   Open MongoDB Compass or shell and run:');
        
        if (allBarbers.length > 0) {
          console.log(`\n   db.barbers.updateOne(`);
          console.log(`     { shopId: "${allBarbers[0].shopId}" },`);
          console.log(`     { $set: { status: "active", isTestData: false } }`);
          console.log(`   )`);
        }
        
        if (allShops.length > 0) {
          console.log(`\n   db.barbershops.updateOne(`);
          console.log(`     { shopId: "${allShops[0].shopId}" },`);
          console.log(`     { $set: { isActive: true, isTestData: false } }`);
          console.log(`   )`);
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  MongoDB is not running!');
      console.log('   Please start MongoDB first.');
    }
    process.exit(1);
  }
}

debugBarber();
