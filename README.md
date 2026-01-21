# Cortexa

A modern document approval and verification platform built for government offices and enterprises. Streamline your document workflow with multi-level approvals, digital signatures, and complete audit trails.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)
![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20DynamoDB-orange)

## Features

### Core Functionality
- **Document Submission** - Users can submit documents with required details and deadlines
- **Multi-Level Review** - Two-tier approval: Junior Reviewer → Compliance Officer
- **Digital Verification** - Approved documents get a unique verification code stamp
- **Role-Based Access** - Admin, Compliance Officer, Junior Reviewer, and User roles

### Technical Features
- **Firebase Authentication** - Email/password and Google OAuth with Custom Claims for roles
- **AWS S3 Storage** - Secure document storage with presigned URLs
- **DynamoDB** - Fast NoSQL storage for applications and activity logs
- **Upstash Redis** - Optional caching for improved performance
- **Real-time Status Tracking** - Track applications through the approval pipeline

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + shadcn/ui |
| Authentication | Firebase Auth |
| Database | AWS DynamoDB |
| File Storage | AWS S3 |
| Caching | Upstash Redis (optional) |
| PDF Processing | pdf-lib |
| Deployment | Vercel |

## Project Structure

```
cortexa/
├── app/
│   ├── admin/          # User management (Admin/Compliance only)
│   ├── api/            # API routes
│   ├── applications/   # Application detail pages
│   ├── apply/          # New application form
│   ├── auth/           # Sign in/up pages
│   ├── dashboard/      # Main dashboard
│   ├── documents/      # Document viewer
│   ├── logs/           # Activity logs (Admin only)
│   └── review/         # Review queue
├── components/
│   ├── providers/      # Auth provider
│   ├── ui/             # shadcn/ui components
│   └── *.tsx           # Feature components
├── lib/
│   ├── aws/            # S3 and DynamoDB utilities
│   ├── firebase/       # Firebase client and admin SDK
│   ├── auth/           # Role management with Custom Claims
│   └── cache/          # Upstash Redis client
└── public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Firebase project
- AWS account (S3 + DynamoDB)
- Upstash Redis account (optional)

### Environment Variables

Create a `.env.local` file:

```env
# Firebase (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_DYNAMODB_TABLE=cortexa-applications
AWS_DYNAMODB_LOGS_TABLE=cortexa-logs

# Upstash Redis (Optional)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Installation

```bash
# Clone the repository
git clone https://github.com/HarshDeo7543/cortexa.git
cd cortexa

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Email/Password** and **Google** authentication
3. Get your Web App config and Service Account key
4. Add credentials to `.env.local`

#### Role Management

User roles are stored as **Firebase Custom Claims**:

```typescript
// Set role (server-side)
import { setUserRole } from '@/lib/firebase/admin'
await setUserRole(userId, 'admin')

// Get role (client-side via AuthContext)
const { role } = useAuth()
```

### AWS DynamoDB

Create two tables:
1. `cortexa-applications` - Primary key: `id` (String)
2. `cortexa-logs` - Primary key: `id` (String)

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, manage all users, view logs |
| **Compliance Officer** | Final approval, manage junior reviewers |
| **Junior Reviewer** | First-level document review |
| **User** | Submit applications, track status |

## Application Workflow

```
User Submits → Junior Review → Compliance Review → Approved/Rejected
     ↓              ↓                ↓                    ↓
  submitted    junior_review   compliance_review    approved/rejected
```

Each approved document receives:
- Digital verification stamp on PDF
- Unique verification code
- Complete audit trail

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/[id]` | GET | Get single application |
| `/api/applications/[id]/review` | POST | Submit review action |
| `/api/auth/session` | POST, DELETE | Manage Firebase session cookies |
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | DELETE | Delete user |
| `/api/logs` | GET | Get activity logs |
| `/api/upload` | POST | Get presigned upload URL |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Firebase Configuration

Update in Firebase Console → Authentication → Settings → Authorized domains:
- Add your Vercel domain: `your-domain.vercel.app`

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ by [Harsh Deo](https://github.com/HarshDeo7543)
