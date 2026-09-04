# Mach10 Media Portfolio

Mach10 Media's portfolio site is a Vite + React + TypeScript frontend backed by Firebase Authentication and Cloud Firestore.

## Stack

- Vite
- React 19
- TypeScript
- Firebase Auth
- Cloud Firestore
- Vercel for hosting

## Local Development

Prerequisites:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment Variables

Copy `.env.example` into `.env.local` if you want to override the inquiry destination email locally.

Supported Vite variables:

- `VITE_INQUIRY_NOTIFICATION_EMAIL`: Optional override for inquiry email notifications. Defaults to `mach10media.et@gmail.com`.
- `VITE_APP_CHECK_SITE_KEY`: reCAPTCHA v3 site key that activates Firebase App Check. Optional until you enable App Check; see [`.env.example`](.env.example).

## Firebase Requirements

This app reads its Firebase web configuration from [firebase-applet-config.json](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firebase-applet-config.json).

Before production launch, make sure Firebase is configured with:

- A Firestore database containing the `projects` collection
- An `inquiries` collection for contact form submissions
- Google Authentication enabled for the admin account
- Production domains added to Firebase Authentication Authorized Domains
- Firestore rules deployed from [firestore.rules](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firestore.rules)

### Enabling App Check (recommended)

The `inquiries` collection accepts writes from anonymous visitors, which makes it spam-abusable without App Check. To turn it on:

1. Register the web app under **Firebase console → App Check** with a reCAPTCHA v3 key for `mach10media.et` (and localhost for dev).
2. Set `VITE_APP_CHECK_SITE_KEY` in the hosting environment (and `.env.local` for dev).
3. Only after both steps, tighten [firestore.rules](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firestore.rules) by adding `&& request.app != null` to the public write conditions — adding it earlier rejects every web request.

### Drive scope note

Admin sign-in intentionally requests the full Google Drive OAuth scope: the admin dashboard browses, searches, uploads, and deletes files across the connected Drive account (see `src/components/AdminDashboardView.tsx`). The narrower `drive.file`/`drive.readonly` scopes would break that media picker. The token is only obtained during admin sign-in, which is gated by the verified-email allowlist in the Firestore rules.

## Work-Log (Internal Time Tracking)

The admin dashboard includes an internal time-tracking tool (`src/components/worklog/`), built on the same Firebase project:

- **Team** (admin tab): pre-register each employee's Google email + full name. Only registered, active accounts can enter the dashboard; everyone else is signed out at the gate.
- **Timer** — one session at a time, with pause/resume (break time excluded) and client/work-type categorization required before a session can be logged.
- **Missed Work** — manual entries dated today or yesterday (Addis Ababa time) save directly; anything older is flagged as a late submission and requires **peer approval** (any member except the submitter, admin included).
- **Team Status** — live view of who is running / paused / off.
- **Reports** — daily/weekly/monthly totals with employee/client/work-type filters and CSV export. Only `completed` entries that are `not_required` or `approved` count; pending and rejected entries never do.
- **Categories** (admin tab) — CRUD for clients and work types (soft-delete via deactivation preserves history).

Data lives in the Firestore collections `team_members`, `clients`, `work_types`, and `time_entries` (with a `pauses` subcollection), protected by the rules in [firestore.rules](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firestore.rules). Deploy rule changes with `npm run deploy:firestore-rules` before first use — the work-log collections are unreachable until the new rules are live.

Deploy Firestore rules with:

```bash
npm run deploy:firestore-rules
```

## Deploying To Vercel

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add any needed environment variables in Vercel:
   - `VITE_INQUIRY_NOTIFICATION_EMAIL` if you want a non-default inbox
5. After the first deploy, add the Vercel domain and any custom domain to Firebase Auth Authorized Domains.

## Launch Checklist

- `npm run build` passes
- `npm run lint` passes
- Firebase Auth Authorized Domains include the deployed site
- Firestore security rules are deployed
- Firestore has live `projects` data
- Inquiry form submission works on the production URL
