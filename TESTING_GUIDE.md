# Quick Test Guide - Nearby Barbers Feature

## 🚀 Quick Start

### 1. Verify MongoDB Index
```bash
# Connect to MongoDB
mongo

# Switch to database
use queuecut

# Check if 2dsphere index exists
db.barbers.getIndexes()
```

**Expected output should include:**
```json
{
  "key": { "location": "2dsphere" },
  "name": "location_2dsphere"
}
```

If not found, the index is auto-created by the Barber model schema.

---

### 2. Seed Sample Barbers (Within 2km)

Run one of the existing seed scripts:
```bash
cd backend
node seedBarbers2.js
# OR
node seedMultipleCities.js
```

**Sample coordinates for testing (Surat, India):**
- User Location: `21.1702, 72.8311`
- Barber 1: `21.1720, 72.8350` (~400m away)
- Barber 2: `21.1680, 72.8280` (~350m away)
- Barber 3: `21.1850, 72.8450` (~1.8km away)

---

### 3. Start Backend Server
```bash
cd backend
npm install
npm start
```

Server runs on: `http://localhost:5000`

---

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🧪 Testing Flow

### Test 1: Customer Login → Nearby Barbers

1. Open browser: `http://localhost:5173`
2. Click **"I'm a Customer"**
3. Enter name: `John Doe`
4. Enter phone: `9876543210`
5. Click **"Create Account"**

**Expected:**
- Redirected to `/find-barbers`
- Browser asks for location permission
- Shows barbers within 2 km
- Displays distance, queue length, ETA

---

### Test 2: Geolocation Permission

**Grant Permission:**
```
✅ Location detected
✅ Barbers loaded within 2 km
```

**Deny Permission:**
```
⚠️ "Location permission denied"
📍 Shows manual location input option
```

**Use manual location:**
1. Enter Latitude: `21.1702`
2. Enter Longitude: `72.8311`
3. Click **"Search Here"**

---

### Test 3: Offline Mode

**Method 1: Browser DevTools**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Select "Offline" from throttling dropdown
4. Refresh page
```

**Expected:**
- Shows cached barbers (if previously loaded)
- Orange banner: "📡 Showing cached data. Last updated: X mins ago"
- Refresh button visible

**Method 2: JavaScript Console**
```javascript
// Simulate offline
window.dispatchEvent(new Event('offline'));

// Wait 5 seconds, then go online
setTimeout(() => {
  window.dispatchEvent(new Event('online'));
}, 5000);
```

**Expected:**
- Offline banner appears immediately
- Data auto-refreshes when online

---

### Test 4: Cache Inspection

**Check localStorage:**
```javascript
// In browser console
console.log('Cached Barbers:', 
  JSON.parse(localStorage.getItem('queuecut_nearby_barbers'))
);

console.log('User Location:', 
  JSON.parse(localStorage.getItem('queuecut_user_location'))
);

console.log('Last Fetch:', 
  new Date(parseInt(localStorage.getItem('queuecut_last_fetch')))
);
```

**Clear cache manually:**
```javascript
localStorage.removeItem('queuecut_nearby_barbers');
localStorage.removeItem('queuecut_user_location');
localStorage.removeItem('queuecut_last_fetch');
```

---

### Test 5: API Direct Testing

**Using cURL:**
```bash
# Test nearby endpoint
curl "http://localhost:5000/api/barbers/nearby?lat=21.1702&lng=72.8311&radius=2000"
```

**Using Postman/Thunder Client:**
```
GET http://localhost:5000/api/barbers/nearby
Query Params:
  lat: 21.1702
  lng: 72.8311
  radius: 2000
```

**Expected Response:**
```json
{
  "status": "success",
  "count": 3,
  "radius": "2 km",
  "userLocation": {
    "latitude": 21.1702,
    "longitude": 72.8311
  },
  "data": [...]
}
```

---

### Test 6: WebSocket → Polling Fallback

**Simulate WebSocket failure:**

1. Join a queue from frontend
2. Stop backend server:
   ```bash
   # Ctrl+C in backend terminal
   ```
3. Wait 30 seconds

**Expected:**
- Console logs: "⚠️ WebSocket disconnected"
- Console logs: "🔄 Switching to polling fallback"
- Page continues to work with cached data

4. Restart server:
   ```bash
   npm start
   ```

**Expected:**
- Console logs: "✅ Reconnected"
- Fresh data loaded

---

### Test 7: Radius Adjustment

**Change radius in FindBarbers component:**
```javascript
// Edit: frontend/src/components/FindBarbers.js
const [radius, setRadius] = useState(5); // Change to 5 km

// OR use the UI radius selector
// Select 2km, 5km, 10km, 15km options
```

**Verify:**
- More barbers appear with larger radius
- Distance text updates correctly

---

## 🐛 Common Issues & Fixes

### Issue 1: "No barbers found within 2 km"

**Cause:** No seeded barbers nearby

**Fix:**
```bash
# Run seed script with coordinates near your test location
cd backend
node seedBarbers2.js
```

**OR manually insert:**
```javascript
// In MongoDB shell
use queuecut
db.barbers.insertOne({
  shopName: "Test Barber",
  ownerName: "Test Owner",
  phone: "9999999999",
  location: {
    type: "Point",
    coordinates: [72.8311, 21.1702] // [lng, lat]
  },
  address: { city: "Surat" },
  services: ["haircut"],
  status: "active",
  isOpen: true,
  currentQueueLength: 0,
  averageWaitTime: 15,
  rating: 4.5
});
```

---

### Issue 2: "Location permission denied"

**Fix:** Use manual location input
1. Click "Enter Manually"
2. Use test coordinates:
   - Surat: `21.1702, 72.8311`
   - Mumbai: `19.0760, 72.8777`
   - Delhi: `28.6139, 77.2090`

---

### Issue 3: Offline mode not working

**Fix:**
```javascript
// Check if service worker is blocking
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear all cache
localStorage.clear();
sessionStorage.clear();
```

---

### Issue 4: WebSocket not connecting

**Check:**
1. Backend server running?
2. CORS configured?
3. Port 5000 available?

**Debug:**
```javascript
// In browser console
import realtimeService from './services/realtimeService';
realtimeService.connect();
console.log('Connection mode:', realtimeService.getConnectionMode());
```

---

## 📊 Expected Behavior Summary

| Feature | Expected Behavior |
|---------|------------------|
| **Login** | Redirects to `/find-barbers` |
| **Location** | Requests GPS → Shows 2km barbers |
| **Distance** | Sorted nearest first |
| **Queue** | Shows live count + ETA |
| **Offline** | Orange banner + cached data |
| **Online** | Auto-refreshes on reconnect |
| **No barbers** | Shows "No barbers nearby" message |
| **Radius change** | Re-fetches with new radius |

---

## 🎯 Success Criteria

- ✅ Customer can see barbers within 2 km after login
- ✅ Distances are accurate (±100m tolerance)
- ✅ Queue lengths update in real-time
- ✅ Offline mode shows cached data with timestamp
- ✅ Auto-refresh works on reconnection
- ✅ Manual location input works as fallback
- ✅ WebSocket falls back to polling gracefully

---

## 🔍 Monitoring & Debugging

### Browser Console Logs

**Normal flow:**
```
📍 Your current location: {lat: 21.17, lng: 72.83}
🔍 View on map: https://www.google.com/maps?q=...
✅ WebSocket connected
📡 Subscribed to queue updates via WebSocket
```

**Offline flow:**
```
⚠️ Using cached location
🔴 Offline mode activated
⚠️ Network error, attempting to use cached data
```

**Reconnect flow:**
```
🟢 Back online - refreshing data...
✅ Reconnected after 2 attempts
```

---

## 📱 Mobile Testing

**Chrome DevTools Device Emulation:**
1. F12 → Toggle device toolbar
2. Select iPhone 12 Pro / Pixel 5
3. Enable geolocation override:
   ```javascript
   // Custom coordinates
   Latitude: 21.1702
   Longitude: 72.8311
   ```

**Real device testing:**
1. Connect phone to same WiFi as dev machine
2. Get your machine's local IP: `ipconfig` / `ifconfig`
3. On phone, visit: `http://192.168.x.x:5173`

---

## 🚀 Production Deployment Verification

Before deploying:

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Test production build
npm run preview

# 3. Verify environment variables
echo $VITE_API_URL  # Should be production API URL

# 4. Check MongoDB connection
# Ensure production DB has 2dsphere index

# 5. Test offline mode in production build
# Service Worker should handle caching
```

---

**Last Updated:** January 3, 2026  
**Test Status:** ✅ All tests passing
