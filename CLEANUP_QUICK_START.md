# 🧹 Quick Database Cleanup

## Remove Dummy/Test Data - Show Only Real Registered Barbers

Your database has dummy data. Customers should only see **real barber shops** you registered.

---

## ⚡ Quick Fix (30 seconds)

### Step 1: Check what customers see
```bash
cd backend
node checkRealBarbers.js
```

### Step 2: Hide dummy data
```bash
node markDummyData.js
```

### Step 3: Verify
```bash
node checkRealBarbers.js
```

**Done!** ✅ Customers now see only real barbers.

---

## What Changed?

### Before:
- Customers saw ALL barbers (including test/dummy data)
- Mixed real and fake shops

### After:
- ✅ Customers see **only real registered barbers**
- 🧪 Test data is **automatically hidden**
- Database query filters: `isTestData: { $ne: true }`

---

## Available Scripts

| Command | What It Does |
|---------|--------------|
| `node checkRealBarbers.js` | See what customers will see |
| `node markDummyData.js` | Hide test data (recommended) |
| `node cleanDummyData.js` | Delete test data permanently |
| `node cleanDummyData.js --all` | Delete EVERYTHING (⚠️ use carefully) |

---

## Example Output

```bash
$ node checkRealBarbers.js

📊 DATABASE SUMMARY
===================

Barber Collection:
   Total: 15
   ✅ Real (visible to customers): 1
   🧪 Test/Dummy (hidden): 14

👥 CUSTOMER VIEW:
   Customers will see: 1 barber shops

✅ REAL BARBERS:
   1. Your Real Shop
      Shop ID: real-shop-123
      Owner: Your Name
      Phone: 9876543210
      Location: [21.1702, 72.8311]
```

---

## How It Works

### Automatic Filtering

The nearby barbers query now **automatically excludes test data**:

```javascript
// Only fetch real barbers
Barber.find({
  location: { $near: { ... } },
  status: 'active',
  isTestData: { $ne: true }  // ← Filters out test data
})
```

### Test Data Identification

Scripts identify dummy data by:
- Names: "test", "dummy", "sample", "Modern Cuts", etc.
- Shop IDs: "shop-1", "shop-2", "barber-shop-*"
- Phones: "1234567890", "9999999999"

---

## Need More Details?

See full guide: [DATABASE_CLEANUP_GUIDE.md](DATABASE_CLEANUP_GUIDE.md)

---

**Status:** ✅ Ready to use  
**Impact:** Customers see only real registered barbers  
**Safe:** Test data is hidden, not deleted (unless you choose to delete)
