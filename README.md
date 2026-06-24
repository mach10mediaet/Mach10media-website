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

## Firebase Requirements

This app reads its Firebase web configuration from [firebase-applet-config.json](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firebase-applet-config.json).

Before production launch, make sure Firebase is configured with:

- A Firestore database containing the `projects` collection
- An `inquiries` collection for contact form submissions
- Google Authentication enabled for the admin account
- Production domains added to Firebase Authentication Authorized Domains
- Firestore rules deployed from [firestore.rules](/Users/susu/Documents/Work%20/Mach10/MACH10MEDIA.COM/mach10-media-portfolio/firestore.rules)

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
