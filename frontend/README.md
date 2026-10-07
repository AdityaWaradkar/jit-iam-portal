# Frontend : Next.js Self Service Portal

Interactive portal for requesting, approving, and monitoring just in time access to cloud resources.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- Shadcn UI components
- Lucide icons

## Structure

app/                 Next.js routes
components/
  layout/            Sidebar, topbar, shell
  dashboard/         Dashboard widgets
  ui/                Shadcn primitives
lib/                 API client and utilities

## Local development

From frontend/:

npm install
npm run dev

The portal runs at http://localhost:3000.

## Environment

Create frontend/.env.local with:

NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

## Scripts

npm run dev      Start the development server
npm run build    Production build
npm run start    Run the production build
npm run lint     ESLint

## Roadmap reference

Section 3  : Frontend skeleton (this section)
Section 6  : Persona switcher
Section 10 : Requests dashboard
Section 11 : Approver queue
Section 14 : Credential display
Section 16 : Embedded terminal
Section 17 : Slack simulator
Section 19 : Audit viewer
Section 20 : Security dashboard
Section 21 : Guided tour