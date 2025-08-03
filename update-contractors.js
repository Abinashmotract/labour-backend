const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

async function updateContractors() {
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
            profileCompletionStep: String,
            isActive: { type: Boolean, default: true }
        }, { timestamps: true }));

        console.log('\n=== CHECKING CURRENT STATE ===');
        
        // Check current state
        const totalContractors = await Contracter.countDocuments();
        const contractorsWithoutIsActive = await Contracter.countDocuments({ isActive: { $exists: false } });
        const contractorsWithIsActive = await Contracter.countDocuments({ isActive: { $exists: true } });

        console.log(`📊 Total contractors: ${totalContractors}`);
        console.log(`❌ Contractors without isActive field: ${contractorsWithoutIsActive}`);
        console.log(`✅ Contractors with isActive field: ${contractorsWithIsActive}`);

        if (contractorsWithoutIsActive > 0) {
            console.log('\n=== UPDATING CONTRACTORS ===');
            
            // Update all contractors that don't have isActive field
            const result = await Contracter.updateMany(
                { isActive: { $exists: false } },
                { $set: { isActive: true } }
            );

            console.log(`✅ Updated ${result.modifiedCount} contractors with isActive field`);
            
            // Verify the update
            const updatedContractorsWithIsActive = await Contracter.countDocuments({ isActive: { $exists: true } });
            console.log(`✅ Now ${updatedContractorsWithIsActive} contractors have isActive field`);
        } else {
            console.log('✅ All contractors already have isActive field!');
        }

        console.log('\n=== FINAL STATISTICS ===');
        
        // Get final statistics
        const finalTotal = await Contracter.countDocuments();
        const activeContractors = await Contracter.countDocuments({ isActive: true });
        const inactiveContractors = await Contracter.countDocuments({ isActive: false });

        console.log(`📊 Total contractors: ${finalTotal}`);
        console.log(`🟢 Active contractors: ${activeContractors}`);
        console.log(`🔴 Inactive contractors: ${inactiveContractors}`);

        // Show sample contractors
        console.log('\n=== SAMPLE CONTRACTORS ===');
        const sampleContractors = await Contracter.find({}, { 
            fullName: 1, 
            email: 1, 
            isActive: 1, 
            work_category: 1 
        }).limit(5);

        sampleContractors.forEach((contractor, index) => {
            const status = contractor.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE';
            console.log(`${index + 1}. ${contractor.fullName} (${contractor.email}) - ${status}`);
        });

        // Update your specific contractor
        console.log('\n=== UPDATING SPECIFIC CONTRACTOR ===');
        const specificContractor = await Contracter.findOneAndUpdate(
            { _id: '688f7dc4e021926e16a840b6' },
            { $set: { isActive: true } },
            { new: true }
        );

        if (specificContractor) {
            console.log(`✅ Updated contractor: ${specificContractor.fullName} (${specificContractor.email})`);
            console.log(`   Status: ${specificContractor.isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
        } else {
            console.log('⚠️  Specific contractor not found');
        }

        console.log('\n=== MIGRATION COMPLETED SUCCESSFULLY! ===');
        console.log('🎉 All contractors now have isActive field!');
        console.log('💡 You can now use the API endpoints to activate/deactivate contractors');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// Run the update
updateContractors(); 