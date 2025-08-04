const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3512/api';

// Test data
const testLabourData = {
    fullName: "Test Labour",
    email_address: "testlabour@example.com",
    mobile_no: "9876543210",
    address: "123 Test Street",
    work_experience: "2 years",
    work_category: "Plumbing",
    password: "TestPassword123!",
    gender: "male"
};

const testContractorData = {
    contracterName: "Test Contractor",
    email: "testcontractor@example.com",
    mobile: "9876543211",
    address: "456 Test Avenue",
    typeOfWorkOffered: "Electrical",
    password: "TestPassword123!",
    gender: "male"
};

async function testLabourSignup() {
    try {
        console.log('🧪 Testing Labour Signup with Multer...');
        
        // Create a test image file
        const testImagePath = path.join(__dirname, 'test-image.png');
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, testImageBuffer);
        
        const formData = new FormData();
        
        // Add form fields
        Object.keys(testLabourData).forEach(key => {
            formData.append(key, testLabourData[key]);
        });
        
        // Add test image
        formData.append('profileImage', fs.createReadStream(testImagePath));
        
        const response = await axios.post(`${API_BASE_URL}/auth/labour/signup`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('✅ Labour Signup Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Data:', response.data.data);
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Labour Signup Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testContractorSignup() {
    try {
        console.log('\n🧪 Testing Contractor Signup with Multer...');
        
        // Create a test image file
        const testImagePath = path.join(__dirname, 'test-image.png');
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, testImageBuffer);
        
        const formData = new FormData();
        
        // Add form fields
        Object.keys(testContractorData).forEach(key => {
            formData.append(key, testContractorData[key]);
        });
        
        // Add test image
        formData.append('profileImage', fs.createReadStream(testImagePath));
        
        const response = await axios.post(`${API_BASE_URL}/auth/contracter/signup`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('✅ Contractor Signup Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Data:', response.data.data);
        
        // Clean up test file
        fs.unlinkSync(testImagePath);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Contractor Signup Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function runTests() {
    try {
        console.log('🚀 Starting Multer Upload Tests...\n');
        
        // Test labour signup
        await testLabourSignup();
        
        // Test contractor signup
        await testContractorSignup();
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('✅ Multer upload functionality is working correctly');
        
    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
    }
}

// Run the tests
runTests(); 