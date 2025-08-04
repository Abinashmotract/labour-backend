# Migration from AWS S3 to Multer for File Uploads

## Overview

This project has been migrated from AWS S3 to Multer for handling file uploads in labour and contractor signup processes. This change simplifies the deployment and removes the dependency on AWS S3.

## Changes Made

### 1. New Multer Configuration (`config/multerConfig.js`)

- **Local Storage**: Files are now stored locally in the `uploads/` directory
- **File Filtering**: Only image files are accepted
- **File Size Limit**: 5MB maximum file size
- **Unique Naming**: Files are named with timestamps to avoid conflicts
- **Error Handling**: Comprehensive error handling for upload issues

### 2. Updated Routes

**Before (AWS S3):**
```javascript
const { uploadToS3 } = require("../config/AWSConfig");
router.post('/labour/signup', uploadToS3, labourSignUp);
router.post('/contracter/signup', uploadToS3, contracterSignUp);
```

**After (Multer):**
```javascript
const { handleFileUpload } = require("../config/multerConfig");
router.post('/labour/signup', handleFileUpload, labourSignUp);
router.post('/contracter/signup', handleFileUpload, contracterSignUp);
```

### 3. Static File Serving

Added static file serving in `app.js`:
```javascript
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 4. Updated Profile Image Upload

The profile image upload endpoint now uses Multer:
```javascript
router.post('/profile-image', verifyAllToken(['labour']), handleFileUpload, uploadProfileImage)
```

## File Structure

```
uploads/
├── profile-images/
│   ├── profileImage-1234567890-123456789.png
│   ├── profileImage-1234567891-987654321.jpg
│   └── ...
```

## API Endpoints

### 1. Labour Signup with Image
```bash
curl -X POST http://localhost:3512/api/auth/labour/signup \
  -H "Content-Type: multipart/form-data" \
  -F "fullName=John Doe" \
  -F "email_address=john@example.com" \
  -F "mobile_no=9876543210" \
  -F "address=123 Main St" \
  -F "work_experience=2 years" \
  -F "work_category=Plumbing" \
  -F "password=Password123!" \
  -F "gender=male" \
  -F "profileImage=@/path/to/image.jpg"
```

### 2. Contractor Signup with Image
```bash
curl -X POST http://localhost:3512/api/auth/contracter/signup \
  -H "Content-Type: multipart/form-data" \
  -F "contracterName=Jane Smith" \
  -F "email=jane@example.com" \
  -F "mobile=9876543211" \
  -F "address=456 Oak Ave" \
  -F "typeOfWorkOffered=Electrical" \
  -F "password=Password123!" \
  -F "gender=female" \
  -F "profileImage=@/path/to/image.jpg"
```

### 3. Profile Image Upload
```bash
curl -X POST http://localhost:3512/api/user/profile-image?id=USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "profileImage=@/path/to/image.jpg"
```

## File Access

Uploaded files can be accessed via:
```
http://localhost:3512/uploads/profile-images/filename.jpg
```

## Configuration

### File Storage
- **Location**: `uploads/profile-images/`
- **Naming**: `profileImage-{timestamp}-{random}.{extension}`
- **Max Size**: 5MB
- **Allowed Types**: Images only (jpg, jpeg, png, gif, etc.)

### Error Handling
- File size too large: Returns 400 with size limit message
- Invalid file type: Returns 400 with type restriction message
- Upload errors: Returns 500 with error details

## Migration Steps

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install multer
   ```

2. **Create Uploads Directory**:
   ```bash
   mkdir -p uploads/profile-images
   ```

3. **Update .gitignore**:
   ```
   uploads/
   ```

4. **Test the New Functionality**:
   ```bash
   node test-multer-upload.js
   ```

## Benefits of Migration

1. **Simplified Deployment**: No AWS credentials needed
2. **Reduced Costs**: No S3 storage costs
3. **Faster Uploads**: Local storage is faster than S3
4. **Easier Development**: No need for AWS setup in development
5. **Better Control**: Full control over file storage and access

## Security Considerations

1. **File Validation**: Only images are accepted
2. **Size Limits**: 5MB maximum file size
3. **Unique Naming**: Prevents filename conflicts
4. **Access Control**: Files served through Express static middleware
5. **Git Ignore**: Uploaded files are not committed to repository

## Testing

Run the test script to verify functionality:
```bash
node test-multer-upload.js
```

This will test both labour and contractor signup with file uploads.

## Troubleshooting

### Common Issues

1. **Uploads Directory Not Found**:
   - Ensure `uploads/profile-images/` directory exists
   - Check file permissions

2. **File Not Accessible**:
   - Verify static file serving is configured in `app.js`
   - Check file path in database

3. **File Size Too Large**:
   - Reduce file size to under 5MB
   - Compress image if needed

4. **Invalid File Type**:
   - Ensure only image files are uploaded
   - Check file extension and MIME type

### Debug Commands

```bash
# Check if uploads directory exists
ls -la uploads/profile-images/

# Check file permissions
chmod 755 uploads/profile-images/

# Test file access
curl http://localhost:3512/uploads/profile-images/test.jpg
```

## Rollback Plan

If you need to rollback to AWS S3:

1. Restore `config/AWSConfig.js`
2. Update routes to use `uploadToS3` instead of `handleFileUpload`
3. Remove static file serving from `app.js`
4. Update controllers to handle S3 URLs

The migration is complete and the system now uses Multer for all file uploads! 