# Authentication Guide

## Overview

The Chatbot Frontend uses AWS Cognito for secure user authentication. The application includes a complete authentication flow with sign in, sign up, email verification, and password reset capabilities.

## Features

### 🔐 Sign In
- Email and password authentication
- Secure session management
- Automatic token refresh
- Remember me functionality (via Cognito)

### 📝 Sign Up
- Create new account with email
- Password requirements validation
- Email verification with confirmation code
- Automatic redirect to login after confirmation

### 🔑 Password Reset
- Forgot password flow
- Verification code sent to email
- Set new password with confirmation
- Secure password reset process

### ✉️ Email Verification
- Confirmation code sent to email
- Account activation required before first login
- Resend code option (can be added)

### 🚪 Sign Out
- Secure session termination
- Confirmation dialog
- Redirect to login page

## User Flows

### New User Registration

1. Click "Sign up" on login page
2. Enter email and password
3. Confirm password
4. Click "Sign Up"
5. Check email for verification code
6. Enter code on confirmation page
7. Click "Confirm Account"
8. Redirected to login page
9. Sign in with credentials

### Existing User Login

1. Enter email and password
2. Click "Sign In"
3. Access granted to application

### Password Reset

1. Click "Forgot password?" on login page
2. Enter email address
3. Click "Send Reset Code"
4. Check email for reset code
5. Enter code and new password
6. Click "Reset Password"
7. Sign in with new password

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special characters (depending on Cognito configuration)

## AWS Cognito Configuration

### Required Cognito Settings

**User Pool Configuration:**
- Sign-in options: Email
- Password policy: As per requirements above
- Email verification: Required
- MFA: Optional (can be enabled)

**App Client Configuration:**
- Auth flows: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH
- No client secret (for web apps)
- Token expiration: Default or custom

### Environment Variables

```env
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=us-east-1
```

## Development Mode

For testing without AWS Cognito:

```env
VITE_BYPASS_AUTH=true
```

This will skip authentication and show the app directly.

## Security Features

### Token Management
- Tokens stored securely by AWS Amplify
- Automatic token refresh before expiration
- Secure token transmission to API Gateway

### Session Security
- HTTPS only in production
- Secure cookie handling
- XSS protection via React
- CSRF protection via Cognito

### Password Security
- Passwords never stored in plain text
- Hashed and salted by Cognito
- Secure password reset flow
- Password strength requirements enforced

## UI Components

### LoginPage Component

**Views:**
- `login` - Sign in form
- `signup` - Registration form
- `confirm` - Email verification
- `forgot-password` - Request reset code
- `reset-password` - Set new password

**Features:**
- Responsive design
- Form validation
- Error handling
- Success messages
- Loading states
- View switching

### Sign Out Button

Located in the conversation list header:
- Hover to see sign out icon
- Click to sign out
- Confirmation dialog
- Clears session and redirects

## Error Handling

### Common Errors

**UserNotFoundException**
- Message: "User not found. Please check your credentials."
- Action: Verify email or sign up

**NotAuthorizedException**
- Message: "Incorrect username or password."
- Action: Check credentials or reset password

**UserNotConfirmedException**
- Message: "User account not confirmed. Please check your email."
- Action: Complete email verification

**CodeMismatchException**
- Message: "Invalid verification code."
- Action: Check code or request new one

**ExpiredCodeException**
- Message: "Verification code expired. Please request a new one."
- Action: Request new code

**TooManyRequestsException**
- Message: "Too many authentication attempts. Please try again later."
- Action: Wait and retry

## Testing

### Manual Testing

1. **Sign Up Flow:**
   ```
   - Create account with valid email
   - Verify email confirmation sent
   - Enter confirmation code
   - Verify account activated
   ```

2. **Sign In Flow:**
   ```
   - Sign in with valid credentials
   - Verify access granted
   - Check token stored
   ```

3. **Password Reset Flow:**
   ```
   - Request password reset
   - Verify email received
   - Enter code and new password
   - Sign in with new password
   ```

4. **Sign Out Flow:**
   ```
   - Click sign out button
   - Confirm sign out
   - Verify redirected to login
   - Verify cannot access app
   ```

### Development Mode Testing

```env
VITE_BYPASS_AUTH=true
```

Skips authentication for UI testing.

## Troubleshooting

### Cannot Sign In

**Check:**
- Email is correct
- Password is correct
- Account is confirmed
- Cognito User Pool ID is correct
- App Client ID is correct

### Email Not Received

**Check:**
- Email address is correct
- Check spam folder
- Verify Cognito email configuration
- Check SES sending limits (if using SES)

### Confirmation Code Invalid

**Check:**
- Code entered correctly
- Code not expired (usually 24 hours)
- Request new code if needed

### Token Expired

**Action:**
- Amplify handles automatic refresh
- If refresh fails, user redirected to login
- Sign in again to get new token

## Best Practices

### For Users

1. Use strong, unique passwords
2. Don't share credentials
3. Sign out when done
4. Keep email secure
5. Report suspicious activity

### For Developers

1. Never commit credentials
2. Use environment variables
3. Enable MFA in production
4. Monitor failed login attempts
5. Implement rate limiting
6. Keep Amplify updated
7. Test all auth flows
8. Handle errors gracefully

## API Integration

### Getting Auth Token

```typescript
import { getFederatedToken } from './services/authService';

const token = await getFederatedToken();
// Use token in API requests
```

### Making Authenticated Requests

```typescript
const response = await fetch(apiEndpoint, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  // ... other options
});
```

## Future Enhancements

Potential improvements:
- [ ] Social login (Google, Facebook)
- [ ] Multi-factor authentication (MFA)
- [ ] Biometric authentication
- [ ] Remember me checkbox
- [ ] Resend confirmation code
- [ ] Account deletion
- [ ] Profile management
- [ ] Session timeout warning

## Support

For authentication issues:
1. Check AWS Cognito console
2. Review CloudWatch logs
3. Verify environment variables
4. Test with AWS CLI
5. Check network connectivity

## References

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS Amplify Auth](https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
