# TecniFlux - Automotive Wiring Diagrams Platform

## Overview
TecniFlux is a professional web application for automotive technicians to search, decode VIN numbers, and view automotive wiring diagrams. The platform integrates with Google Sheets for diagram metadata, NHTSA VIN Decode API for vehicle information, and Google Gemini AI for enhanced web search. It operates on a subscription-based access model powered by Stripe. The business vision is to become the leading platform for automotive diagnostic information, enabling technicians to quickly find accurate wiring diagrams and related technical documentation, thereby improving efficiency and reducing repair times.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and TanStack Query for server state management. UI components are built with Shadcn/ui on Radix UI primitives, styled with Tailwind CSS, following a mobile-first, responsive design. The design is inspired by automotive interfaces (Tesla, Rivian), using an Electric Blue, Neon Cyan, and Graphite Gray color scheme with Inter and JetBrains Mono fonts. Key UI patterns include card-based layouts, modal viewers, form validation with React Hook Form and Zod, toast notifications, and progressive disclosure.

### Backend Architecture
The backend is built with Express.js on Node.js using TypeScript and ESM modules. It features a session-based authentication system configured for production behind Replit's proxy (`trust proxy: true`, `sameSite: 'lax'` for custom domain compatibility). The API is RESTful under `/api` and includes endpoints for web search, VIN search, Stripe checkout, webhook handling, and subscription management. Business logic layers include a storage abstraction, a Gemini service module, and Stripe integration, with search limits enforced by subscription tiers.

### Data Storage Solutions
The primary database is PostgreSQL via Neon, utilizing Drizzle ORM for type-safe queries and `@neondatabase/serverless` for connection pooling. The schema includes `users` (with authentication, Stripe, and subscription tracking fields) and `diagram_history`. Google Sheets serves as an external data source for diagram metadata, allowing non-technical updates to the catalog.

### Authentication & Authorization
The system uses session-based authentication with `admin` and `tecnico` roles, protected routes, and password hashing. Access control includes monthly search limits and subscription tier validation. A comprehensive administration panel allows managing users, diagrams, finances, and settings. A robust credential recovery system is implemented with rate limiting, email services (Resend), and secure token handling.

### System Design Choices
- **Content Protection - Secure PDF Viewer**: Implemented a two-endpoint architecture to protect diagrams from unauthorized downloads:
  - `/api/diagrams/:id/view` serves a custom HTML viewer with header ("TecniFlux • Visor seguro") and embedded iframe
  - `/api/diagrams/:id/file` streams PDF content using Google Drive API (more reliable than direct URL fetch)
  - Both endpoints validate: user authentication, active status, subscription status, and diagram existence
  - CSS technique (overflow: hidden + top: -40px) hides browser's native download toolbar
  - Frontend NEVER receives directUrl/fileUrl - all API responses sanitized via helper functions
  - Policy: Any user with active subscription can view any diagram (no per-diagram ownership restrictions)
- **Diagram History**: Tracks recently viewed diagrams per user, accessible on the profile page.
- **Admin Dashboard**: Provides key metrics, financial reports, and comprehensive management of diagrams and users.
- **Dynamic Search & Filtering**: Filters are dynamically loaded from the database, and search results are intelligently ordered based on 4 levels of priority (specific filters + complete diagrams having highest priority). Uses native HTML `<select>` elements instead of Radix Select for 100% mobile/desktop compatibility in production environments.
- **Visuals**: Incorporates a custom design language with a logo, SVG circuit patterns, blue glow effects, and subtle background textures.

## External Dependencies

### Third-Party APIs
1.  **NHTSA VIN Decode API**: Decodes 17-character VINs into vehicle specifications (make, model, year, etc.).
2.  **Google Gemini AI** (`@google/genai`): Utilized for web grounding, intelligent resource discovery, and generating summaries, requiring `GEMINI_API_KEY`.
3.  **Stripe Payment Processing**: Manages subscription plans (Free, Premium, Plus, Pro) using Checkout Sessions and webhooks for subscription lifecycle events. Requires `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`.
4.  **Google Drive**: Hosts PDF wiring diagrams, accessed via direct URLs stored in Google Sheets.
5.  **Resend**: Email service for sending credential recovery emails.

### Development Tools
-   Replit-specific plugins
-   Vite cartographer

### Environment Variables Required
-   `DATABASE_URL`
-   `GEMINI_API_KEY`
-   `STRIPE_SECRET_KEY`
-   `VITE_STRIPE_PUBLIC_KEY`
-   `RESEND_API_KEY` (for production email functionality)
-   `RESET_TOKEN_EXPIRATION_MINUTES`