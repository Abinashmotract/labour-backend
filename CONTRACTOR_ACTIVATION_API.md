# Contractor Activation/Deactivation API

This document describes the new API endpoints for activating and deactivating contractors.

## Overview

The contractor activation/deactivation API allows administrators to control whether contractors can access the system. When a contractor is deactivated, they should not be able to log in or perform any actions in the system.

## Database Changes

The `Contracter` model has been updated to include an `isActive` field:

```javascript
isActive: {
    type: Boolean,
    default: true,
}
```

### Migration for Existing Data

To add the `isActive` field to all existing contractors in your database, run the migration script:

```bash
npm run migrate:add-isactive
```

This will set `isActive: true` for all existing contractors that don't have this field.

## API Endpoints

### 1. Update Contractor Status (Recommended)

**Endpoint:** `PATCH /api/admin/contractors/:id`

**Description:** Updates the contractor's active status based on the isApproved field in request body

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter): The contractor's ID

**Request Body:**
```json
{
    "isApproved": true
}
```

**Response (Success - 200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Contractor activated successfully!",
    "data": {
        "id": "contractor_id",
        "fullName": "Contractor Name",
        "email": "contractor@example.com",
        "isActive": true
    }
}
```

**Frontend Usage:**
```javascript
const handleToggleStatus = async (id, isApproved) => {
    setTogglingIds((prev) => ({ ...prev, [id]: true }));
    try {
        const response = await axios.patch(`${API_BASE_URL}/admin/contractors/${id}`, 
            { isApproved: isApproved }, 
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log('Toggle response:', response.data.data);
        showSuccessToast(response?.data?.message || "Contractor status updated!");
        await fetchAllStylistUserDetials();
    } catch (error) {
        console.log("Toggle error:", error);
        showErrorToast("An error occurred while toggling status.");
    } finally {
        setTogglingIds((prev) => ({ ...prev, [id]: false }));
    }
};
```

### 2. Activate Contractor

**Description:** Activates a contractor account

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Parameters:**
- `id` (path parameter): The contractor's ID

**Response (Success - 200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Contractor activated successfully!",
    "data": {
        "id": "contractor_id",
        "fullName": "Contractor Name",
        "email": "contractor@example.com",
        "isActive": true
    }
}
```

**Response (Error - 400):**
```json
{
    "success": false,
    "status": 400,
    "message": "Contractor is already active!"
}
```

**Response (Error - 404):**
```json
{
    "success": false,
    "status": 404,
    "message": "Contractor not found!"
}
```

### 2. Deactivate Contractor

**Endpoint:** `PATCH /api/admin/contractors/:id/deactivate`

**Description:** Deactivates a contractor account

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Parameters:**
- `id` (path parameter): The contractor's ID

**Response (Success - 200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Contractor deactivated successfully!",
    "data": {
        "id": "contractor_id",
        "fullName": "Contractor Name",
        "email": "contractor@example.com",
        "isActive": false
    }
}
```

**Response (Error - 400):**
```json
{
    "success": false,
    "status": 400,
    "message": "Contractor is already inactive!"
}
```

**Response (Error - 404):**
```json
{
    "success": false,
    "status": 404,
    "message": "Contractor not found!"
}
```

## Enhanced Existing Endpoints

### 1. Get All Contractors (with filtering)

**Endpoint:** `GET /api/admin/contractors`

**Query Parameters:**
- `activeStatus` (optional): Filter by active status
  - `active`: Returns only active contractors
  - `inactive`: Returns only inactive contractors
  - If not provided, returns all contractors

**Example:**
```
GET /api/admin/contractors?activeStatus=active&page=1&limit=10
```

### 2. Get All Contractors (Simple)

**Endpoint:** `GET /api/admin/contractors/all`

**Query Parameters:**
- `activeStatus` (optional): Filter by active status
  - `active`: Returns only active contractors
  - `inactive`: Returns only inactive contractors
  - If not provided, returns all contractors

**Example:**
```
GET /api/admin/contractors/all?activeStatus=active
```

### 3. Contractor Statistics

**Endpoint:** `GET /api/admin/contractors/stats/overview`

**Response:**
```json
{
    "success": true,
    "status": 200,
    "message": "Contractor statistics fetched successfully!",
    "data": {
        "totalContractors": 100,
        "approvedContractors": 80,
        "pendingContractors": 20,
        "activeContractors": 75,
        "inactiveContractors": 25,
        "contractorsByCategory": [
            {
                "_id": "Plumbing",
                "count": 30
            },
            {
                "_id": "Electrical",
                "count": 25
            }
        ]
    }
}
```

## Authentication

All endpoints require admin authentication. Include the admin token in the Authorization header:

```
Authorization: Bearer <admin_token>
```

## Error Handling

All endpoints return consistent error responses with the following structure:

```json
{
    "success": false,
    "status": <http_status_code>,
    "message": "Error description"
}
```

## Usage Examples

### Update contractor status (Recommended):
```bash
# Activate contractor
curl -X PATCH http://localhost:3512/api/admin/contractors/64f1234567890abcdef12345 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isApproved": true}'

# Deactivate contractor
curl -X PATCH http://localhost:3512/api/admin/contractors/64f1234567890abcdef12345 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isApproved": false}'
```

### Activate a contractor:
```bash
curl -X PATCH \
  http://localhost:3512/api/admin/contractors/64f1234567890abcdef12345/activate \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json'
```

### Deactivate a contractor:
```bash
curl -X PATCH \
  http://localhost:3512/api/admin/contractors/64f1234567890abcdef12345/deactivate \
  -H 'Authorization: Bearer <admin_token>' \
  -H 'Content-Type: application/json'
```

### Get only active contractors:
```bash
curl -X GET \
  'http://localhost:3512/api/admin/contractors?activeStatus=active&page=1&limit=10' \
  -H 'Authorization: Bearer <admin_token>'
```

## Notes

1. The `isActive` field defaults to `true` for new contractors
2. Deactivated contractors should be prevented from logging in (this should be implemented in the authentication middleware)
3. The API includes proper validation to prevent redundant operations (e.g., activating an already active contractor)
4. All responses include the contractor's basic information for confirmation 