# Dashboard Overview API

## Updated Dashboard Overview

The dashboard overview API has been simplified to show only the essential metrics.

## API Endpoint

**GET** `/api/admin/overview`

## Headers

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

## Response

### Success Response (200)

```json
{
    "status": 200,
    "success": true,
    "data": {
        "totalLabour": 25,
        "totalContractors": 15,
        "totalPendingContractors": 5
    }
}
```

## Curl Command

```bash
curl -X GET http://localhost:3512/api/admin/overview \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQyMzk3MTcsImV4cCI6MTc1NDg0NDUxN30.GCYIV-aHp-P-kcnDGTPpe9QTbHJ3No88efzxkyjKhp8" \
  -H "Content-Type: application/json"
```

## Metrics Explained

1. **totalLabour**: Total number of labour users in the system
2. **totalContractors**: Total number of contractors in the system
3. **totalPendingContractors**: Total number of contractors pending approval

## Changes Made

### Removed Fields:
- `pendingContractorApprovals` (renamed to `totalPendingContractors`)
- `approvedContractors` (removed)
- `recentActivity` (removed)

### Simplified Response:
The API now returns only the three essential metrics for a cleaner dashboard overview.

## Test the API

```bash
# Test with curl
curl -X GET http://localhost:3512/api/admin/overview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Or run the test script
node test-dashboard-overview.js
```

## Frontend Usage

```javascript
const fetchDashboardOverview = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/overview`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });
        
        const { totalLabour, totalContractors, totalPendingContractors } = response.data.data;
        
        console.log('Dashboard Overview:', {
            totalLabour,
            totalContractors,
            totalPendingContractors
        });
        
    } catch (error) {
        console.error('Error fetching dashboard overview:', error);
    }
};
```

## Error Responses

### Unauthorized (401)
```json
{
    "status": 401,
    "success": false,
    "message": "Unauthorized"
}
```

### Internal Server Error (500)
```json
{
    "status": 500,
    "success": false,
    "message": "Internal Server Error"
}
```

The dashboard overview is now simplified and focused on the three most important metrics! 