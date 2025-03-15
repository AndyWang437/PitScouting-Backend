# Frontend Issues Fix Guide

This guide provides solutions for two common issues with the PitScouting frontend application:

1. White screen on team details page (TypeError: e.map is not a function)
2. Cannot GET /api/storage/[filename].png

## Issue 1: White Screen on Team Details Page

The white screen on the team details page (e.g., https://1334pitscouting.vercel.app/team/1) is caused by a JavaScript error. When the frontend tries to use `.map()` on the `coralLevels` property, but it's not an array, you get a `TypeError: e.map is not a function` error.

### Solution 1: Use the Automatic Fix Script

We've created scripts that automatically fix this issue:

```bash
# From the backend directory
# For just the coralLevels issue:
npm run fix-frontend /path/to/your/frontend

# For all frontend issues (recommended):
npm run fix-frontend-all /path/to/your/frontend
```

### Solution 2: Manual Fix

If the automatic fix doesn't work, you can manually add this code to your TeamDetails.tsx file:

```tsx
// Before mapping over team.coralLevels, add this code:
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

// Then use coralLevelsArray instead of team.coralLevels
{coralLevelsArray.map((level) => (
  <Chip key={level} label={level} />
))}
```

## Issue 2: Cannot GET /api/storage/[filename].png

This error occurs when the frontend tries to access images using the `/api/storage/` path, but the backend is serving them from a different location.

### Solution 1: Backend Fix (Already Applied)

The backend has been updated to serve images from both paths:
- `/uploads/[filename]`
- `/api/storage/[filename]`

This means you can use either path to access images.

### Solution 2: Frontend Fix

If you're still seeing this issue, you can update your image paths in the frontend:

```tsx
// Change this:
<img src={`/api/storage/${team.imageUrl}`} alt="Robot" />

// To this:
<img src={team.imageUrl} alt="Robot" />
```

The `imageUrl` property already includes the correct path prefix (`/uploads/`).

## Testing Your Fixes

### Test the Team Details Page

1. After applying the fixes, visit your team details page (e.g., https://1334pitscouting.vercel.app/team/1)
2. The page should load correctly without a white screen
3. The coralLevels should be displayed as chips or tags

### Test Image Paths

1. Visit the dashboard page where team images are displayed
2. Images should load correctly
3. You can also test directly by visiting:
   - `/uploads/[filename].png`
   - `/api/storage/[filename].png`

## Debugging Tips

### Check the Console for Errors

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Look for errors related to coralLevels or image paths

### Test the Backend API

You can test if the backend is correctly serving images:

1. Visit `/test-image-paths` on your backend server
2. Enter the filename of an image
3. Click "Test Image"
4. This will show if the image is accessible via both paths

### Check Network Requests

1. Open your browser's developer tools
2. Go to the Network tab
3. Reload the page
4. Look for failed requests (red)
5. Check the paths being used for images

## Need More Help?

If you're still experiencing issues after applying these fixes, please:

1. Check the backend logs for errors
2. Try the test endpoints:
   - `/check-image/[filename]` - Check if an image exists
   - `/test-image-paths` - Test image paths
3. Contact the development team with specific error messages

## Deployment

These fixes are compatible with both development and production environments. The backend will automatically serve images from both paths, and the frontend fixes ensure compatibility with both path formats. 