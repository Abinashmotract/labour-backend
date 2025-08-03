const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL;

async function testMigration() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB');

        // Get the Contracter model
        const Contracter = mongoose.model('Contracter', new mongoose.Schema({
            fullName: String,
            email: String,
            phoneNumber: String,
            address: String,
            work_category: String,
            password: String,
            profilePicture: String,
            gender: String,
            role: String,
            profileCompletionStep: String,
            isActive: { type: Boolean, default: true }
        }, { timestamps: true }));

        // Check contractors before migration
        console.log('\n=== BEFORE MIGRATION ===');
        const contractorsBefore = await Contracter.find({}).limit(3);
        console.log('Sample contractors before migration:');
        contractorsBefore.forEach(contractor => {
            console.log(`- ${contractor.fullName} (${contractor.email}): isActive = ${contractor.isActive}`);
        });

        // Run the migration
        console.log('\n=== RUNNING MIGRATION ===');
        const result = await Contracter.updateMany(
            { isActive: { $exists: false } },
            { $set: { isActive: true } }
        );
        console.log(`Updated ${result.modifiedCount} contractors with isActive field`);

        // Check contractors after migration
        console.log('\n=== AFTER MIGRATION ===');
        const contractorsAfter = await Contracter.find({}).limit(3);
        console.log('Sample contractors after migration:');
        contractorsAfter.forEach(contractor => {
            console.log(`- ${contractor.fullName} (${contractor.email}): isActive = ${contractor.isActive}`);
        });

        // Count statistics
        const totalContractors = await Contracter.countDocuments();
        const activeContractors = await Contracter.countDocuments({ isActive: true });
        const inactiveContractors = await Contracter.countDocuments({ isActive: false });
        const contractorsWithField = await Contracter.countDocuments({ isActive: { $exists: true } });

        console.log('\n=== STATISTICS ===');
        console.log(`Total contractors: ${totalContractors}`);
        console.log(`Active contractors: ${activeContractors}`);
        console.log(`Inactive contractors: ${inactiveContractors}`);
        console.log(`Contractors with isActive field: ${contractorsWithField}`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testMigration(); 