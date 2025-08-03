const axios = require('axios');

const API_BASE_URL = 'http://localhost:3512/api';
const CONTRACTOR_ID = '688f7dc4e021926e16a840b6';

// Mock admin token (you'll need to replace this with a real token)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk3MTcsImV4cCI6MTc1NDg0NDUxN30.GCYIV-aHp-P-kcnDGTPpe9QTbHJ3No88efzxkyjKhp8';

async function testUpdatedAPI() {
    try {
        console.log('🧪 Testing Updated Contractor Status API...');
        
        // Test 1: Activate contractor
        console.log('\n📤 Test 1: Activating contractor...');
        const activateResponse = await axios.patch(
            `${API_BASE_URL}/admin/contractors/${CONTRACTOR_ID}`,
            { isApproved: true },
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ Activate Response:');
        console.log('Status:', activateResponse.status);
        console.log('Message:', activateResponse.data.message);
        console.log('Data:', activateResponse.data.data);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Deactivate contractor
        console.log('\n📤 Test 2: Deactivating contractor...');
        const deactivateResponse = await axios.patch(
            `${API_BASE_URL}/admin/contractors/${CONTRACTOR_ID}`,
            { isApproved: false },
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ Deactivate Response:');
        console.log('Status:', deactivateResponse.status);
        console.log('Message:', deactivateResponse.data.message);
        console.log('Data:', deactivateResponse.data.data);
        
        console.log('\n🎉 Updated API is working correctly!');
        console.log('💡 Your frontend can now use this endpoint:');
        console.log(`   PATCH ${API_BASE_URL}/admin/contractors/{id}`);
        console.log('   Body: { "isApproved": true/false }');
        
    } catch (error) {
        console.error('❌ API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testUpdatedAPI(); 