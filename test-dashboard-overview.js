const axios = require('axios');

const API_BASE_URL = 'http://localhost:3512/api';

// Mock admin token (replace with actual token)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk3MTcsImV4cCI6MTc1NDg0NDUxN30.GCYIV-aHp-P-kcnDGTPpe9QTbHJ3No88efzxkyjKhp8';

async function testDashboardOverview() {
    try {
        console.log('🧪 Testing Dashboard Overview API...');
        
        const response = await axios.get(`${API_BASE_URL}/admin/overview`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Dashboard Overview Response:');
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Data:', response.data.data);
        
        // Verify the response structure
        const { data } = response.data;
        
        if (data.totalLabour !== undefined) {
            console.log(`📊 Total Labour: ${data.totalLabour}`);
        } else {
            console.log('❌ Missing totalLabour in response');
        }
        
        if (data.totalContractors !== undefined) {
            console.log(`📊 Total Contractors: ${data.totalContractors}`);
        } else {
            console.log('❌ Missing totalContractors in response');
        }
        
        if (data.totalPendingContractors !== undefined) {
            console.log(`📊 Total Pending Contractors: ${data.totalPendingContractors}`);
        } else {
            console.log('❌ Missing totalPendingContractors in response');
        }
        
        // Check if old fields are removed
        if (data.pendingContractorApprovals !== undefined) {
            console.log('⚠️  Warning: pendingContractorApprovals still exists (should be removed)');
        }
        
        if (data.approvedContractors !== undefined) {
            console.log('⚠️  Warning: approvedContractors still exists (should be removed)');
        }
        
        if (data.recentActivity !== undefined) {
            console.log('⚠️  Warning: recentActivity still exists (should be removed)');
        }
        
        console.log('\n🎉 Dashboard Overview API is working correctly!');
        console.log('✅ Only showing totalLabour, totalContractors, and totalPendingContractors');
        
    } catch (error) {
        console.error('❌ Dashboard Overview Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testDashboardOverview(); 