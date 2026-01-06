# AWS Infrastructure Setup Guide

This guide provides step-by-step instructions for setting up the AWS infrastructure required for the Chatbot Frontend application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Node.js and npm installed

## Table of Contents

1. [DynamoDB Tables Setup](#dynamodb-tables-setup)
2. [AWS Cognito User Pool Setup](#aws-cognito-user-pool-setup)
3. [API Gateway Setup](#api-gateway-setup)
4. [S3 Bucket for Static Hosting](#s3-bucket-for-static-hosting)
5. [CloudFront Distribution](#cloudfront-distribution)
6. [Environment Configuration](#environment-configuration)

---

## DynamoDB Tables Setup

### 1. ChatHistory Table

This table stores all messages in conversations.

**Table Schema:**
- **Table Name:** `ChatHistory`
- **Partition Key:** `conversationId` (String)
- **Sort Key:** `timestamp` (Number)
- **Attributes:**
  - `messageId` (String)
  - `messageType` (String: 'user' | 'system')
  - `content` (String)
  - `status` (String, optional)

**AWS CLI Command:**

```bash
aws dynamodb create-table \
  --table-name ChatHistory \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**CloudFormation Template:**

```yaml
ChatHistoryTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: ChatHistory
    AttributeDefinitions:
      - AttributeName: conversationId
        AttributeType: S
      - AttributeName: timestamp
        AttributeType: N
    KeySchema:
      - AttributeName: conversationId
        KeyType: HASH
      - AttributeName: timestamp
        KeyType: RANGE
    BillingMode: PAY_PER_REQUEST
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    SSESpecification:
      SSEEnabled: true
```

### 2. Conversations Table

This table stores conversation metadata.

**Table Schema:**
- **Table Name:** `Conversations`
- **Partition Key:** `conversationId` (String)
- **Attributes:**
  - `title` (String)
  - `createdAt` (Number)
  - `lastMessageAt` (Number)
  - `messageCount` (Number)

**AWS CLI Command:**

```bash
aws dynamodb create-table \
  --table-name Conversations \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**CloudFormation Template:**

```yaml
ConversationsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Conversations
    AttributeDefinitions:
      - AttributeName: conversationId
        AttributeType: S
    KeySchema:
      - AttributeName: conversationId
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    SSESpecification:
      SSEEnabled: true
```

---

## AWS Cognito User Pool Setup

### 1. Create User Pool

**AWS CLI Command:**

```bash
aws cognito-idp create-user-pool \
  --pool-name ChatbotUserPool \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --region us-east-1
```

**Note the User Pool ID from the output.**

### 2. Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --client-name ChatbotWebClient \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region us-east-1
```

**Note the Client ID from the output.**

### 3. Configure Federated Identity Provider (Optional)

If using federated authentication (e.g., Google, Facebook, SAML):

```bash
aws cognito-idp create-identity-provider \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --provider-name <PROVIDER_NAME> \
  --provider-type <PROVIDER_TYPE> \
  --provider-details file://provider-details.json \
  --region us-east-1
```

**CloudFormation Template:**

```yaml
CognitoUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: ChatbotUserPool
    AutoVerifiedAttributes:
      - email
    UsernameAttributes:
      - email
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: false

CognitoUserPoolClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    ClientName: ChatbotWebClient
    UserPoolId: !Ref CognitoUserPool
    GenerateSecret: false
    ExplicitAuthFlows:
      - ALLOW_USER_PASSWORD_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH
```

---

## API Gateway Setup

### 1. Create REST API

```bash
aws apigateway create-rest-api \
  --name ChatbotAPI \
  --description "API for Chatbot Backend" \
  --region us-east-1
```

### 2. Configure CORS

The API Gateway must allow CORS requests from your frontend domain.

**CORS Configuration:**
- **Allowed Origins:** Your CloudFront distribution URL or custom domain
- **Allowed Methods:** POST, OPTIONS
- **Allowed Headers:** Content-Type, Authorization

### 3. Configure Cognito Authorizer

```bash
aws apigateway create-authorizer \
  --rest-api-id <YOUR_API_ID> \
  --name CognitoAuthorizer \
  --type COGNITO_USER_POOLS \
  --provider-arns arn:aws:cognito-idp:us-east-1:<ACCOUNT_ID>:userpool/<USER_POOL_ID> \
  --identity-source method.request.header.Authorization \
  --region us-east-1
```

**CloudFormation Template:**

```yaml
ChatbotAPI:
  Type: AWS::ApiGateway::RestApi
  Properties:
    Name: ChatbotAPI
    Description: API for Chatbot Backend

CognitoAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    Name: CognitoAuthorizer
    Type: COGNITO_USER_POOLS
    RestApiId: !Ref ChatbotAPI
    ProviderARNs:
      - !GetAtt CognitoUserPool.Arn
    IdentitySource: method.request.header.Authorization
```

---

## S3 Bucket for Static Hosting

### 1. Create S3 Bucket

```bash
aws s3 mb s3://chatbot-frontend-<UNIQUE_ID> --region us-east-1
```

### 2. Configure Bucket for Static Website Hosting

```bash
aws s3 website s3://chatbot-frontend-<UNIQUE_ID> \
  --index-document index.html \
  --error-document index.html
```

### 3. Set Bucket Policy for CloudFront Access

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::chatbot-frontend-<UNIQUE_ID>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

**CloudFormation Template:**

```yaml
FrontendBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub chatbot-frontend-${AWS::AccountId}
    VersioningConfiguration:
      Status: Enabled
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
```

---

## CloudFront Distribution

### 1. Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name chatbot-frontend-<UNIQUE_ID>.s3.amazonaws.com \
  --default-root-object index.html
```

### 2. Configure Custom Error Responses

For single-page application routing, configure CloudFront to return `index.html` for 404 errors:

**CloudFormation Template:**

```yaml
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Enabled: true
      DefaultRootObject: index.html
      Origins:
        - Id: S3Origin
          DomainName: !GetAtt FrontendBucket.RegionalDomainName
          S3OriginConfig:
            OriginAccessIdentity: ''
          OriginAccessControlId: !Ref CloudFrontOAC
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        AllowedMethods:
          - GET
          - HEAD
          - OPTIONS
        CachedMethods:
          - GET
          - HEAD
        ForwardedValues:
          QueryString: false
          Cookies:
            Forward: none
        Compress: true
      CustomErrorResponses:
        - ErrorCode: 404
          ResponseCode: 200
          ResponsePagePath: /index.html
        - ErrorCode: 403
          ResponseCode: 200
          ResponsePagePath: /index.html
      PriceClass: PriceClass_100

CloudFrontOAC:
  Type: AWS::CloudFront::OriginAccessControl
  Properties:
    OriginAccessControlConfig:
      Name: !Sub ${AWS::StackName}-OAC
      OriginAccessControlOriginType: s3
      SigningBehavior: always
      SigningProtocol: sigv4
```

---

## Environment Configuration

After setting up all AWS resources, create a `.env` file in your project root:

```bash
# API Gateway Configuration
VITE_API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# DynamoDB Configuration
VITE_DYNAMODB_REGION=us-east-1
VITE_CHAT_HISTORY_TABLE=ChatHistory
VITE_CONVERSATIONS_TABLE=Conversations

# AWS Cognito Configuration
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REGION=us-east-1
```

---

## IAM Permissions

### Required Permissions for Cognito Authenticated Users

Create an IAM role for authenticated Cognito users with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:<ACCOUNT_ID>:table/ChatHistory",
        "arn:aws:dynamodb:us-east-1:<ACCOUNT_ID>:table/Conversations"
      ]
    }
  ]
}
```

---

## Verification Steps

1. **Test DynamoDB Tables:**
   ```bash
   aws dynamodb describe-table --table-name ChatHistory
   aws dynamodb describe-table --table-name Conversations
   ```

2. **Test Cognito User Pool:**
   ```bash
   aws cognito-idp describe-user-pool --user-pool-id <YOUR_USER_POOL_ID>
   ```

3. **Test API Gateway:**
   ```bash
   curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   ```

4. **Test S3 Bucket:**
   ```bash
   aws s3 ls s3://chatbot-frontend-<UNIQUE_ID>
   ```

5. **Test CloudFront Distribution:**
   ```bash
   curl https://your-distribution-id.cloudfront.net
   ```

---

## Troubleshooting

### DynamoDB Access Issues
- Verify IAM role has correct permissions
- Check Cognito identity pool configuration
- Ensure credentials are being passed correctly

### CORS Issues
- Verify API Gateway CORS configuration
- Check CloudFront cache behavior
- Ensure proper headers in API responses

### Authentication Issues
- Verify Cognito User Pool and Client IDs
- Check redirect URIs configuration
- Ensure tokens are being stored and sent correctly

---

## Cost Optimization

- Use DynamoDB on-demand billing for variable workloads
- Enable CloudFront caching to reduce S3 requests
- Set up CloudWatch alarms for cost monitoring
- Consider using AWS Free Tier resources for development

---

## Security Best Practices

1. Enable encryption at rest for DynamoDB tables
2. Use HTTPS only for all communications
3. Implement least privilege IAM policies
4. Enable CloudTrail for audit logging
5. Use AWS WAF with CloudFront for additional protection
6. Regularly rotate Cognito app client secrets (if using)
7. Enable MFA for Cognito users
8. Set up CloudWatch alarms for suspicious activity
