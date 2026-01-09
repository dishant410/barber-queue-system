/**
 * Test Nearby Query - See if barber appears
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Your barber's location
const BARBER_LOCATION = {
  latitude: 22.3051776,
  longitude: 73.1807744
};

async function testNearbyQuery() {
  console.log('🔍 Testing Nearby Barbers Query\n');
  
  // Test 1: Search from exact barber location
  console.log('Test 1: Search from EXACT barber location');
  console.log(`Location: [${BARBER_LOCATION.latitude}, ${BARBER_LOCATION.longitude}]\n`);
  
  try {
    const response1 = await axios.get(`${API_URL}/barbers/nearby`, {
      params: {
        lat: BARBER_LOCATION.latitude,
        lng: BARBER_LOCATION.longitude,
        radius: 5000
      }
    });
    
    console.log(`✅ Found ${response1.data.count} barber(s)`);
    if (response1.data.data && response1.data.data.length > 0) {
      response1.data.data.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.shopName} - ${b.distanceText} away`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Search from 1 km away
  console.log('Test 2: Search from 1 km away');
  const lat1km = BARBER_LOCATION.latitude + 0.009; // ~1 km north
  console.log(`Location: [${lat1km}, ${BARBER_LOCATION.longitude}]\n`);
  
  try {
    const response2 = await axios.get(`${API_URL}/barbers/nearby`, {
      params: {
        lat: lat1km,
        lng: BARBER_LOCATION.longitude,
        radius: 5000
      }
    });
    
    console.log(`✅ Found ${response2.data.count} barber(s)`);
    if (response2.data.data && response2.data.data.length > 0) {
      response2.data.data.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.shopName} - ${b.distanceText} away`);
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Search from 10 km away (should NOT find)
  console.log('Test 3: Search from 10 km away (should be empty)');
  const lat10km = BARBER_LOCATION.latitude + 0.09; // ~10 km north
  console.log(`Location: [${lat10km}, ${BARBER_LOCATION.longitude}]\n`);
  
  try {
    const response3 = await axios.get(`${API_URL}/barbers/nearby`, {
      params: {
        lat: lat10km,
        lng: BARBER_LOCATION.longitude,
        radius: 5000
      }
    });
    
    console.log(`✅ Found ${response3.data.count} barber(s)`);
    if (response3.data.count === 0) {
      console.log('   (Correct - barber is outside 5 km radius)');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📍 YOUR BARBER LOCATION:');
  console.log(`   Latitude: ${BARBER_LOCATION.latitude}`);
  console.log(`   Longitude: ${BARBER_LOCATION.longitude}`);
  console.log(`   View on Google Maps:`);
  console.log(`   https://www.google.com/maps?q=${BARBER_LOCATION.latitude},${BARBER_LOCATION.longitude}\n`);
  
  console.log('💡 TIP: Customers must be within 5 km of this location to see your barber!');
  console.log('   You can test by entering these coordinates manually in the app.\n');
}

testNearbyQuery().catch(console.error);
