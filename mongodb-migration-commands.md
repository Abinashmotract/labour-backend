# MongoDB Shell Commands for Contractor isActive Field

## Connect to MongoDB
```bash
mongosh "your_mongodb_connection_string"
```

## 1. Check Current State
First, let's see how many contractors exist and which ones don't have the `isActive` field:

```javascript
// Switch to your database
use your_database_name

// Count total contractors
db.contracters.countDocuments()

// Count contractors without isActive field
db.contracters.countDocuments({ isActive: { $exists: false } })

// Show sample contractors without isActive field
db.contracters.find({ isActive: { $exists: false } }).limit(3)
```

## 2. Add isActive Field to All Existing Contractors
```javascript
// Update all contractors that don't have isActive field
db.contracters.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
)
```

## 3. Verify the Update
```javascript
// Count contractors with isActive field
db.contracters.countDocuments({ isActive: { $exists: true } })

// Show sample contractors with isActive field
db.contracters.find({}, { fullName: 1, email: 1, isActive: 1 }).limit(5)

// Check statistics
db.contracters.aggregate([
    {
        $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } }
        }
    }
])
```

## 4. Update Specific Contractor
If you want to update a specific contractor:

```javascript
// Update by ID
db.contracters.updateOne(
    { _id: ObjectId("688f7dc4e021926e16a840b6") },
    { $set: { isActive: true } }
)

// Update by email
db.contracters.updateOne(
    { email: "ravi.snajay@yopmail.com" },
    { $set: { isActive: false } }
)
```

## 5. Bulk Operations
```javascript
// Set all contractors to active
db.contracters.updateMany({}, { $set: { isActive: true } })

// Set all contractors to inactive
db.contracters.updateMany({}, { $set: { isActive: false } })

// Set specific contractors to inactive by work category
db.contracters.updateMany(
    { work_category: "Electrician" },
    { $set: { isActive: false } }
)
```

## 6. Query Examples
```javascript
// Find all active contractors
db.contracters.find({ isActive: true })

// Find all inactive contractors
db.contracters.find({ isActive: false })

// Find contractors by work category and active status
db.contracters.find({ 
    work_category: "Electrician", 
    isActive: true 
})

// Count active vs inactive contractors
db.contracters.aggregate([
    {
        $group: {
            _id: "$isActive",
            count: { $sum: 1 }
        }
    }
])
```

## 7. Complete Migration Script
Here's a complete script you can run in MongoDB shell:

```javascript
// Complete migration script
use your_database_name

print("=== CONTRACTOR MIGRATION SCRIPT ===")

// Check before migration
const beforeCount = db.contracters.countDocuments({ isActive: { $exists: false } })
print(`Contractors without isActive field: ${beforeCount}`)

// Run migration
const result = db.contracters.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
)

print(`Updated ${result.modifiedCount} contractors`)

// Verify after migration
const afterCount = db.contracters.countDocuments({ isActive: { $exists: true } })
const totalCount = db.contracters.countDocuments()

print(`Total contractors: ${totalCount}`)
print(`Contractors with isActive field: ${afterCount}`)

// Show statistics
const stats = db.contracters.aggregate([
    {
        $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } }
        }
    }
]).toArray()

if (stats.length > 0) {
    print(`Active contractors: ${stats[0].active}`)
    print(`Inactive contractors: ${stats[0].inactive}`)
}

print("=== MIGRATION COMPLETED ===")
```

## 8. For Your Specific Contractor
To update the contractor you mentioned:

```javascript
// Update the specific contractor
db.contracters.updateOne(
    { _id: ObjectId("688f7dc4e021926e16a840b6") },
    { $set: { isActive: true } }
)

// Verify the update
db.contracters.findOne({ _id: ObjectId("688f7dc4e021926e16a840b6") })
```

## Notes:
- Replace `your_database_name` with your actual database name
- Replace `your_mongodb_connection_string` with your actual MongoDB connection string
- The `ObjectId()` function is used to convert string IDs to MongoDB ObjectId
- All contractors will be set to `isActive: true` by default
- You can then use the API endpoints to activate/deactivate specific contractors 