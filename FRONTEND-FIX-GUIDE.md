# Frontend Fix Guide

This guide provides solutions for common issues with the PitScouting frontend application.

## Issue 1: TypeError: e.map is not a function

This error occurs when the frontend tries to use `.map()` on the `coralLevels` property, but it's not an array. This happens because the backend sometimes returns `coralLevels` as a string instead of an array.

### Solution 1: Use the Automatic Fix Script

We've created a script that automatically fixes this issue:

```bash
# Run from the backend directory
npm run fix-frontend-all /path/to/your/frontend
```

This script will:
1. Find the TeamDetails.tsx file in your frontend project
2. Add code to handle different formats of coralLevels
3. Fix image path issues

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

This error occurs when the frontend tries to access images using the `/api/storage/` path, but the backend is serving them from `/uploads/`.

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

## Testing Image Paths

You can test if images are accessible using the test page we've added:

1. Visit `/test-image-paths` on your backend server
2. Enter the filename of an image (e.g., `1741974263519.png`)
3. Click "Test Image"

This will show you if the image is accessible via both paths.

## Debugging Tips

### Check the Network Tab

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Network tab
3. Reload the page
4. Look for failed requests (red)
5. Check the paths being used for images

### Check the Console

1. Open your browser's developer tools
2. Go to the Console tab
3. Look for errors related to coralLevels or image paths

### Test the Backend API Directly

You can test the backend API directly to see what data is being returned:

```bash
curl http://your-backend-url/api/teams/1234
```

Check if `coralLevels` is an array or a string in the response.

## Need More Help?

If you're still experiencing issues, please:

1. Check the backend logs for errors
2. Try the test endpoints:
   - `/check-image/[filename]` - Check if an image exists
   - `/test-image-paths` - Test image paths
3. Contact the development team with specific error messages 