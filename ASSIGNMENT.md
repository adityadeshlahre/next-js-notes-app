Full Stack Developer Assignment
Stack: Next.js (App Router), TypeScript, PostgreSQL (or any relational DB)

Overview
Build and deploy a Notes app with authentication, tagging, and filtering. The goal is to evaluate your ability to
write clean, production-quality full stack code — not just make things work, but make them right.
You are encouraged to use AI coding tools like Cursor, Claude Code, GitHub Copilot, or similar. However, in
the next round you will be expected to walk through your code and explain every decision — architecture,
tradeoffs, why you structured things the way you did. If you can’t explain it, it won’t count.

Features
Authentication
• Sign up with email and password
• Sign in and Sign out
• Passwords must be hashed (bcrypt or argon2)
• Protected routes — redirect unauthenticated users to login
• Session management using JWT or server-side sessions (not localStorage)

Notes
• Create, edit, and delete notes (title + body)
• Notes are private — users can only see and interact with their own notes
• Server-side ownership checks on every API call — the backend must enforce this, not just the frontend

Tags
• Create and assign tags to notes
• A note can have multiple tags; a tag can belong to multiple notes (many-to-many)
• Display tags on each note

Filtering & Sorting
• Filter notes by one or more tags
• Sort notes by created date (newest / oldest)
• Search notes by title

Technical Requirements
Code Quality
• TypeScript strict mode — no any
• ESLint + Prettier configured, no warnings or errors on npm run lint
• Meaningful, consistent folder and file structure
• No hardcoded secrets — use environment variables

Database
• Relational DB with proper schema design
• Migrations (Prisma, Drizzle, or raw SQL)
• Schema must reflect proper relationships:
• User → Notes (one-to-many)
• Notes ↔ Tags (many-to-many via a join table)

Validation & Error Handling
• Input validation on the server using Zod or similar
• Proper HTTP status codes
• Graceful error states on the frontend — no raw error dumps shown to users
Testing
• We value a test-driven development approach. Use tests to guide the implementation of critical paths and
business logic.
• This includes but is not limited to:
• Unit tests for utility functions and validation logic
• Integration or API tests for auth flows (signup, signin, signout)
• API tests for note ownership enforcement (a user cannot read, edit, or delete another user’s notes)
• Tests for filtering and sorting logic
• All tests must pass with npm run test
Accessibility
• Semantic HTML throughout
• Keyboard navigable
• ARIA labels where needed
• No accessibility errors in axe or Lighthouse

Deployment
• Deploy the app to Railway, Render, Vercel, or any public hosting
• The deployed app must be fully functional — auth, notes, tags, and filtering all working in production
• Provide a test account (email + password) we can use to log in directly

Deliverables
Share the following:

1. GitHub repo — public or with invite access
2. Live URL of the deployed app
3. Test account credentials to log in
4. README.md covering:
   • How to run locally
   • Your DB schema and why you designed it this way
   • Any tradeoffs or shortcuts taken due to time
   • Your testing approach and where TDD influenced your implementation.
   • What you would improve given more time
   • How you used AI coding tools (Cursor, Claude Code, Copilot, etc.) — be specific and honest, it’s
   encouraged
