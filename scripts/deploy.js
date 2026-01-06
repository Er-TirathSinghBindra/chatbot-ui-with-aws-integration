#!/usr/bin/env node

/**
 * Deployment script for Chatbot Frontend
 * 
 * This script:
 * 1. Syncs the build output to S3
 * 2. Invalidates CloudFront cache
 * 
 * Usage:
 *   npm run deploy              # Deploy to default environment
 *   npm run deploy:prod         # Deploy to production
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--env') && args[args.indexOf('--env') + 1] === 'production';

// Load environment variables
const envFile = isProduction ? '.env.production' : '.env';
const envPath = join(__dirname, '..', envFile);

console.log(`\n🚀 Starting deployment...`);
console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);

// Configuration
const config = {
  s3Bucket: process.env.S3_BUCKET || '',
  cloudFrontDistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  buildDir: 'dist',
};

// Validate configuration
if (!config.s3Bucket) {
  console.error('❌ Error: S3_BUCKET environment variable is required');
  console.error('   Set it in your .env file or as an environment variable');
  process.exit(1);
}

if (!config.cloudFrontDistributionId) {
  console.warn('⚠️  Warning: CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation.');
}

// Helper function to execute commands
function exec(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Step 1: Sync to S3
const syncCommand = `aws s3 sync ${config.buildDir} s3://${config.s3Bucket} --delete --region ${config.awsRegion}`;
if (!exec(syncCommand, 'Syncing files to S3')) {
  process.exit(1);
}

// Step 2: Set cache control headers
console.log('\n📦 Setting cache control headers...');

// Cache static assets for 1 year
const cacheStaticCommand = `aws s3 cp s3://${config.s3Bucket}/assets s3://${config.s3Bucket}/assets --recursive --metadata-directive REPLACE --cache-control "public, max-age=31536000, immutable" --region ${config.awsRegion}`;
exec(cacheStaticCommand, 'Setting cache headers for static assets');

// Don't cache index.html
const noCacheIndexCommand = `aws s3 cp s3://${config.s3Bucket}/index.html s3://${config.s3Bucket}/index.html --metadata-directive REPLACE --cache-control "no-cache, no-store, must-revalidate" --region ${config.awsRegion}`;
exec(noCacheIndexCommand, 'Setting no-cache headers for index.html');

// Step 3: Invalidate CloudFront cache
if (config.cloudFrontDistributionId) {
  const invalidateCommand = `aws cloudfront create-invalidation --distribution-id ${config.cloudFrontDistributionId} --paths "/*"`;
  if (exec(invalidateCommand, 'Invalidating CloudFront cache')) {
    console.log('\n⏳ CloudFront invalidation in progress. This may take a few minutes.');
  }
}

// Success!
console.log('\n✨ Deployment completed successfully!\n');

if (config.cloudFrontDistributionId) {
  console.log(`🌐 Your app will be available at:`);
  console.log(`   https://${config.cloudFrontDistributionId}.cloudfront.net\n`);
} else {
  console.log(`🌐 Your app is available in S3 bucket: ${config.s3Bucket}\n`);
}

console.log('📝 Next steps:');
console.log('   1. Wait for CloudFront invalidation to complete (if applicable)');
console.log('   2. Test your application');
console.log('   3. Monitor CloudWatch logs for any issues\n');
