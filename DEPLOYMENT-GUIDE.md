# Deployment Guide for PitScouting App

This guide provides instructions for deploying the PitScouting app to Render (backend) and Vercel (frontend).

## Known Issues and Fixes

### 1. White Screen on Team Details Page

The white screen on the team details page is caused by the `coralLevels` property being a string instead of an array. The frontend is trying to use `.map()` on this property, causing the error:

```
TypeError: e.map is not a function
```

#### Fix in Frontend:

Add error handling in your TeamDetails.tsx file around line 102:

```tsx
// Before rendering coralLevels, ensure it's an array
const coralLevelsArray = Array.isArray(team.coralLevels) 
  ? team.coralLevels 
  : typeof team.coralLevels === 'string'
    ? (
        // Try to parse the string
        (() => {
          try {
            // Handle PostgreSQL array format
            if (team.coralLevels.startsWith('{') && team.coralLevels.endsWith('}')) {
              return team.coralLevels
                .replace(/^\{|\}$/g, '') // Remove { and }
                .split(',')
                .map(item => item.trim().replace(/^"|"$/g, '')); // Remove quotes
            }
            // Try standard JSON parse
            return JSON.parse(team.coralLevels);
          } catch (e) {
            console.error('Error parsing coralLevels:', e);
            return [];
          }
        })()
      )
    : [];

// Then use coralLevelsArray instead of team.coralLevels in your map function
{coralLevelsArray.map((level) => (
  <Chip key={level} label={level} />
))}
```

### 2. Image Path Issue

The image paths are currently pointing to `/api/storage/[filename]` but the server is expecting `/uploads/[filename]`.

#### Fix:

We've added routes to handle both paths in the backend. If you still encounter issues, update your frontend to use the correct path:

```tsx
// Change this:
<img src={`/api/storage/${team.imageUrl}`} alt="Robot" />

// To this:
<img src={team.imageUrl} alt="Robot" />
```

### 3. Error Creating Team

The error message when creating a team is likely due to a validation issue or a missing response handler. The team is still being created successfully.

#### Fix:

Add better error handling in your form submission code:

```tsx
try {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(teamData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Error creating team');
  }
  
  // Success handling
  console.log('Team created successfully:', data);
  // Show success message
} catch (error) {
  console.error('Error creating team:', error);
  // Show error message
}
```

## Deployment Instructions

### Backend Deployment to Render

1. **Create a new Web Service on Render**:
   - Connect your GitHub repository
   - Select the branch to deploy
   - Set the build command: `npm install && npm run build`
   - Set the start command: `npm start`

2. **Environment Variables**:
   - `NODE_ENV=production`
   - `DATABASE_URL` (Render will provide this if you're using their PostgreSQL service)
   - `PORT` (Render will set this automatically)
   - `JWT_SECRET` (for authentication)

3. **Database Setup**:
   - Create a PostgreSQL database on Render
   - The app will automatically set up the tables on first run

4. **CORS Configuration**:
   - Update the CORS configuration in `src/index.ts` to allow your Vercel domain:

```typescript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
```

### Frontend Deployment to Vercel

1. **Create a new Project on Vercel**:
   - Connect your GitHub repository
   - Set the framework preset to React

2. **Environment Variables**:
   - `REACT_APP_API_URL=https://your-render-app.onrender.com` (or whatever your Render URL is)

3. **Build Settings**:
   - Build command: `npm run build`
   - Output directory: `build`

4. **API Configuration**:
   - Update your API calls to use the environment variable:

```tsx
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

// Use this in your fetch calls
fetch(`${API_URL}/api/teams`)
```

## Post-Deployment Verification

After deploying, verify the following:

1. **API Endpoints**: Test all API endpoints using the `/frontend-debug` tool
2. **Team Creation**: Create a test team and verify it appears in the database
3. **Team Details**: Check if team details are displayed correctly
4. **Image Upload**: Test image upload and verify the images are accessible

## Troubleshooting

If you encounter issues after deployment:

1. **Check Logs**: Review the logs in Render and Vercel for error messages
2. **Database Connection**: Verify the database connection is working
3. **CORS Issues**: Check for CORS errors in the browser console
4. **Environment Variables**: Ensure all environment variables are set correctly

For persistent issues, refer to the `FRONTEND-TROUBLESHOOTING.md` file for more detailed debugging steps. 