# 🔧 Firebase Configuration Troubleshooting Guide

## Issue: JSON Syntax Error in Firebase Configuration

### Error Message
```
Firebase initialization error: SyntaxError: Unterminated string in JSON at position 1962 (line 1 column 1963)
```

### Root Cause
The `FIREBASE_CONFIG` environment variable contains malformed JSON with unescaped quotes and newlines.

### Solutions

#### Option 1: Use Individual Environment Variables (Recommended for Production)

Instead of using `FIREBASE_CONFIG`, set these individual environment variables:

```bash
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
```

#### Option 2: Fix FIREBASE_CONFIG JSON

If you must use `FIREBASE_CONFIG`, ensure the JSON is properly escaped:

```bash
# WRONG - This will cause JSON parsing errors
FIREBASE_CONFIG={"type":"service_account","project_id":"labour-1ae3e","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"}

# CORRECT - Use single quotes around the entire JSON string
FIREBASE_CONFIG='{"type":"service_account","project_id":"labour-1ae3e","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"}'
```

#### Option 3: Use Base64 Encoded Configuration

Encode your Firebase service account JSON and use:

```bash
FIREBASE_CONFIG_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6ImxhYm91ci0xYWUzZSIsLi4ufQ==
```

### Validation

Run the validation script to check your Firebase configuration:

```bash
npm run validate-firebase
```

This will:
- Check which environment variables are set
- Validate JSON parsing
- Test Firebase initialization
- Provide detailed error messages

### Common Issues and Solutions

1. **Unescaped quotes in JSON**: Use single quotes around the entire JSON string
2. **Newline characters**: Use `\\n` instead of actual newlines in JSON strings
3. **Missing environment variables**: Ensure all required variables are set
4. **Invalid private key format**: Ensure the private key includes proper headers and footers

### Testing After Fix

1. **Local testing**:
   ```bash
   npm run validate-firebase
   node scripts/testFirebaseConnection.js
   ```

2. **Production testing**:
   - Check application logs for Firebase initialization messages
   - Test notification functionality
   - Monitor for any remaining errors

### Prevention

- Always use individual environment variables for production
- Validate JSON before setting as environment variables
- Use the validation script before deployment
- Test Firebase functionality after any configuration changes

---

**Note**: The application will continue to work without Firebase (notifications will be disabled), but it's recommended to fix the configuration for full functionality.
