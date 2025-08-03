# MongoDB Commands to Fix Contractor Role Issue

## Connect to MongoDB
```bash
mongosh "mongodb+srv://abinash0870:enZcTUPxEkRotWtz@cluster0.5ipp2rp.mongodb.net/motract-app"
```

## Check Current Roles
```javascript
// Switch to your database
use motract-app

// Check contractors with wrong role
db.contracters.find({ role: "contracter" })

// Count contractors with wrong role
db.contracters.countDocuments({ role: "contracter" })

// Show all contractors and their roles
db.contracters.find({}, { fullName: 1, email: 1, role: 1 })
```

## Fix the Role Issue
```javascript
// Update all contractors with wrong role to correct role
db.contracters.updateMany(
    { role: "contracter" },
    { $set: { role: "contractor" } }
)

// Verify the fix
db.contracters.countDocuments({ role: "contracter" })
db.contracters.countDocuments({ role: "contractor" })
```

## Complete Fix Script
```javascript
// Complete role fix script
use motract-app

print("=== FIXING CONTRACTOR ROLES ===")

// Check before fix
const beforeCount = db.contracters.countDocuments({ role: "contracter" })
print(`Contractors with wrong role before fix: ${beforeCount}`)

// Apply fix
const result = db.contracters.updateMany(
    { role: "contracter" },
    { $set: { role: "contractor" } }
)

print(`Updated ${result.modifiedCount} contractors`)

// Verify after fix
const afterCount = db.contracters.countDocuments({ role: "contracter" })
const correctCount = db.contracters.countDocuments({ role: "contractor" })

print(`Contractors with wrong role after fix: ${afterCount}`)
print(`Contractors with correct role: ${correctCount}`)

// Show all contractors
print("\n=== ALL CONTRACTORS ===")
db.contracters.find({}, { fullName: 1, email: 1, role: 1, isActive: 1 }).forEach(function(contractor) {
    print(`${contractor.fullName} (${contractor.email}) - Role: ${contractor.role} - Active: ${contractor.isActive}`)
})

print("=== ROLE FIX COMPLETED ===")
```

## Test the API After Fix
```bash
# Test the API with the fixed data
curl -X PATCH http://localhost:3512/api/admin/contractors/688f54251f1b9c420937bfe3 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk3MTcsImV4cCI6MTc1NDg0NDUxN30.GCYIV-aHp-P-kcnDGTPpe9QTbHJ3No88efzxkyjKhp8" \
  -H "Content-Type: application/json" \
  -d '{"isApproved": false}'
``` 