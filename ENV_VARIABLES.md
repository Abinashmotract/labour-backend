# Required Environment Variables

## Core Application
```
NODE_ENV=development
PORT=3512
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

## Authentication & Security
```
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here
```

## Twilio SMS Configuration (for OTP)
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_MESSAGING_SERVICE_SID=your-twilio-messaging-service-sid
```

## Email Configuration (for password reset)
```
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Cloudinary Configuration (for image/file uploads)
```
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-cloud-api-key
CLOUD_API_SECRET=your-cloud-api-secret
```

## Firebase Configuration (for push notifications)
### Option 1: Full JSON (Recommended for local development)
```
FIREBASE_CONFIG='{"type":"service_account","project_id":"your-project-id",...}'
```

### Option 2: Individual Variables (Recommended for production)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

---

## Removed AWS SNS Variables (No longer needed)
~~AWS_ACCESS_KEY_ID~~ - REMOVED
~~AWS_SECRET_ACCESS_KEY~~ - REMOVED  
~~AWS_REGION~~ - REMOVED

Note: If you're using AWS S3 for file uploads, you may still need AWS credentials. However, based on the codebase, Cloudinary is being used for file uploads instead.

