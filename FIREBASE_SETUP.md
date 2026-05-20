# 🔑 Firebase Credentials & Environment Setup Guide

To run the application locally on your laptop (`npm run dev`) and test with active authentication/database records, configure the keys in your local `.env.local` file. Follow these two core setup paths:

---

## 1. Client-Side Credentials Setup

Navigate to your **Firebase Console ➔ Project Settings ➔ General ➔ Web Apps** to extract your public configuration block. Paste these values directly inside your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_SUPER_ADMIN_EMAIL="durjoy1971office@gmail.com"
```

> [!NOTE]
> Setting `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` promotes `durjoy1971office@gmail.com` to the `superAdmin` role automatically on first Google authentication/sign-in.

---

## 2. Server-Side Service Account Key Setup

To enable Next.js SSR middleware gates, we authenticate with Firestore securely.

### Step-by-Step Generation:
1. Open the **Firebase Console ➔ Project Settings ➔ Service Accounts**.
2. Click **Generate New Private Key**.
3. Save the downloaded JSON file locally (e.g., `service-account.json`).

### JSON Minification Recipe:
The server SDK parses the minified JSON block in one single line.

#### Option A: Quick Command-Line Minification (Recommended)
Open a terminal in the directory where your JSON key was downloaded and run:
```bash
cat service-account.json | jq -c .
```
*If `jq` is not installed, you can use Node directly:*
```bash
node -e "console.log(JSON.stringify(require('./service-account.json')))"
```

#### Option B: Manual Minification
1. Open the private key JSON file in your code editor.
2. Remove all spaces, carriage returns, and newlines so that the entire JSON block is flattened into a single, continuous line.
3. Escape all newline sequences (`\n`) inside the `"private_key"` value by using double backslashes (`\\n`).

### Paste into `.env.local`:
Wrap the minified JSON block in **single quotes** (`'`) to prevent bash terminal expansion issues:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"..."}'
```

> [!IMPORTANT]
> Always keep your `.env.local` untracked and locked out of Git commits. It is listed inside `.gitignore` for security.

---

## 🚀 Verifying the Environment Setup

Once `.env.local` is populated, start the local development server:
```bash
npm run dev
```

Run tests to ensure client and mock SDK engines synchronize safely:
```bash
npm run test
npm run test:e2e
```

---

## 🛠️ Troubleshooting Common API Errors

### Error: `CONFIGURATION_NOT_FOUND` / `400 (Bad Request)`
If clicking the Google Sign-In button logs a `CONFIGURATION_NOT_FOUND` bad request error in your browser console, it means your Firebase project has not enabled the Google Sign-In Provider yet.

#### How to Resolve:
1. Open the [Firebase Console](https://console.firebase.google.com/) and click on your active project **aspirations-v2**.
2. On the left navigation panel, go to **Build** ➔ **Authentication**.
3. *If you are opening this for the first time*: Click the blue **Get Started** button to initialize the service.
4. Go to the **Sign-in method** tab.
5. Under **Additional providers**, click **Google**.
6. Toggle the **Enable** switch.
7. Set your public-facing support email (e.g. `durjoy1971office@gmail.com`).
8. Click **Save** to apply the configuration.
9. Refresh your local website at `http://localhost:3000` and sign in again!

### Error: `FirebaseError: Failed to get document because the client is offline`
If your landing page is stuck showing the spinner `"Synchronizing secure session..."` and you see a client offline error in your terminal or browser console, it means your Cloud Firestore Database has not been initialized or created yet in the Firebase Console.

#### How to Resolve:
1. Open the [Firebase Console](https://console.firebase.google.com/) and click on your active project **aspirations-v2**.
2. On the left navigation panel, under the **Build** menu, click **Firestore Database**.
3. Click the blue **Create database** button.
4. Select your preferred database location/region (e.g., `us-central`).
5. Choose **Start in test mode** (this enables immediate local development and database access) and click **Next**.
6. Click **Create** to launch the database.
7. Once the database is initialized in the console, refresh your web browser at `http://localhost:3000`. The loading screen will immediately resolve, synchronize, and log you into the secure workspace!


