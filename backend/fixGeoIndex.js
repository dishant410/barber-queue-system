/**
 * Fix Geospatial Index Error
 * 
 * Drops and recreates the 2dsphere index on Customer collection as sparse
 * This allows customers without location data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barber-queue';

async function fixGeoIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');

    // Check current indexes
    console.log('📊 Current indexes on customers collection:');
    const indexes = await customersCollection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the old location_2dsphere index if it exists
    console.log('\n🗑️  Dropping old location_2dsphere index...');
    try {
      await customersCollection.dropIndex('location_2dsphere');
      console.log('✅ Old index dropped');
    } catch (error) {
      console.log('⚠️  Index might not exist:', error.message);
    }

    // Create new sparse 2dsphere index
    console.log('\n🔧 Creating new sparse 2dsphere index...');
    await customersCollection.createIndex(
      { location: '2dsphere' },
      { 
        sparse: true, // Allow documents without location field
        name: 'location_2dsphere'
      }
    );
    console.log('✅ New sparse index created');

    // Fix existing customers with invalid location data
    console.log('\n🔍 Checking for customers with invalid location data...');
    const invalidCustomers = await customersCollection.find({
      'location.type': 'Point',
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': [] },
        { 'location.coordinates': null }
      ]
    }).toArray();

    if (invalidCustomers.length > 0) {
      console.log(`⚠️  Found ${invalidCustomers.length} customers with invalid location data`);
      
      for (const customer of invalidCustomers) {
        console.log(`   Fixing: ${customer.name} (${customer.email})`);
        await customersCollection.updateOne(
          { _id: customer._id },
          { $unset: { location: '' } } // Remove invalid location field
        );
      }
      console.log('✅ Fixed all invalid location data');
    } else {
      console.log('✅ No invalid location data found');
    }

    // Verify new indexes
    console.log('\n📊 Updated indexes:');
    const newIndexes = await customersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)} ${index.sparse ? '(sparse)' : ''}`);
    });

    console.log('\n✅ Geospatial index fixed successfully!');
    console.log('   Customers can now be created without location data.');
    
    await mongoose.connection.close();
    console.log('\n📦 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixGeoIndex();
