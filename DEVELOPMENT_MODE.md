# Development Mode Guide

## Testing Without AWS Credentials

The application includes development mode flags that allow you to test the UI without setting up AWS infrastructure.

## Quick Start (No AWS Setup Required)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **The `.env` file is already configured for development mode:**
   ```env
   VITE_BYPASS_AUTH=true
   VITE_USE_MOCK_DATA=true
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:5173/
   ```

That's it! The app will run with mock data and bypassed authentication.

## What Gets Bypassed

### 🔓 Authentication Bypass (`VITE_BYPASS_AUTH=true`)
- Accepts test credentials in login page
- Test email: `test@chatbot.com`
- Test password: `admin`
- No real AWS Cognito required

### 🚪 Login Page Bypass (`VITE_BYPASS_LOGIN_PAGE=true`)
- Skips login page entirely
- Goes straight to app
- Use when you don't want to see login page

### 🔧 Mock Data (`VITE_USE_MOCK_DATA=true`)
- Uses mock conversations instead of DynamoDB
- Simulates API responses instead of calling API Gateway
- Creates conversations locally without DynamoDB
- Simulates 1-second delay for realistic feel

## Development Mode Features

### Mock Conversations
- 2 sample conversations pre-loaded
- Can create new conversations (stored in memory only)
- Conversations persist during the session

### Mock Messages
- Sample messages in each conversation
- Can send new messages
- Simulated system responses
- Message status updates (sending → sent)

### Full UI Testing
- ✅ All UI components work
- ✅ Conversation switching
- ✅ Message sending
- ✅ Loading states
- ✅ Error handling UI
- ✅ Responsive design

## Console Messages

When running in development mode, you'll see helpful console messages:

```
🔓 Development mode: Authentication bypassed
🔧 Development mode: Using mock conversations
🔧 Development mode: Using mock messages
🔧 Development mode: Simulating message send
🔧 Development mode: Skipping DynamoDB conversation creation
```

## Switching to Production Mode

When you're ready to test with real AWS services:

1. **Update `.env` file:**
   ```env
   VITE_BYPASS_AUTH=false
   VITE_USE_MOCK_DATA=false
   
   # Add your AWS credentials
   VITE_API_GATEWAY_ENDPOINT=https://your-api.execute-api.us-east-1.amazonaws.com/prod
   VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   VITE_COGNITO_CLIENT_ID=your-client-id
   VITE_DYNAMODB_REGION=us-east-1
   VITE_CHAT_HISTORY_TABLE=ChatHistory
   VITE_CONVERSATIONS_TABLE=Conversations
   ```

2. **Restart the dev server:**
   ```bash
   npm run dev
   ```

3. **Set up AWS infrastructure:**
   - Follow [docs/AWS_SETUP.md](docs/AWS_SETUP.md)

## Environment Variables Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_BYPASS_AUTH` | `true` / `false` | Accept test credentials in login page |
| `VITE_BYPASS_LOGIN_PAGE` | `true` / `false` | Skip login page entirely |
| `VITE_USE_MOCK_DATA` | `true` / `false` | Use mock data instead of AWS services |
| `VITE_API_GATEWAY_ENDPOINT` | URL | Your API Gateway endpoint |
| `VITE_COGNITO_USER_POOL_ID` | Pool ID | Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | Client ID | Cognito App Client ID |
| `VITE_COGNITO_REGION` | Region | AWS region for Cognito |
| `VITE_DYNAMODB_REGION` | Region | AWS region for DynamoDB |
| `VITE_CHAT_HISTORY_TABLE` | Table name | DynamoDB table for messages |
| `VITE_CONVERSATIONS_TABLE` | Table name | DynamoDB table for conversations |

## Testing Scenarios

### Test Login Page with Mock Data (Recommended)
```env
VITE_BYPASS_AUTH=true
VITE_USE_MOCK_DATA=true
VITE_BYPASS_LOGIN_PAGE=false
```
Perfect for: Testing login UI, auth flows with test credentials
Login with: `test@chatbot.com` / `admin`

### Skip Login Page Entirely
```env
VITE_BYPASS_AUTH=true
VITE_USE_MOCK_DATA=true
VITE_BYPASS_LOGIN_PAGE=true
```
Perfect for: Quick UI development, component testing

### Test Real Authentication
```env
VITE_BYPASS_AUTH=false
VITE_USE_MOCK_DATA=true
VITE_BYPASS_LOGIN_PAGE=false
```
Perfect for: Testing Cognito integration, real auth flows

### Test DynamoDB Only
```env
VITE_BYPASS_AUTH=true
VITE_USE_MOCK_DATA=false
VITE_BYPASS_LOGIN_PAGE=true
```
Perfect for: Testing database operations, data persistence

### Full Production Mode
```env
VITE_BYPASS_AUTH=false
VITE_USE_MOCK_DATA=false
VITE_BYPASS_LOGIN_PAGE=false
```
Perfect for: End-to-end testing, production deployment

## Limitations in Development Mode

When using mock data:
- ❌ Data doesn't persist between sessions
- ❌ No real API responses
- ❌ No actual authentication
- ❌ Can't test AWS-specific features
- ❌ Can't test error scenarios from AWS services

## Troubleshooting

### App still requires authentication
- Check that `.env` file exists in project root
- Verify `VITE_BYPASS_AUTH=true` is set
- Restart the dev server after changing `.env`

### Mock data not loading
- Check that `VITE_USE_MOCK_DATA=true` is set
- Check browser console for error messages
- Restart the dev server

### Changes to .env not taking effect
- Vite requires restart after `.env` changes
- Stop the dev server (Ctrl+C)
- Start again with `npm run dev`

## Best Practices

1. **Use development mode for UI work**
   - Faster iteration
   - No AWS costs
   - No network latency

2. **Test with real AWS before deployment**
   - Verify authentication flows
   - Test error handling
   - Check performance

3. **Never commit `.env` with real credentials**
   - Use `.env.example` for templates
   - Keep `.env` in `.gitignore`

4. **Use different environments**
   - `.env` for development (mock mode)
   - `.env.production` for production (real AWS)

## Need Help?

- **UI Issues:** Check browser console
- **AWS Setup:** See [docs/AWS_SETUP.md](docs/AWS_SETUP.md)
- **General Help:** See [README.md](README.md)

---

**Happy Testing! 🚀**
