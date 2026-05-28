# Gossip Group Chat Web Application

A mobile-first, responsive single-page web application for a private 'Gossip Group' chat. 

## Features
- **Secure Authentication:** Members log in using their Phone Number & a unique Passcode. Admins log in using a master admin password.
- **Access Requests:** Non-registered users can submit join requests. Admins can review, approve (which auto-registers them and creates a passcode), or reject.
- **Availability Hand Toggles:** Simple 2-button status logging system (Right Hand 🙋‍♂️ for Lunch, Left Hand 🙋‍♀️ for Dinner) with premium glow themes and micro-animations.
- **Interactive Chat Interface:** Displays group broadcasts and private DMs (filtered securely on the API level). Includes a local "Clear Chat" option.
- **Admin Command Center:** CRUD control over members list, WhatsApp inviter (generating `wa.me` links with pre-filled instruction text), and a danger zone database wipe.
- **Persistent Syncing:** Built to sync using **Vercel KV**. Includes a local file-based database fallback (`gossip_mock_db.json`) for seamless offline development.

---

## Tech Stack
- **Core:** Next.js (App Router), React, Lucide React
- **Styling:** Tailwind CSS, PostCSS
- **Persistence:** Vercel KV (using `@vercel/kv`) or local file-based mock database fallback

---

## Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory (refer to `.env.example`):
   ```env
   ADMIN_PASSWORD=gossipadmin123
   JWT_SECRET=super-secret-gossip-key-9988
   ```

3. **Run Locally:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Since Vercel KV env variables are not present locally, the application will automatically initialize a persistent file database (`gossip_mock_db.json`) in your project folder.

---

## Default Login Credentials (Initial Seed)
The application seeds a default Admin account on first run:
- **Member Login:**
  - **Phone Number:** `1234567890`
  - **Passcode:** `1234`
- **Admin Portal:**
  - **Admin Password:** `gossipadmin123` (or whatever you set in `ADMIN_PASSWORD` env variable)

*Note: Once logged into the Admin Portal, you can add new members, edit the default admin account, or review requests.*

---

## Deploying to Vercel

1. **Push to GitHub:** Commit your project code and push to a remote repository.
2. **Import to Vercel:** Open the Vercel Dashboard, import the repository, and deploy.
3. **Link Vercel KV:**
   - Go to your Vercel project dashboard.
   - Click the **Storage** tab.
   - Create a **KV (Redis)** database.
   - Link the KV database to your project. Vercel will automatically inject the `KV_URL` and `KV_REST_API_TOKEN` environment variables.
4. **Deploy & Set Secrets:**
   - In the project settings, add the environment variable `ADMIN_PASSWORD` (and optional `JWT_SECRET`) if you want custom values.
   - Re-deploy to apply.
