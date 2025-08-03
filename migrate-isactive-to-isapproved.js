const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

async function migrateIsActiveToIsApproved() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected to MongoDB successfully!');

        // Define the Contracter model
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
            isActive: { type: Boolean, default: true },
            isApproved: { type: Boolean, default: true },
            profileCompletionStep: String
        }, { timestamps: true }));

        console.log('\n=== MIGRATING isActive TO isApproved ===');
        
        // Check current state
        const contractorsWithIsActive = await Contracter.countDocuments({ isActive: { $exists: true } });
        const contractorsWithIsApproved = await Contracter.countDocuments({ isApproved: { $exists: true } });
        
        console.log(`📊 Contractors with isActive field: ${contractorsWithIsActive}`);
        console.log(`📊 Contractors with isApproved field: ${contractorsWithIsApproved}`);
        
        // Copy isActive values to isApproved for contractors that don't have isApproved
        const result = await Contracter.updateMany(
            { isActive: { $exists: true }, isApproved: { $exists: false } },
            [
                {
                    $set: {
                        isApproved: "$isActive"
                    }
                }
            ]
        );
        
        console.log(`✅ Updated ${result.modifiedCount} contractors with isApproved field`);
        
        // Verify the migration
        const finalIsApprovedCount = await Contracter.countDocuments({ isApproved: { $exists: true } });
        const activeContractors = await Contracter.countDocuments({ isApproved: true });
        const inactiveContractors = await Contracter.countDocuments({ isApproved: false });
        
        console.log(`\n📊 Final Statistics:`);
        console.log(`Total contractors with isApproved: ${finalIsApprovedCount}`);
        console.log(`Approved contractors: ${activeContractors}`);
        console.log(`Disapproved contractors: ${inactiveContractors}`);
        
        // Show sample contractors
        console.log('\n=== SAMPLE CONTRACTORS ===');
        const sampleContractors = await Contracter.find({}, { 
            fullName: 1, 
            email: 1, 
            isActive: 1, 
            isApproved: 1 
        }).limit(5);
        
        sampleContractors.forEach((contractor, index) => {
            const status = contractor.isApproved ? '🟢 APPROVED' : '🔴 DISAPPROVED';
            console.log(`${index + 1}. ${contractor.fullName} (${contractor.email}) - ${status}`);
            console.log(`   isActive: ${contractor.isActive}, isApproved: ${contractor.isApproved}`);
        });

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// Run the migration
migrateIsActiveToIsApproved(); 