const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URL = process.env.MONGO_URL;

async function addIsActiveToContractors() {
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

        // Update all existing contractors to have isActive: true
        const result = await Contracter.updateMany(
            { isActive: { $exists: false } },
            { $set: { isActive: true } }
        );

        console.log(`Migration completed successfully!`);
        console.log(`Updated ${result.modifiedCount} contractors with isActive field`);

        // Verify the update by counting contractors with isActive field
        const contractorsWithIsActive = await Contracter.countDocuments({ isActive: { $exists: true } });
        const totalContractors = await Contracter.countDocuments();
        
        console.log(`Total contractors: ${totalContractors}`);
        console.log(`Contractors with isActive field: ${contractorsWithIsActive}`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
addIsActiveToContractors(); 