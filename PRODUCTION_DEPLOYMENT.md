# 🚀 Production Deployment Guide

## Environment Variables for Production

### For Render.com, Heroku, or similar platforms:

Set these environment variables in your production environment:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=labour-1ae3e
FIREBASE_PRIVATE_KEY_ID=4011b2ec958e5d04ff73a9417fbaac3db0058ea7
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCxxxca22KuFI++
uWrAGBFffVs2LTgxRPiX4t23v7mqybxWd6Ni2ScXykVxVf1ruDxbpEGFz7MtoUmo
SUnZ2yewOaN1iUbHpWriXtM7QDqagSpc1pazOcApdCy3IhPxyBeipd9rKFh5+hdH
Lj+IN8PdECWpsUEvP+IVQbMsCcQd9jCddNWBssYs3VUoN4Ev1LHKNqmsAv4dsaG5
My83FKYpEdXMkh10zIC1llFuclXOgTgTex8zLSS9boGSuny4vqHam/CWhpJniUbJ
W+Da5ihb0Q6tZBHCPpNiO4QvsrMo5inEMAATZnOuNNFRZlh1wTXUfWBlvIs9k+eh
y74QjJuTAgMBAAECggEAISEd4CZkFFbGlt9M0nFpw2bD+auhniThQsTHVrfG7Nnd
XCu9ae1XyKosGLvSlyFlNhq9Dyeul2FILbFCrvOVSNTk7kFfzFK6QWc0bAVDJonN
kDF5MfsgIVmB/7q9BsCoDupkYT7Khiih7+TheAwUVvzsV9wtbpW0FwwATMOhJYfs
44YLp8dRl0AcCjQwEQQRO6cn1spGEdIc7UbOb9COY7J4zEvoCpy/ELkXG7Fw5vjP
ZwwPVyZIAzvUiyv3v9mT1UcR8C/6H+JthltSGvsfPqgmU/KleQQHPJfOUBIHpfjd
nShKyc3RogGjSEByY3SC9Ljy8LT6qBcQxwZD6+2LOQKBgQDdoqiDwJrgbHB+xStq
PQn/dqXQw5+dClUpD5gP3fPDR2QabXEAvRvWdm5Usx7c4m9lFdMNO1JDc5INzwTf
QDzrxRK57NeK4kYtTcZ7H64IZDKMRp4uAUF6AOyaWvX1xSSduPTvSfZNG9YcHB/N
vdRMvolV/s4CqaRvoOa6tzEz9wKBgQDNV5hU5vMvwQSyHgm3IVKwJv525N1FnUhV
NXcTODLNygmIKwacLBJPM7qixUAMu3zIHWyS8EEFWiFgpdQzAyM+1qd6IbsN+sJo
43iLhKb7+zy5sfuKrPBu6Pf9LkwvBUs1WPphVsnFm8v+bZqqv9R2BkFaValP0DR0
gEZ772i2RQKBgQCnvTNMg7izoV6CkzcIcKngbiuQlH14nRlWujaby59xa9aXKb0c
kgM/jOJzuBzjj3w/RQU2Pm9EHXOsf8FwNW3mAoDpthZrRlVWdEaDaLaOI0ceY1PT
/Z9QduKa77y3BT1xIUo+z/tY4HhrTd3EGKdUbeAC9ZV07m9FDMGTDpJugQKBgQCi
5xMah/31rJMlG19pwS3wQX8uo3JHf/eaYcgNn0/uopHdTQT5cJ016DvwVbvyXeso
du9jwuZScKZ6HhSyQ5L6jyBea9QRyxXgUFWZmas/zJjoWKLN6VT1KC1U1h3qT7DS
qbw47Lk149t6BUnmnDjZSS0flUW04+A5bGp+d/gCYQKBgC24C8SsSEx5VP6KWmlm
PwXeKrm5Ll7hM8LmDFYueywZ9ntzquwJape16OuCc4z8q6a3x1Z4PJoIKE5B6ZLG
oCz41sM1i34cKak/62YPxbe19z5y4cY8NCDSqqoEyHEyaB7EMI/nZEeigC4J4acQ
n5y3sA6dAOdI4Bk1lf5oB2Bv
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@labour-1ae3e.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=109605107935054675640
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40labour-1ae3e.iam.gserviceaccount.com

# Other required environment variables
NODE_ENV=production
MONGO_URL=your-mongodb-connection-string
PORT=3512
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-cloud-api-key
CLOUD_API_SECRET=your-cloud-api-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## Important Notes

### 🔒 Security
- **Never commit** the `.env` file to git
- **Never commit** Firebase private keys to git
- Use environment variables for all sensitive data in production

### 🚀 Deployment Steps

1. **Set up environment variables** in your production platform
2. **Deploy the code** (without .env file)
3. **Test the notification system** after deployment
4. **Monitor logs** for any Firebase connection issues

### 🧪 Testing After Deployment

```bash
# Test Firebase connection
curl -X POST https://your-app-url.com/api/test/firebase

# Test job creation (if you have a test endpoint)
curl -X POST https://your-app-url.com/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"title":"Test Job","description":"Test","skills":["skill-id"],...}'
```

### 📊 Monitoring

- Check Firebase console for notification delivery stats
- Monitor application logs for errors
- Verify skill-based filtering is working
- Test with real users and FCM tokens

## 🔧 Troubleshooting

### Common Issues:

1. **Firebase not initialized**: Check environment variables
2. **Invalid JWT signature**: Verify private key format
3. **No notifications sent**: Check if users have FCM tokens and skills
4. **Database connection issues**: Verify MongoDB connection string

### Debug Commands:

```bash
# Check environment variables
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Test Firebase connection locally
node scripts/testFirebaseConnection.js

# Test notification system
node scripts/testJobNotification.js
```

---

**✅ Your notification system is production-ready!**
