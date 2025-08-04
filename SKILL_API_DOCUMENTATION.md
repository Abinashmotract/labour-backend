# Skill Management API Documentation

## Overview

Complete CRUD API for managing skills in the system. All endpoints require admin authentication.

## Base URL

```
http://localhost:3512/api/skill/admin
```

## Authentication

All endpoints require admin authentication:
```
Authorization: Bearer <admin_token>
```

## API Endpoints

### 1. Create Skill

**POST** `/create`

**Request Body:**
```json
{
    "name": "carpenter",
    "description": "Woodworking and carpentry skills",
    "category": "construction"
}
```

**Response (201):**
```json
{
    "success": true,
    "status": 201,
    "message": "Skill created successfully",
    "data": {
        "id": "64f1234567890abcdef12345",
        "name": "carpenter",
        "description": "Woodworking and carpentry skills",
        "category": "construction",
        "isActive": true,
        "createdAt": "2025-01-03T10:30:00.000Z"
    }
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:3512/api/skill/admin/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"carpenter","description":"Woodworking and carpentry skills","category":"construction"}'
```

### 2. Get All Skills

**GET** `/skills`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search in name and description
- `category` (optional): Filter by category
- `isActive` (optional): Filter by active status (true/false)

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Skills fetched successfully",
    "data": {
        "skills": [
            {
                "_id": "64f1234567890abcdef12345",
                "name": "carpenter",
                "description": "Woodworking and carpentry skills",
                "category": "construction",
                "isActive": true,
                "createdBy": {
                    "_id": "64f1234567890abcdef12346",
                    "fullName": "Admin User",
                    "email": "admin@example.com"
                },
                "createdAt": "2025-01-03T10:30:00.000Z",
                "updatedAt": "2025-01-03T10:30:00.000Z"
            }
        ],
        "totalPages": 1,
        "currentPage": 1,
        "total": 1
    }
}
```

**Curl Commands:**
```bash
# Get all skills
curl -X GET http://localhost:3512/api/skill/admin/skills \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Search skills
curl -X GET "http://localhost:3512/api/skill/admin/skills?search=carpenter" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by category
curl -X GET "http://localhost:3512/api/skill/admin/skills?category=construction" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get active skills only
curl -X GET "http://localhost:3512/api/skill/admin/skills?isActive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Get Skill by ID

**GET** `/skills/:id`

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Skill fetched successfully",
    "data": {
        "_id": "64f1234567890abcdef12345",
        "name": "carpenter",
        "description": "Woodworking and carpentry skills",
        "category": "construction",
        "isActive": true,
        "createdBy": {
            "_id": "64f1234567890abcdef12346",
            "fullName": "Admin User",
            "email": "admin@example.com"
        },
        "createdAt": "2025-01-03T10:30:00.000Z",
        "updatedAt": "2025-01-03T10:30:00.000Z"
    }
}
```

**Curl Command:**
```bash
curl -X GET http://localhost:3512/api/skill/admin/skills/64f1234567890abcdef12345 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Update Skill

**PUT** `/skills/:id`

**Request Body:**
```json
{
    "name": "master carpenter",
    "description": "Advanced woodworking and carpentry skills",
    "category": "construction",
    "isActive": true
}
```

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Skill updated successfully",
    "data": {
        "id": "64f1234567890abcdef12345",
        "name": "master carpenter",
        "description": "Advanced woodworking and carpentry skills",
        "category": "construction",
        "isActive": true,
        "updatedAt": "2025-01-03T11:30:00.000Z"
    }
}
```

**Curl Command:**
```bash
curl -X PUT http://localhost:3512/api/skill/admin/skills/64f1234567890abcdef12345 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"master carpenter","description":"Advanced woodworking and carpentry skills","category":"construction","isActive":true}'
```

### 5. Toggle Skill Status

**PATCH** `/skills/:id/toggle`

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Skill deactivated successfully",
    "data": {
        "id": "64f1234567890abcdef12345",
        "name": "carpenter",
        "isActive": false
    }
}
```

**Curl Command:**
```bash
curl -X PATCH http://localhost:3512/api/skill/admin/skills/64f1234567890abcdef12345/toggle \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 6. Delete Skill

**DELETE** `/skills/:id`

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "Skill deleted successfully"
}
```

**Curl Command:**
```bash
curl -X DELETE http://localhost:3512/api/skill/admin/skills/64f1234567890abcdef12345 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Delete Multiple Skills

**DELETE** `/skills`

**Request Body:**
```json
{
    "skillIds": [
        "64f1234567890abcdef12345",
        "64f1234567890abcdef12346"
    ]
}
```

**Response (200):**
```json
{
    "success": true,
    "status": 200,
    "message": "2 skill(s) deleted successfully"
}
```

**Curl Command:**
```bash
curl -X DELETE http://localhost:3512/api/skill/admin/skills \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skillIds":["64f1234567890abcdef12345","64f1234567890abcdef12346"]}'
```

## Error Responses

### Validation Error (400)
```json
{
    "success": false,
    "status": 400,
    "message": "Skill name is required"
}
```

### Not Found (404)
```json
{
    "success": false,
    "status": 404,
    "message": "Skill not found"
}
```

### Unauthorized (401)
```json
{
    "success": false,
    "status": 401,
    "message": "Unauthorized"
}
```

### Internal Server Error (500)
```json
{
    "success": false,
    "status": 500,
    "message": "Internal Server Error"
}
```

## Frontend Usage Examples

### Create Skill
```javascript
const createSkill = async (skillData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/skill/admin/create`, skillData, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Skill created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
};
```

### Get All Skills
```javascript
const getAllSkills = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await axios.get(`${API_BASE_URL}/skill/admin/skills?${queryString}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};
```

### Update Skill
```javascript
const updateSkill = async (id, skillData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skill/admin/skills/${id}`, skillData, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating skill:', error);
        throw error;
    }
};
```

### Delete Skill
```javascript
const deleteSkill = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/skill/admin/skills/${id}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting skill:', error);
        throw error;
    }
};
```

## Data Model

```javascript
{
    _id: ObjectId,
    name: String (required, unique, lowercase),
    description: String (optional),
    category: String (default: "general"),
    isActive: Boolean (default: true),
    createdBy: ObjectId (ref: User),
    createdAt: Date,
    updatedAt: Date
}
```

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Search & Filter**: Search by name/description, filter by category/status
- ✅ **Pagination**: Page-based results with configurable limits
- ✅ **Bulk Operations**: Delete multiple skills at once
- ✅ **Status Toggle**: Activate/deactivate skills
- ✅ **Validation**: Unique skill names, required fields
- ✅ **Admin Only**: All endpoints require admin authentication
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Populated Data**: Includes creator information

The skill management API is now complete and ready to use! 🎉 