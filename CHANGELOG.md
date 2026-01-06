# Changelog

All notable changes to the Chatbot Frontend project will be documented in this file.

## [1.2.0] - 2025-11-22

### Added
- **Login Page with AWS Cognito**
  - Beautiful, responsive login interface
  - Email/password authentication
  - Sign up with email verification
  - Forgot password / password reset flow
  - Account confirmation with verification code
  - Sign out functionality with confirmation
  - Integrated with AWS Cognito authentication
  - Replaces generic authentication screen

### Features
- Sign in with email and password
- Create new account with email verification
- Password reset via email
- Account confirmation flow
- Sign out button in conversation list header
- Form validation and error handling
- Success/error message display
- Responsive design matching app theme

### Technical Changes
- Created `LoginPage` component with multiple auth views
- Integrated AWS Amplify auth methods (signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword)
- Updated `ProtectedRoute` to show LoginPage instead of generic message
- Added sign out button to ConversationList header
- Implemented view switching (login/signup/confirm/forgot-password/reset-password)

---

## [1.1.0] - 2025-11-22

### Added
- **Delete Conversation Feature**
  - Users can now delete conversations they no longer need
  - Delete button appears on hover in the conversation list
  - Confirmation dialog prevents accidental deletions
  - Deletes all associated messages from DynamoDB
  - Automatically clears active conversation if deleted
  - Works in both production and development modes

### Technical Changes
- Added `deleteConversation()` method to DynamoDB service
- Implemented batch deletion for conversation messages (handles DynamoDB 25-item limit)
- Added `DELETE_CONVERSATION` action type to state management
- Updated AppContext reducer to handle conversation deletion
- Enhanced ConversationList component with delete functionality
- Updated UI with hover-based delete button and trash icon

### Documentation Updates
- Added Requirement 7 for delete conversation functionality
- Updated design document with delete conversation architecture
- Added Task 22 to implementation tasks (marked as complete)
- Updated glossary with delete conversation terminology

---

## [1.0.0] - 2025-11-22

### Initial Release
- Complete chatbot frontend application with AWS integration
- AWS Cognito authentication
- DynamoDB for persistent storage
- API Gateway integration
- Multiple conversation management
- Real-time message sending and receiving
- Responsive UI with Tailwind CSS
- Development mode with mock data
- Comprehensive documentation
- Automated deployment scripts

### Features
- ✅ Multiple conversation management
- ✅ Real-time messaging
- ✅ AWS Cognito authentication
- ✅ DynamoDB persistence
- ✅ API Gateway integration
- ✅ Optimistic UI updates
- ✅ Auto-scroll to latest messages
- ✅ Loading states and error handling
- ✅ Responsive design
- ✅ Message status tracking
- ✅ Development mode bypass

### Components
- App (root component with error boundary)
- ProtectedRoute (authentication guard)
- ConversationList (sidebar with conversation list)
- ConversationView (main chat interface)
- MessageList (message display)
- MessageInput (message composition)

### Services
- authService (AWS Cognito integration)
- dynamoDBService (DynamoDB operations)
- apiGatewayService (API communication)
- idService (UUID generation)

### Documentation
- README.md (project overview and setup)
- AWS_SETUP.md (infrastructure setup guide)
- DEVELOPMENT_MODE.md (testing without AWS)
- IMPLEMENTATION_SUMMARY.md (complete implementation details)

---

## Version History

- **1.2.0** - Login page with AWS Cognito authentication
- **1.1.0** - Delete conversation feature
- **1.0.0** - Initial release with core functionality
