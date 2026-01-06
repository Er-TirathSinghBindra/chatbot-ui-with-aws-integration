# Chatbot Frontend

A high-performance React + TypeScript chatbot frontend application with AWS integration.

## Features

- 💬 Multiple conversation management
- 🔐 AWS Cognito authentication with login page
- 👤 Sign up, sign in, password reset flows
- 🗑️ Delete conversations
- 💾 DynamoDB for persistent storage
- 🚀 Fast and responsive UI with React 18
- 🎨 Tailwind CSS for styling
- ⚡ Vite for blazing fast development

## Prerequisites

- Node.js 18+ and npm
- AWS Account with configured services:
  - AWS Cognito User Pool
  - DynamoDB tables
  - API Gateway
  - S3 bucket (for deployment)
  - CloudFront distribution (optional)

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Update the values with your AWS configuration:

```env
# API Gateway
VITE_API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# DynamoDB
VITE_DYNAMODB_REGION=us-east-1
VITE_CHAT_HISTORY_TABLE=ChatHistory
VITE_CONVERSATIONS_TABLE=Conversations

# AWS Cognito
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=us-east-1
```

### 3. AWS Infrastructure Setup

Follow the detailed setup guide in [docs/AWS_SETUP.md](docs/AWS_SETUP.md) to configure:
- DynamoDB tables
- AWS Cognito User Pool
- API Gateway
- S3 bucket and CloudFront (for deployment)

### 4. Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to AWS (development)
- `npm run deploy:prod` - Deploy to AWS (production)

## Deployment

### Prerequisites

- AWS CLI installed and configured
- S3 bucket created
- CloudFront distribution configured (optional)

### Environment Variables for Deployment

Create `.env.production` file:

```env
# Application Configuration
VITE_API_GATEWAY_ENDPOINT=https://your-prod-api.execute-api.us-east-1.amazonaws.com/prod
VITE_DYNAMODB_REGION=us-east-1
VITE_CHAT_HISTORY_TABLE=ChatHistory-Prod
VITE_CONVERSATIONS_TABLE=Conversations-Prod
VITE_COGNITO_USER_POOL_ID=us-east-1_PRODXXXXXX
VITE_COGNITO_CLIENT_ID=your-prod-client-id
VITE_COGNITO_REGION=us-east-1

# Deployment Configuration
S3_BUCKET=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_ID=E1234EXAMPLE
AWS_REGION=us-east-1
```

### Deploy to Production

```bash
npm run deploy:prod
```

This will:
1. Build the application
2. Sync files to S3
3. Set appropriate cache headers
4. Invalidate CloudFront cache

## Project Structure

```
chatbot-frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ConversationList.tsx
│   │   ├── ConversationView.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageList.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/            # React Context for state management
│   │   └── AppContext.tsx
│   ├── services/           # AWS service integrations
│   │   ├── authService.ts
│   │   ├── apiGatewayService.ts
│   │   ├── dynamoDBService.ts
│   │   └── idService.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── errorHandler.ts
│   ├── config/             # Configuration
│   │   └── environment.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── docs/                   # Documentation
│   └── AWS_SETUP.md
├── scripts/                # Deployment scripts
│   └── deploy.js
└── public/                 # Static assets
```

## Architecture

### Authentication Flow

1. User accesses the application
2. AWS Cognito federated authentication check
3. If not authenticated, redirect to Cognito login
4. On successful authentication, obtain Cognito session token
5. Use token for API Gateway and DynamoDB access

### Message Flow

1. User sends a message
2. Generate unique message ID
3. Save user message to DynamoDB
4. Send message to API Gateway with Cognito token
5. Receive system response
6. Save system message to DynamoDB
7. Update conversation metadata
8. Display response in UI

## Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** React Context API with useReducer
- **Styling:** Tailwind CSS
- **AWS Services:**
  - AWS Amplify (Cognito authentication)
  - AWS SDK v3 (DynamoDB)
  - API Gateway (backend communication)
- **Hosting:** AWS S3 + CloudFront

## Security Considerations

- All communications use HTTPS
- Cognito tokens stored securely by AWS Amplify
- Automatic token refresh handled by Amplify
- Input validation and sanitization
- CORS properly configured on API Gateway
- DynamoDB access controlled via IAM roles

## Performance Optimizations

- Code splitting for faster initial load
- Optimistic UI updates for better UX
- Message virtualization for large conversations
- CloudFront CDN for global distribution
- Efficient state management with React Context

## Troubleshooting

### Authentication Issues

- Verify Cognito User Pool ID and Client ID
- Check that redirect URIs are configured correctly
- Ensure user is confirmed in Cognito

### DynamoDB Access Issues

- Verify IAM role permissions
- Check table names in environment variables
- Ensure Cognito credentials are valid

### API Gateway Issues

- Verify endpoint URL
- Check CORS configuration
- Ensure Cognito authorizer is configured
- Check CloudWatch logs for errors

### Deployment Issues

- Verify AWS CLI is configured correctly
- Check S3 bucket permissions
- Ensure CloudFront distribution ID is correct
- Verify environment variables are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Check [docs/AWS_SETUP.md](docs/AWS_SETUP.md) for infrastructure setup
- Review CloudWatch logs for runtime errors
- Check browser console for client-side errors

## Roadmap

- [ ] Real-time updates with WebSockets
- [ ] Message search functionality
- [ ] Conversation export/import
- [ ] Rich media support (images, files)
- [ ] Multi-user support
- [ ] Message editing and deletion
- [ ] Typing indicators
- [ ] Read receipts
