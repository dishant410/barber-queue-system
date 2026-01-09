# 🚀 Nearby Barbers Feature - Setup Guide

## ✨ New Feature: Find Barbers Within 5km Radius

The customer side now includes a location-based barber discovery feature, similar to NextCut app shown in the photo!

### 🎯 Features Added:
- **📍 Geolocation Detection** - Automatically detects customer's location
- **🔍 5km Radius Search** - Shows all barbers within 5km
- **📊 Real-time Queue Info** - See queue length and estimated wait times
- **⭐ Ratings & Reviews** - View barber ratings
- **🗺️ Distance Display** - Shows distance in km or meters
- **🧭 Google Maps Integration** - Get directions to any barber
- **🎨 Modern UI** - Beautiful card-based design like NextCut

---

## 📁 New Files Created:

### Backend:
- ✅ `backend/models/Barber.js` - Barber shop model with geospatial support
- ✅ `backend/controllers/barberController.js` - Barber discovery & management
- ✅ `backend/routes/barberRoutes.js` - API routes for barbers
- ✅ `backend/seedBarbers.js` - Sample data seeding script

### Frontend:
- ✅ `frontend/src/components/NearbyBarbers.js` - Main nearby barbers component
- ✅ `frontend/src/styles/NearbyBarbers.css` - Styling for nearby barbers

### Updated Files:
- ✅ `backend/server.js` - Added barber routes
- ✅ `frontend/src/App.js` - Added /nearby route
- ✅ `frontend/src/components/Home.js` - Updated customer button
- ✅ `frontend/src/services/queueService.js` - Added barber API methods

---

## 🛠️ Setup Instructions:

### Step 1: Seed Sample Barber Data
```bash
cd backend
npm run seed
```

This will create 5 sample barber shops with different locations around Bangalore. **Note:** Update the coordinates in `seedBarbers.js` to match your actual location for testing.

### Step 2: Update Coordinates (Important!)
Edit `backend/seedBarbers.js` and update the coordinates to your location:
1. Go to https://www.latlong.net/
2. Search for your location
3. Copy latitude and longitude
4. Update the coordinates in the sample data

Example:
```javascript
location: {
  type: 'Point',
  coordinates: [YOUR_LONGITUDE, YOUR_LATITUDE] // [lon, lat]
}
```

### Step 3: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Test the Feature
1. Open http://localhost:5173 (or your frontend URL)
2. Click "I'm a Customer"
3. Allow location access when prompted
4. View nearby barbers within 5km radius
5. Click "Join Queue" to join any barber's queue
6. Click "Directions" to get Google Maps directions

---

## 🔧 API Endpoints:

### Get Nearby Barbers
```
GET /api/barbers/nearby?latitude=12.9716&longitude=77.5946&radius=5000
```

### Register New Barber
```
POST /api/barbers/register
Body: {
  shopName: "Shop Name",
  ownerName: "Owner Name",
  phone: "9876543210",
  latitude: 12.9716,
  longitude: 77.5946,
  address: { city: "City Name" }
}
```

### Get All Barbers
```
GET /api/barbers
```

### Get Barber by Shop ID
```
GET /api/barbers/:shopId
```

---

## 📱 How It Works:

1. **Location Detection:**
   - Browser requests user's location permission
   - Gets GPS coordinates (latitude, longitude)

2. **Geospatial Query:**
   - Backend uses MongoDB's 2dsphere index
   - Finds barbers within 5km using $near operator
   - Calculates exact distance using Haversine formula

3. **Enriched Data:**
   - Gets current queue length for each barber
   - Calculates estimated wait time
   - Sorts by distance (nearest first)

4. **Display:**
   - Shows barbers in card layout
   - Displays distance, queue info, ratings
   - Allows joining queue or getting directions

---

## 🎨 UI Features:

- **Gradient Background** - Purple gradient like NextCut
- **Card-Based Layout** - Clean, modern barber cards
- **Star Ratings** - Visual rating display
- **Status Badges** - Open/Closed indicators
- **Queue Statistics** - Current queue & wait time
- **Responsive Design** - Works on mobile & desktop
- **Loading States** - Spinner while fetching
- **Error Handling** - Clear error messages

---

## 🔐 Location Permissions:

The app requires location access to work. If denied:
1. Chrome: Click lock icon → Site settings → Location → Allow
2. Firefox: Click shield icon → Permissions → Location → Allow
3. Safari: Settings → Privacy → Location Services → Enable

---

## 🧪 Testing Tips:

1. **Desktop Testing:**
   - Chrome DevTools → Sensors → Set custom location
   - Use coordinates from seedBarbers.js

2. **Mobile Testing:**
   - Use actual device GPS
   - Or use browser's location override

3. **Different Distances:**
   - Update barber coordinates in database
   - Test with different radius values

---

## 📊 Database Schema:

### Barber Model:
```javascript
{
  shopName: String,
  ownerName: String,
  phone: String,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]  // GeoJSON format
  },
  address: { street, city, state, zipCode },
  rating: Number (0-5),
  services: Array,
  isOpen: Boolean,
  openingTime: String,
  closingTime: String,
  averageWaitTime: Number (minutes)
}
```

---

## 🚀 Future Enhancements:

- [ ] Filter by rating, services, wait time
- [ ] Real-time queue updates via WebSocket
- [ ] Booking/appointment system
- [ ] User reviews and ratings
- [ ] Barber photos/gallery
- [ ] Push notifications for queue position
- [ ] Favorite barbers
- [ ] Price information

---

## 🐛 Troubleshooting:

**Issue: No barbers showing**
- Check if sample data is seeded: `npm run seed`
- Verify coordinates match your location
- Check browser console for errors

**Issue: Location not working**
- Allow location permissions in browser
- Check HTTPS (geolocation requires HTTPS in production)
- Try different browser

**Issue: Distance incorrect**
- Coordinates must be [longitude, latitude] order
- Verify GeoJSON format in database

---

## 📝 Notes:

- MongoDB geospatial queries require coordinates in [longitude, latitude] order
- 2dsphere index is automatically created on location field
- Default radius is 5000 meters (5km)
- Distance calculations use Haversine formula for accuracy

---

**Enjoy the new nearby barbers feature! 💈✨**
