# Aspiration V2 - AI-Powered Learning Platform

A structured, free, video-based tech learning platform that turns scattered YouTube content into guided skill-based learning paths for self-directed learners.

## 🚀 Project Overview

Aspiration V2 helps learners move from "I want to learn this skill" to "I know what to watch, where to start, and how to track my progress." The platform organizes technical skills into categories, connects each skill to relevant YouTube content, and provides a focused environment to browse, watch, take notes, and track progress.

**Project Status:** ✅ MVP Complete (All 11 Sprints Finished)

## 🛠 Tech Stack

- **Frontend:** Next.js 16.2.1, React 19.2.4, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Firebase 12.11.0 (Firestore)
- **State Management:** Zustand 5.0.12, TanStack Query 5.91.3
- **Testing:** Vitest 4.1.0, Playwright 1.58.2
- **Language:** TypeScript 5
- **Deployment:** Vercel
- **AI Tools:** Windsurf, Antigravity

## ✨ Key Features

### Learner Features
- Google authentication with role-based access control
- Browse skills by category
- Curated YouTube videos with keyword search fallback
- Embedded video player
- Persistent video notes (one per video)
- Manual video progress tracking
- Calculated skill progress
- Responsive student-friendly UI

### Admin Features
- Category CRUD (create, edit, delete, reorder)
- Skill CRUD (create, edit, delete, reorder)
- Curated video management per skill
- Video ordering
- User role management (SuperAdmin only)
- Admin-to-learner preview links

### Security Features
- Route guards (Edge middleware)
- Firestore security rules
- SuperAdmin role enforcement
- Secure API endpoints
- Private note ownership

## 📁 Project Structure

```
aspiration_v2/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   ├── components/          # React components
│   ├── dashboard/           # Dashboard pages
│   ├── lib/                 # Utility libraries
│   └── store/               # Zustand stores
├── context/                 # Comprehensive documentation (git submodule)
│   ├── 01-source/           # Source materials
│   ├── 02-domain/           # Domain models
│   ├── 03-backlog/          # Sprint tracking
│   ├── 04-architecture/     # Architecture docs
│   └── ...                  # Additional documentation
├── tests/                   # E2E tests
│   └── e2e/                 # Playwright specs
├── .gitmodules              # Git submodule configuration
├── FIREBASE_SETUP.md        # Firebase setup guide
└── package.json             # Dependencies
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm or yarn
- Git
- Firebase account
- Google Cloud project with YouTube Data API v3 enabled

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aspiration_v2
git submodule update --init --recursive
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Follow the detailed setup in [FIREBASE_SETUP.md](FIREBASE_SETUP.md) or [context/SETUP.md](context/SETUP.md).

Create a `.env.local` file:
```env
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-storage-bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>

# SuperAdmin Email (auto-assigns superAdmin role on first login)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=<your-admin-email>

# YouTube API Key
YOUTUBE_API_KEY=<your-youtube-api-key>

# Firebase Service Account (minified JSON as single-quoted string)
FIREBASE_SERVICE_ACCOUNT_KEY='<minified-service-account-json>'
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

## 📚 Documentation

Comprehensive project documentation is available in the `context/` directory (git submodule):

- [context/00-START-HERE.md](context/00-START-HERE.md) - Project overview
- [context/01-PRODUCT_VISION.md](context/01-PRODUCT_VISION.md) - Product vision
- [context/SETUP.md](context/SETUP.md) - Detailed setup guide
- [context/03-backlog/](context/03-backlog/) - Sprint tracking and user stories
- [context/04-architecture/](context/04-architecture/) - System architecture

## 🎯 Sprint History

- **Sprint 1:** Firebase & Authentication ✅
- **Sprint 2:** Categories & Skills Seeding ✅
- **Sprint 3:** Design System Corrections ✅
- **Sprint 4:** YouTube Integration ✅
- **Sprint 5:** Notes & Progress ✅
- **Sprint 6:** Firestore Rules ✅
- **Sprint 7:** Admin Experience Audit ✅
- **Sprint 8:** Curated Video Manager ✅
- **Sprint 9:** Edit & Reorder Controls ✅
- **Sprint 10:** Secure Role Mutation ✅
- **Sprint 11:** Admin Feedback Standardization ✅

## 🚀 Deployment

### Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## 📝 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E tests with UI

# Code Quality
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check
```

## 🔐 Security

- Route guards via Edge middleware
- Firestore security rules
- Role-based access control (learner, admin, superAdmin)
- Secure API endpoints
- Private note ownership enforcement

## 🤝 Contributing

See [context/CONTRIBUTING.md](context/CONTRIBUTING.md) for the complete 8-step workflow.

## 📄 License

This project is part of a capstone project for the "Agentic" Hackathon.

## 📞 Support

For troubleshooting, see [context/TROUBLESHOOTING.md](context/TROUBLESHOOTING.md) or [FIREBASE_SETUP.md](FIREBASE_SETUP.md).
