# Cortexa

A modern document approval and verification platform built for government offices and enterprises. Streamline your document workflow with multi-level approvals, digital signatures, and complete audit trails.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth-green)
![AWS](https://img.shields.io/badge/AWS-S3%20%7C%20DynamoDB-orange)

## Features

### Core Functionality
- **Document Submission** - Users can submit documents with required details and deadlines
- **Multi-Level Review** - Two-tier approval: Junior Reviewer → Compliance Officer
- **Digital Verification** - Approved documents get a unique verification code stamp
- **Role-Based Access** - Admin, Compliance Officer, Junior Reviewer, and User roles

### Technical Features
- **Supabase Authentication** - Email/password and Google OAuth
- **AWS S3 Storage** - Secure document storage with presigned URLs
- **DynamoDB** - Fast NoSQL storage for applications and activity logs
- **Upstash Redis** - Caching for improved performance
- **Real-time Status Tracking** - Track applications through the approval pipeline

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + shadcn/ui |
| Authentication | Supabase Auth |
| Database | AWS DynamoDB |
| File Storage | AWS S3 |
| Caching | Upstash Redis |
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
│   ├── supabase/       # Supabase client
│   └── redis.ts        # Upstash Redis client
└── public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- AWS account (S3 + DynamoDB)
- Upstash Redis account

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_DYNAMODB_TABLE=cortexa-applications
AWS_DYNAMODB_LOGS_TABLE=cortexa-logs

# Upstash Redis
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

### Database Setup

#### Supabase

Create a `user_roles` table:

```sql
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins to manage roles
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### AWS DynamoDB

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

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | Harshdeo7543@gmail.com | Harsh@123 |
| Junior Reviewer | hdevjharkhand@gmail.com | Harsh@123 |
| Compliance Officer | harshdeo5142@gmail.com | Harsh@123 |
| User (Google) | harsh.arcade.2025@gmail.com | Sign in with Google |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/[id]` | GET | Get single application |
| `/api/applications/[id]/review` | POST | Submit review action |
| `/api/applications/[id]/download` | GET | Download document |
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | DELETE | Delete user |
| `/api/logs` | GET | Get activity logs |
| `/api/user-role` | GET | Get current user's role |

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase Configuration

Update in Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/**`

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
