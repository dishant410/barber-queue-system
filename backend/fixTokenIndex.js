/**
 * Fix Duplicate Token Number Index Error
 * 
 * Recreates the shopId_tokenNumber index as a partial index
 * This allows multiple customers with tokenNumber: null
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/barber-queue';

async function fixTokenIndex() {
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

    // Drop the old shopId_tokenNumber index
    console.log('\n🗑️  Dropping old shopId_1_tokenNumber_1 index...');
    try {
      await customersCollection.dropIndex('shopId_1_tokenNumber_1');
      console.log('✅ Old index dropped');
    } catch (error) {
      console.log('⚠️  Index might not exist:', error.message);
    }

    // Create new partial index (only index where tokenNumber is a number)
    console.log('\n🔧 Creating new partial index...');
    await customersCollection.createIndex(
      { shopId: 1, tokenNumber: 1 },
      { 
        unique: true,
        partialFilterExpression: { tokenNumber: { $type: 'number' } },
        name: 'shopId_1_tokenNumber_1'
      }
    );
    console.log('✅ New partial index created');
    console.log('   This allows multiple customers with tokenNumber: null');

    // Verify new indexes
    console.log('\n📊 Updated indexes:');
    const newIndexes = await customersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.partialFilterExpression) {
        console.log(`     Partial: ${JSON.stringify(index.partialFilterExpression)}`);
      }
    });

    console.log('\n✅ Token number index fixed successfully!');
    console.log('   Multiple customers can now have tokenNumber: null');
    
    await mongoose.connection.close();
    console.log('\n📦 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixTokenIndex();
