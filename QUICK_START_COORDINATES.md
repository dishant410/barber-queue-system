# 🚀 Quick Start Guide - Coordinate-Based Barber Discovery (5 km Radius)

## Overview
This guide shows how to use the **5 km radius coordinate-based barber discovery system** where customer and barber shop locations are the highest priority.

---

## 📱 Customer Flow

### 1. **Login/Open App**

When a customer logs in or opens the app:

```javascript
// Frontend automatically:
1. Requests location permission
2. Gets customer's current coordinates (latitude, longitude)
3. Sends coordinates to backend for storage
4. Displays nearby barbers within 5 km
```

**What happens behind the scenes:**
```javascript
// Location captured
const location = await locationService.getCurrentLocation(userId);
// { latitude: 21.1702, longitude: 72.8311 }

// Sent to backend
await authService.updateCustomerLocation(location.latitude, location.longitude);

// Fetch nearby barbers (5 km)
const barbers = await locationService.getNearbyBarbers(
  location.latitude, 
  location.longitude, 
  5000
);
```

---

### 2. **View Nearby Barbers**

Navigate to `/nearby-barbers` to see shops within 5 km:

**Display shows:**
- ✅ Shop name
- ✅ Distance (e.g., "0.8 km" or "450 m")
- ✅ Full address
- ✅ Rating (e.g., 4.5/5)
- ✅ Current queue length
- ✅ Estimated wait time
- ✅ Open/Closed status

**Sorted by:** Distance (nearest first)

---

## 🏪 Barber Shop Registration Flow

### 1. **Register Shop with Coordinates**

When registering a barber shop, **latitude and longitude are mandatory**:

**Endpoint:** `POST /api/barbers/register`

```json
{
  "name": "Modern Cuts Salon",
  "ownerName": "John Doe",
  "ownerPhone": "9876543210",
  "latitude": 21.1702,
  "longitude": 72.8311,
  "address": {
    "street": "123 MG Road",
    "city": "Surat",
    "state": "Gujarat",
    "pincode": "395001"
  },
  "services": ["haircut", "shave", "styling"],
  "operatingHours": {
    "opening": "09:00",
    "closing": "20:00"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "shopId": "shop-1704704400000-abc123",
    "location": {
      "type": "Point",
      "coordinates": [72.8311, 21.1702]
    },
    "message": "Barber shop registered successfully"
  }
}
```

---

## 🔍 API Usage

### **Get Nearby Barbers (5 km Radius)**

**Endpoint:** `GET /api/barbers/nearby`

**Required Parameters:**
- `lat` or `latitude` - Customer's latitude
- `lng` or `longitude` - Customer's longitude

**Optional Parameters:**
- `radius` - Search radius in meters (default: 5000)

**Examples:**

```bash
# Default 5 km radius
GET http://localhost:5000/api/barbers/nearby?lat=21.1702&lng=72.8311

# Custom 2 km radius
GET http://localhost:5000/api/barbers/nearby?lat=21.1702&lng=72.8311&radius=2000

# Using latitude/longitude instead of lat/lng
GET http://localhost:5000/api/barbers/nearby?latitude=21.1702&longitude=72.8311
```

**Response Format:**
```json
{
  "status": "success",
  "count": 5,
  "radius": "5 km",
  "userLocation": {
    "latitude": 21.1702,
    "longitude": 72.8311
  },
  "data": [
    {
      "shopName": "Modern Cuts Salon",
      "distance": 0.8,
      "distanceText": "0.8 km",
      "address": "123 MG Road, Surat, Gujarat",
      "rating": 4.5,
      "totalRatings": 120,
      "queueLength": 3,
      "estimatedWaitTime": 45,
      "waitTimeText": "45 min",
      "isOpen": true,
      "coordinates": {
        "latitude": 21.1702,
        "longitude": 72.8311
      }
    }
  ],
  "timestamp": "2026-01-08T10:30:00.000Z"
}
```

---

### **Update Customer Location**

**Endpoint:** `PATCH /api/auth/customer/location`

**Authentication:** Required (Bearer token)

**Request:**
```json
{
  "latitude": 21.1702,
  "longitude": 72.8311,
  "address": {
    "city": "Surat",
    "state": "Gujarat",
    "country": "India"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Location updated successfully",
  "data": {
    "location": {
      "latitude": 21.1702,
      "longitude": 72.8311
    },
    "address": {
      "city": "Surat",
      "state": "Gujarat",
      "country": "India"
    }
  }
}
```

---

## 🧪 Testing

### **Run Test Suite**

```bash
cd backend
node testCoordinateSystem.js
```

**Tests include:**
1. ✅ Customer location update endpoint
2. ✅ Nearby barbers query (5 km)
3. ✅ Different radius values (1km, 2km, 5km, 10km)
4. ✅ Invalid coordinate validation
5. ✅ Response format validation

---

## 📊 Database Queries

### **Check Customer Location**

```javascript
// MongoDB shell
db.customers.findOne({ email: "customer@example.com" }, { location: 1, lastKnownAddress: 1 })
```

**Expected Output:**
```javascript
{
  "_id": ObjectId("..."),
  "location": {
    "type": "Point",
    "coordinates": [72.8311, 21.1702] // [longitude, latitude]
  },
  "lastKnownAddress": {
    "city": "Surat",
    "state": "Gujarat"
  }
}
```

---

### **Check Geospatial Index**

```javascript
// Verify 2dsphere index exists
db.barbershops.getIndexes()
db.customers.getIndexes()
```

**Expected:**
```javascript
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "location": "2dsphere" }, "name": "location_2dsphere" }
]
```

---

### **Manual Geospatial Query**

```javascript
// Find barbers within 5 km of coordinates
db.barbershops.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [72.8311, 21.1702] // [longitude, latitude]
      },
      $maxDistance: 5000 // meters
    }
  },
  isActive: true
})
```

---

## 🛠️ Troubleshooting

### **Issue: No barbers found**

**Solution:**
1. Check if barbers are seeded in database
2. Verify coordinates are within 5 km
3. Ensure barbers have `isActive: true` status

```bash
# Seed test barbers
cd backend
node seedNearbyBarbers.js
```

---

### **Issue: Location permission denied**

**Solution:**
1. Customer: Grant location permission in browser
2. Use manual location entry as fallback
3. Check browser console for errors

**Manual Location Entry:**
```javascript
// Customer can manually enter coordinates
setUserLocation({ latitude: 21.1702, longitude: 72.8311 });
```

---

### **Issue: Distance calculation incorrect**

**Solution:**
1. Verify coordinates are in [longitude, latitude] format (GeoJSON standard)
2. Check 2dsphere index exists
3. Confirm Earth radius constant (6371 km)

---

## 📍 Example Coordinates

Use these for testing in different cities:

| City | Latitude | Longitude |
|------|----------|-----------|
| Surat, Gujarat | 21.1702 | 72.8311 |
| Mumbai, Maharashtra | 19.0760 | 72.8777 |
| Delhi | 28.7041 | 77.1025 |
| Bangalore, Karnataka | 12.9716 | 77.5946 |
| Chennai, Tamil Nadu | 13.0827 | 80.2707 |

---

## 🎯 Best Practices

1. **Always validate coordinates** before storing
2. **Use geospatial indexes** for performance
3. **Cache location** to reduce API calls
4. **Handle permission denial** gracefully
5. **Sort by distance** for better UX
6. **Show distance in readable format** (km/m)

---

## 🔗 Related Documentation

- [Full Implementation Guide](COORDINATE_PRIORITY_IMPLEMENTATION.md)
- [Nearby Barbers Feature](NEARBY_BARBERS_IMPLEMENTATION.md)
- [Testing Guide](TESTING_GUIDE.md)

---

## 📞 Support

For issues or questions:
1. Check [COORDINATE_PRIORITY_IMPLEMENTATION.md](COORDINATE_PRIORITY_IMPLEMENTATION.md)
2. Run test suite: `node testCoordinateSystem.js`
3. Verify database indexes
4. Check backend logs for errors

---

**Last Updated:** January 8, 2026  
**Default Radius:** 5 km (5000 meters)  
**Priority:** Latitude & Longitude Coordinates
