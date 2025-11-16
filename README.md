# Clinical Documentation Assistant 🏥

An AI-powered clinical documentation assistant that helps healthcare professionals generate structured SOAP notes from dictation, audio files, or text input. Built with React, Node.js, Claude API, and OpenAI Whisper.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-blue.svg)

## 🌟 Features

### Core Functionality
- **🎤 Multiple Input Methods**
  - Record audio directly in browser (max 5 minutes)
  - Upload audio files (MP3, WAV, M4A)
  - Type or paste text directly

- **🤖 AI-Powered Processing**
  - Automatic transcription using OpenAI Whisper
  - SOAP note generation using Claude 3.5 Sonnet
  - Medical terminology and professional formatting

- **📝 Note Management**
  - Rich text editor (TipTap) for review and editing
  - Save drafts and completed notes
  - Search and filter by patient identifier or date
  - Export as PDF or DOCX

- **📊 Dashboard & Analytics**
  - Recent notes overview
  - Monthly usage statistics
  - Audio transcription minutes tracking

### Subscription & Billing
- **Free Trial**: 10 notes/month, 14 days
- **Basic Plan**: Unlimited notes, limited audio transcription
- **Pro Plan**: Unlimited notes and audio transcription

- Stripe integration for payments
- Usage tracking and limits enforcement
- Subscription management portal

### Security & Compliance
- **HIPAA-compliant** architecture
- End-to-end encryption
- JWT-based authentication
- Rate limiting and request validation
- No storage of PII (Patient Identifiable Information)

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 19.2 + TypeScript
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Rich Text Editor**: TipTap
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 16
- **Authentication**: JWT
- **File Upload**: Multer
- **AI Services**:
  - Anthropic Claude API (SOAP generation)
  - OpenAI Whisper API (transcription)
- **Payment Processing**: Stripe
- **Document Generation**: PDFKit, docx

### DevOps
- **Containerization**: Docker & Docker Compose
- **Deployment**: Vercel (frontend) + Railway (backend)
- **Database Hosting**: Supabase/Railway

## 📋 Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 16
- Docker & Docker Compose (optional)
- API Keys:
  - Anthropic API Key
  - OpenAI API Key
  - Stripe API Keys

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/clinical-docs-ai.git
cd clinical-docs-ai
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clinical_docs

# AI Services
ANTHROPIC_API_KEY=sk-ant-api03-xxx
OPENAI_API_KEY=sk-xxx

# Authentication
JWT_SECRET=your-secure-random-string

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d db
```

#### Option B: Local PostgreSQL

```bash
createdb clinical_docs
psql -d clinical_docs -f database/schema.sql
```

### 4. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && npm install
```

### 5. Run the Application

#### Development Mode

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run separately
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

#### Using Docker Compose

```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

## 📁 Project Structure

```
clinical-docs-ai/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── store/           # Zustand state management
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # CSS and Tailwind styles
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Configuration files
│   │   ├── types/          # TypeScript types
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── database/                # Database schema and migrations
│   ├── schema.sql          # PostgreSQL schema
│   └── migrations/         # Database migrations
│
├── docker/                  # Docker configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx.conf
│
├── docker-compose.yml       # Docker Compose configuration
├── .env.example            # Environment variables template
├── package.json            # Root package.json
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Notes
- `POST /api/notes` - Create note
- `POST /api/notes/upload-audio` - Upload & transcribe audio
- `POST /api/notes/:id/generate` - Generate SOAP note
- `GET /api/notes` - List notes (paginated)
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `POST /api/notes/:id/export` - Export as PDF/DOCX
- `GET /api/notes/dashboard/stats` - Dashboard statistics

### Subscription
- `GET /api/subscription` - Get current subscription
- `GET /api/subscription/plans` - List available plans
- `POST /api/subscription/create-checkout` - Create Stripe checkout
- `POST /api/subscription/create-portal-session` - Billing portal
- `GET /api/subscription/usage` - Current month usage
- `POST /api/subscription/webhook` - Stripe webhook

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run all tests
npm test
```

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables:
   - `VITE_API_URL`
4. Deploy

### Backend (Railway)

1. Create new project in Railway
2. Add PostgreSQL database
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Database Migration

```bash
# Production database setup
psql -h your-db-host -U your-user -d your-db -f database/schema.sql
```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `subscriptions` - Stripe subscription data
- `notes` - Clinical notes
- `audio_files` - Audio file metadata
- `usage_tracking` - Monthly usage statistics
- `templates` - SOAP note templates
- `payment_history` - Payment records

See `database/schema.sql` for complete schema.

## 🔐 Security Best Practices

1. **Never commit** `.env` files or API keys
2. Use **strong JWT secrets** in production
3. Enable **HTTPS** for all production traffic
4. Implement **rate limiting** (already configured)
5. Regularly **update dependencies**
6. Use **environment-specific** configurations
7. Enable **database backups**
8. Follow **HIPAA compliance** guidelines

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
- Open an issue on GitHub
- Email: support@clinicaldocs.ai
- Documentation: https://docs.clinicaldocs.ai

## ⚠️ Disclaimer

This tool is designed to assist healthcare professionals with documentation. It does NOT replace professional medical judgment. All AI-generated content must be reviewed and verified by qualified healthcare providers before use in clinical practice.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude API
- [OpenAI](https://openai.com) for Whisper API
- [Stripe](https://stripe.com) for payment processing
- All open-source contributors

---

Built with ❤️ for healthcare professionals worldwide

**Version:** 1.0.0
**Last Updated:** 2025-01-16
