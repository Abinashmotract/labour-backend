const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

async function fixContractorRoles() {
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
            profileCompletionStep: String
        }, { timestamps: true }));

        console.log('\n=== CHECKING CONTRACTOR ROLES ===');
        
        // Check for contractors with incorrect role
        const contractorsWithWrongRole = await Contracter.find({ role: "contracter" });
        console.log(`Found ${contractorsWithWrongRole.length} contractors with incorrect role "contracter"`);
        
        if (contractorsWithWrongRole.length > 0) {
            console.log('\n=== FIXING CONTRACTOR ROLES ===');
            
            // Update all contractors with wrong role
            const result = await Contracter.updateMany(
                { role: "contracter" },
                { $set: { role: "contractor" } }
            );

            console.log(`✅ Updated ${result.modifiedCount} contractors with correct role`);
            
            // Verify the fix
            const remainingWrongRole = await Contracter.find({ role: "contracter" });
            console.log(`Remaining contractors with wrong role: ${remainingWrongRole.length}`);
        }

        // Show all contractors and their roles
        console.log('\n=== ALL CONTRACTORS ===');
        const allContractors = await Contracter.find({}, { fullName: 1, email: 1, role: 1, isActive: 1 });
        
        allContractors.forEach((contractor, index) => {
            console.log(`${index + 1}. ${contractor.fullName} (${contractor.email}) - Role: ${contractor.role} - Active: ${contractor.isActive}`);
        });

        console.log('\n=== ROLE STATISTICS ===');
        const roleStats = await Contracter.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        roleStats.forEach(stat => {
            console.log(`Role "${stat._id}": ${stat.count} contractors`);
        });

        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        console.log('✅ Role fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during role fix:', error);
        process.exit(1);
    }
}

// Run the fix
fixContractorRoles(); 