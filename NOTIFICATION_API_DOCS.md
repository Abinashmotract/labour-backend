# 📱 Notification API Documentation

## Overview
The Notification API provides comprehensive notification management for both labour and contractor users. All endpoints require authentication via JWT token.

## Base URL
```
/api/notifications
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Notifications
**GET** `/api/notifications`

Get paginated list of notifications for the authenticated user.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type
- `isRead` (optional): Filter by read status (true/false)

#### Response
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "title": "New Job Available! 🛠️",
        "body": "A new plumbing job is available",
        "type": "JOB_POST",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "readAt": null,
        "sender": {
          "_id": "sender_id",
          "firstName": "John",
          "lastName": "Doe"
        },
        "job": {
          "_id": "job_id",
          "title": "Plumbing Job",
          "location": {
            "address": "Delhi, India"
          }
        },
        "data": {
          "jobId": "job_id",
          "contractorId": "contractor_id"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "hasNext": true,
      "hasPrev": false
    },
    "unreadCount": 15
  }
}
```

### 2. Get Notification Statistics
**GET** `/api/notifications/stats`

Get notification statistics for the authenticated user.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 50,
    "unread": 12,
    "byType": {
      "JOB_POST": {
        "total": 20,
        "unread": 5
      },
      "JOB_ACCEPTED": {
        "total": 15,
        "unread": 3
      },
      "PAYMENT": {
        "total": 10,
        "unread": 2
      }
    }
  }
}
```

### 3. Get Notification by ID
**GET** `/api/notifications/:id`

Get a specific notification by ID. Automatically marks it as read.

#### Path Parameters
- `id`: Notification ID

#### Response
```json
{
  "success": true,
  "data": {
    "_id": "notification_id",
    "title": "New Job Available! 🛠️",
    "body": "A new plumbing job is available",
    "type": "JOB_POST",
    "isRead": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "readAt": "2024-01-15T10:35:00Z",
    "sender": {
      "_id": "sender_id",
      "firstName": "John",
      "lastName": "Doe"
    },
    "job": {
      "_id": "job_id",
      "title": "Plumbing Job",
      "description": "Need experienced plumber",
      "location": {
        "address": "Delhi, India"
      }
    }
  }
}
```

### 4. Mark Notification as Read
**PATCH** `/api/notifications/:id/read`

Mark a specific notification as read.

#### Path Parameters
- `id`: Notification ID

#### Response
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 5. Mark All Notifications as Read
**PATCH** `/api/notifications/read-all`

Mark all notifications as read for the authenticated user.

#### Response
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### 6. Delete Notification
**DELETE** `/api/notifications/:id`

Soft delete a specific notification.

#### Path Parameters
- `id`: Notification ID

#### Response
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Notification Types

| Type | Description |
|------|-------------|
| `JOB_POST` | New job posted |
| `JOB_APPLICATION` | Job application received |
| `JOB_ACCEPTED` | Job application accepted |
| `JOB_REJECTED` | Job application rejected |
| `JOB_COMPLETED` | Job completed |
| `PAYMENT` | Payment related |
| `SYSTEM` | System notifications |
| `NEARBY_JOB` | Nearby job available |

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Notification not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Usage Examples

### Get notifications with pagination
```bash
curl -X GET "https://your-api.com/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### Filter by type
```bash
curl -X GET "https://your-api.com/api/notifications?type=JOB_POST" \
  -H "Authorization: Bearer your-jwt-token"
```

### Get unread notifications only
```bash
curl -X GET "https://your-api.com/api/notifications?isRead=false" \
  -H "Authorization: Bearer your-jwt-token"
```

### Mark notification as read
```bash
curl -X PATCH "https://your-api.com/api/notifications/notification_id/read" \
  -H "Authorization: Bearer your-jwt-token"
```

### Delete notification
```bash
curl -X DELETE "https://your-api.com/api/notifications/notification_id" \
  -H "Authorization: Bearer your-jwt-token"
```

## Features

- ✅ **Pagination** - Efficient data loading
- ✅ **Filtering** - By type and read status
- ✅ **Statistics** - Unread counts and type breakdown
- ✅ **Auto-read** - Notifications marked as read when viewed
- ✅ **Soft delete** - Notifications can be restored
- ✅ **FCM Integration** - Push notifications sent automatically
- ✅ **Database persistence** - All notifications saved to database
- ✅ **User-specific** - Each user sees only their notifications
- ✅ **Comprehensive data** - Includes job, sender, and custom data

## Database Schema

```javascript
{
  title: String,           // Notification title
  body: String,            // Notification body
  type: String,            // Notification type
  recipient: ObjectId,     // User who receives the notification
  sender: ObjectId,        // User who sent the notification
  job: ObjectId,           // Related job (if applicable)
  jobApplication: ObjectId, // Related job application (if applicable)
  data: Mixed,             // Additional data
  isRead: Boolean,         // Read status
  isDeleted: Boolean,      // Soft delete status
  fcmToken: String,        // FCM token for push notifications
  responseId: String,      // FCM response ID
  sentAt: Date,            // When FCM was sent
  readAt: Date,            // When notification was read
  createdAt: Date,         // Creation timestamp
  updatedAt: Date          // Last update timestamp
}
```

---

**🎉 Your notification system is now fully functional with comprehensive API support!**
