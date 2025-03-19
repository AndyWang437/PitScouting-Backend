# Deployment Guide

This guide provides instructions for deploying the PitScouting application to various platforms.

## Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)
- Git

## Deploying to Render

### Backend Deployment

1. **Create a new Web Service on Render**:
   - Sign in to your Render account
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the backend repository

2. **Configure the Web Service**:
   - Name: `pitscouting-backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Select the appropriate plan (Free tier works for testing)

3. **Set Environment Variables**:
   - Click on "Environment" tab
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `JWT_SECRET`: (generate a secure random string)
     - `DATABASE_URL`: (your PostgreSQL connection string if using PostgreSQL)

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

### Frontend Deployment

1. **Create a new Static Site on Render**:
   - Click "New" and select "Static Site"
   - Connect your GitHub repository
   - Select the frontend repository

2. **Configure the Static Site**:
   - Name: `pitscouting-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build` or `dist` (depending on your frontend setup)

3. **Set Environment Variables**:
   - Add the following environment variables:
     - `REACT_APP_API_URL`: (URL of your backend service, e.g., `https://pitscouting-backend.onrender.com`)

4. **Deploy**:
   - Click "Create Static Site"
   - Wait for the build and deployment to complete

## Deploying to Vercel

### Backend Deployment

1. **Create a vercel.json file in your backend repository**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ]
   }
   ```

2. **Deploy to Vercel**:
   - Install Vercel CLI: `npm install -g vercel`
   - Run `vercel login` and follow the instructions
   - Run `vercel` in the backend repository root
   - Follow the prompts to configure your project
   - Set the environment variables as needed

### Frontend Deployment

1. **Deploy to Vercel**:
   - Run `vercel` in the frontend repository root
   - Follow the prompts to configure your project
   - Set the environment variables:
     - `REACT_APP_API_URL`: (URL of your backend service)

## Database Setup

### Using SQLite (Development)

SQLite is automatically configured for development. The database file will be created in the root directory.

### Using PostgreSQL (Production)

1. **Create a PostgreSQL database**:
   - You can use services like Render PostgreSQL, Heroku Postgres, or any other PostgreSQL provider
   - Get the connection string in the format: `postgresql://username:password@host:port/database`

2. **Set the DATABASE_URL environment variable**:
   - Add the connection string to your deployment platform's environment variables

3. **Run migrations**:
   - For Render, add a build command: `npm run migrate`
   - For Vercel, you'll need to run migrations manually or set up a CI/CD pipeline

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure the backend CORS configuration allows requests from your frontend domain
   - Check the `cors` configuration in `src/index.ts`

2. **Database Connection Issues**:
   - Verify your DATABASE_URL is correct
   - Check if your database service is running
   - Ensure your IP is allowed in the database firewall settings

3. **TypeScript Build Errors**:
   - Run `npm run build` locally to check for TypeScript errors
   - Fix any type errors before deploying

4. **Frontend Connection Issues**:
   - Verify the API URL in your frontend environment variables
   - Check browser console for network errors
   - Ensure the backend is accessible from the frontend

### Fixing Frontend Issues

If you encounter issues with the frontend, particularly with the `coralLevels` property, run the fix script:

```bash
npm run fix-frontend ../path/to/frontend
```

This script will automatically fix common issues in the frontend code.

## Monitoring and Logs

- **Render**: Access logs from the "Logs" tab in your service dashboard
- **Vercel**: Access logs from the "Deployments" section in your project dashboard

## Updating Your Deployment

1. Push changes to your GitHub repository
2. The deployment platform will automatically rebuild and deploy your application

## Support

If you encounter any issues, please refer to the documentation or create an issue in the GitHub repository. 