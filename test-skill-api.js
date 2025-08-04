const axios = require('axios');

const API_BASE_URL = 'http://localhost:3512/api/skill/admin';

// Mock admin token (replace with actual token)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk4MjksImV4cCI6MTc1NDg0NDYyOX0.yWhs-A4RkmtJWSUHHulJ-wWdVwqqUd_e-UV495LcgGQ';

let createdSkillId = null;

async function testCreateSkill() {
    try {
        console.log('🧪 Testing Create Skill...');
        
        const skillData = {
            name: "carpenter",
            description: "Woodworking and carpentry skills",
            category: "construction"
        };
        
        const response = await axios.post(`${API_BASE_URL}/create`, skillData, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Create Skill Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Data:', response.data.data);
        
        createdSkillId = response.data.data.id;
        console.log('📝 Created Skill ID:', createdSkillId);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Create Skill Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testGetAllSkills() {
    try {
        console.log('\n🧪 Testing Get All Skills...');
        
        const response = await axios.get(`${API_BASE_URL}/skills`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });

        console.log('✅ Get All Skills Response:');
        console.log('Status:', response.status);
        console.log('Total Skills:', response.data.data.total);
        console.log('Skills:', response.data.data.skills.length);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Get All Skills Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testGetSkillById() {
    try {
        if (!createdSkillId) {
            console.log('⚠️  Skipping Get Skill by ID test - no skill created');
            return;
        }
        
        console.log('\n🧪 Testing Get Skill by ID...');
        
        const response = await axios.get(`${API_BASE_URL}/skills/${createdSkillId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });

        console.log('✅ Get Skill by ID Response:');
        console.log('Status:', response.status);
        console.log('Skill Name:', response.data.data.name);
        console.log('Skill Description:', response.data.data.description);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Get Skill by ID Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testUpdateSkill() {
    try {
        if (!createdSkillId) {
            console.log('⚠️  Skipping Update Skill test - no skill created');
            return;
        }
        
        console.log('\n🧪 Testing Update Skill...');
        
        const updateData = {
            name: "master carpenter",
            description: "Advanced woodworking and carpentry skills",
            category: "construction",
            isActive: true
        };
        
        const response = await axios.put(`${API_BASE_URL}/skills/${createdSkillId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Update Skill Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Updated Name:', response.data.data.name);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Update Skill Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testToggleSkillStatus() {
    try {
        if (!createdSkillId) {
            console.log('⚠️  Skipping Toggle Skill Status test - no skill created');
            return;
        }
        
        console.log('\n🧪 Testing Toggle Skill Status...');
        
        const response = await axios.patch(`${API_BASE_URL}/skills/${createdSkillId}/toggle`, {}, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Toggle Skill Status Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        console.log('Is Active:', response.data.data.isActive);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Toggle Skill Status Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testSearchSkills() {
    try {
        console.log('\n🧪 Testing Search Skills...');
        
        const response = await axios.get(`${API_BASE_URL}/skills?search=carpenter`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });

        console.log('✅ Search Skills Response:');
        console.log('Status:', response.status);
        console.log('Search Results:', response.data.data.skills.length);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Search Skills Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function testDeleteSkill() {
    try {
        if (!createdSkillId) {
            console.log('⚠️  Skipping Delete Skill test - no skill created');
            return;
        }
        
        console.log('\n🧪 Testing Delete Skill...');
        
        const response = await axios.delete(`${API_BASE_URL}/skills/${createdSkillId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
            },
        });

        console.log('✅ Delete Skill Response:');
        console.log('Status:', response.status);
        console.log('Message:', response.data.message);
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Delete Skill Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}

async function runAllTests() {
    try {
        console.log('🚀 Starting Skill API Tests...\n');
        
        // Test all endpoints
        await testCreateSkill();
        await testGetAllSkills();
        await testGetSkillById();
        await testUpdateSkill();
        await testToggleSkillStatus();
        await testSearchSkills();
        await testDeleteSkill();
        
        console.log('\n🎉 All Skill API tests completed successfully!');
        console.log('✅ All endpoints are working correctly');
        
    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
    }
}

// Run all tests
runAllTests(); 