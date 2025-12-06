# AWS Setup Guide for Cortexa

Step-by-step guide to configure AWS S3 and DynamoDB for the document approval system.

## Prerequisites
- AWS Free Tier account ([Sign up here](https://aws.amazon.com/free/))

---

## Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Enter username: `cortexa-app`
4. Click **Next**
5. Select **Attach policies directly**
6. Search and attach these policies:
   - `AmazonS3FullAccess`
   - `AmazonDynamoDBFullAccess`
7. Click **Next** → **Create user**
8. Click on the user → **Security credentials** tab
9. Click **Create access key**
10. Select **Application running outside AWS**
11. **Save your Access Key ID and Secret Access Key** (you won't see the secret again!)

---

## Step 2: Create S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click **Create bucket**
3. Bucket name: `cortexa-documents` (or your preferred name)
4. Region: `ap-south-1` (Mumbai) or your preferred region
5. Uncheck **Block all public access** (we use presigned URLs, so objects stay private)
6. Enable **Bucket Versioning** (optional but recommended)
7. Click **Create bucket**

### Configure CORS for S3
1. Click on your bucket → **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit** and paste:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```
4. Click **Save changes**

---

## Step 3: Create DynamoDB Table

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click **Create table**
3. Table name: `cortexa-applications`
4. Partition key: `id` (String)
5. Leave sort key empty
6. Table settings: **Default settings**
7. Click **Create table**

---

## Step 4: Update Your .env.local

```env
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_from_step_1
AWS_SECRET_ACCESS_KEY=your_secret_key_from_step_1
AWS_S3_BUCKET=cortexa-documents
AWS_DYNAMODB_TABLE=cortexa-applications
```

---

## Step 5: Run User Roles Migration

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Copy the contents of `lib/supabase/migrations/001_user_roles.sql`
3. Paste and run in the SQL Editor

---

## Verification

Run `pnpm dev` and test:
1. Sign in to your app
2. Go to `/apply` and submit an application
3. Check S3 bucket for uploaded file
4. Check DynamoDB for application record

---

## Free Tier Limits

| Service | Free Tier Limit |
|---------|-----------------|
| S3 | 5GB storage, 20K GET, 2K PUT requests/month |
| DynamoDB | 25GB storage, 25 read/write units |

These limits are sufficient for development and small-scale production.
