const axios = require('axios');

const API_BASE_URL = 'http://localhost:3512/api';
const CONTRACTOR_ID = '688f7dc4e021926e16a840b6';

// Mock admin token (you'll need to replace this with a real token)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk3MTcsImV4cCI6MTc1NDg0NDUxN30.GCYIV-aHp-P-kcnDGTPpe9QTbHJ3No88efzxkyjKhp8';

async function testToggleAPI() {
    try {
        console.log('🧪 Testing Toggle Contractor Status API...');
        
        const response = await axios.patch(
            `${API_BASE_URL}/admin/contractors/${CONTRACTOR_ID}`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ API Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Data:', response.data.data);
        
        console.log('\n🎉 Toggle API is working correctly!');
        console.log('💡 Your frontend can now use this endpoint:');
        console.log(`   PATCH ${API_BASE_URL}/admin/contractors/{id}`);
        
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
testToggleAPI(); 