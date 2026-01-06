# Quick Start Guide

## Test the Login Page (No AWS Setup Required!)

### Step 1: Start the Development Server

```bash
cd chatbot-frontend
npm run dev
```

### Step 2: Open Your Browser

Navigate to: `http://localhost:5173/`

### Step 3: You'll See the Login Page! 🎉

The beautiful login interface will appear with:
- Gradient blue background
- Chat bubble icon
- Email and password fields
- Sign up and forgot password links

### Step 4: Login with Test Credentials

Use these test credentials:

```
Email: test@chatbot.com
Password: TeSt@25
```

### Step 5: Explore the App

After logging in, you'll see:
- 2 sample conversations
- Working message interface
- Delete conversation feature
- Sign out button

---

## Configuration

The `.env` file is already configured for you:

```env
VITE_BYPASS_AUTH=true              # Accept test credentials
VITE_USE_MOCK_DATA=true            # Use mock data
VITE_BYPASS_LOGIN_PAGE=false       # Show login page
```

---

## Different Testing Modes

### 1. Test Login Page (Current Setup)
```env
VITE_BYPASS_LOGIN_PAGE=false
```
- Shows login page
- Login with: `test@chatbot.com` / `admin`

### 2. Skip Login Page
```env
VITE_BYPASS_LOGIN_PAGE=true
```
- Goes straight to app
- No login required

---

## Features You Can Test

### ✅ Login Page
- Sign in form
- Sign up form (UI only in dev mode)
- Forgot password (UI only in dev mode)
- Form validation
- Error messages
- Success messages

### ✅ Main App
- View conversations
- Send messages
- Receive mock responses
- Create new conversations
- Delete conversations
- Sign out

---

## Troubleshooting

### Login page not showing?
Check `.env` file:
```env
VITE_BYPASS_LOGIN_PAGE=false
```

### Test credentials not working?
Make sure you're using:
- Email: `test@chatbot.com`
- Password: `TeSt@25`

### Changes not taking effect?
Restart the dev server:
1. Press `Ctrl+C` to stop
2. Run `npm run dev` again

---

## Next Steps

### To Use Real AWS Cognito:

1. Set up AWS infrastructure (see `docs/AWS_SETUP.md`)

2. Update `.env`:
```env
VITE_BYPASS_AUTH=false
VITE_BYPASS_LOGIN_PAGE=false
VITE_USE_MOCK_DATA=false

VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_API_GATEWAY_ENDPOINT=https://your-api.execute-api.us-east-1.amazonaws.com/prod
```

3. Restart dev server

---

## Screenshots

### Login Page
- Beautiful gradient background
- Clean, modern design
- Responsive layout
- Clear error messages

### Main App
- Two-column layout
- Conversation list on left
- Chat interface on right
- Sign out button in header

---

## Support

- **Login Issues**: Check console for development mode messages
- **UI Issues**: Check browser console for errors
- **General Help**: See `README.md` or `DEVELOPMENT_MODE.md`

---

**Enjoy testing! 🚀**
