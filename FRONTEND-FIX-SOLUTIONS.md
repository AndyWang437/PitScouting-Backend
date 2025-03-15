# PitScouting Frontend Fix Solutions

This guide provides multiple solutions for fixing the frontend issues in the PitScouting application:

1. White screen on team details page (TypeError: e.map is not a function)
2. Cannot GET /api/storage/[filename].png

## Backend Fixes (Already Applied)

The backend has been updated to handle both issues:

1. **Image Path Fix**: The backend now serves images from both paths:
   - `/uploads/[filename]` (original path)
   - `/api/storage/[filename]` (for backward compatibility)

2. **Testing Tools**: New endpoints have been added to help diagnose and fix issues:
   - `/check-image/:filename` - Check if an image exists and show available paths
   - `/test-image-paths` - Test page to verify image accessibility
   - `/fix-frontend?url=YOUR_FRONTEND_URL` - Directly fix the frontend issues
   - `/frontend-fix-bookmarklet` - Get a bookmarklet to fix the frontend issues

## Solution 1: Use the Fix Frontend Tool

The easiest way to fix the issues is to use the Fix Frontend tool:

1. Visit: `https://pit-scouting-backend.onrender.com/fix-frontend?url=https://1334pitscouting.vercel.app`
2. This will load the team details page with fixes automatically applied
3. You can also specify a team number: `/fix-frontend?url=YOUR_FRONTEND_URL&team=TEAM_NUMBER`

## Solution 2: Use the Bookmarklet

A bookmarklet is a small piece of JavaScript code that you can save as a bookmark and run on any page:

1. Visit: `https://pit-scouting-backend.onrender.com/frontend-fix-bookmarklet`
2. Drag the "Fix PitScouting Frontend" button to your bookmarks bar
3. Navigate to the team details page (e.g., https://1334pitscouting.vercel.app/team/1)
4. Click the bookmarklet to apply the fixes
5. The page should now display correctly

## Solution 3: Manual Fix in Browser Console

You can manually fix the issues by running code in your browser's console:

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Paste and run the following code:

```javascript
// Fix for coralLevels not being an array
function fixCoralLevels() {
  try {
    // Find elements that might contain team data
    const teamElements = document.querySelectorAll('[data-team-id], [data-team-number]');
    
    teamElements.forEach(element => {
      // Try to find team data in the element
      const teamData = element.__team || element.team || element.dataset.team;
      
      if (teamData && teamData.coralLevels) {
        // Fix coralLevels if it's not an array
        if (!Array.isArray(teamData.coralLevels)) {
          if (typeof teamData.coralLevels === 'string') {
            try {
              teamData.coralLevels = JSON.parse(teamData.coralLevels);
            } catch (e) {
              console.error('Error parsing coralLevels:', e);
              teamData.coralLevels = [];
            }
          } else {
            teamData.coralLevels = [];
          }
        }
      }
    });
    
    console.log('coralLevels fix applied successfully!');
  } catch (error) {
    console.error('Error applying coralLevels fix:', error);
  }
}

// Fix for image paths
function fixImagePaths() {
  try {
    // Find all images with /api/storage/ in the src
    const images = document.querySelectorAll('img[src^="/api/storage/"]');
    
    images.forEach(img => {
      // Replace /api/storage/ with /uploads/
      img.src = img.src.replace('/api/storage/', '/uploads/');
    });
    
    console.log('Image path fixes applied successfully!');
  } catch (error) {
    console.error('Error applying image path fixes:', error);
  }
}

// Apply the fixes
fixCoralLevels();
fixImagePaths();

// Also apply the fixes after a delay to catch dynamically loaded content
setTimeout(function() {
  fixCoralLevels();
  fixImagePaths();
}, 1000);

alert('PitScouting frontend fixes applied!');
```

## Solution 4: Fix the Frontend Code

If you have access to the frontend code, you can fix the issues directly:

### Fix for coralLevels Issue

Find the file that displays team details (likely `TeamDetails.tsx` or similar) and add this code before using `team.coralLevels.map()`:

```javascript
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

### Fix for Image Path Issue

Search your frontend code for any instances of `/api/storage/` in image paths and replace them with the correct path:

```javascript
// Change this:
<img src={`/api/storage/${team.imageUrl}`} alt="Robot" />

// To this:
<img src={team.imageUrl} alt="Robot" />
```

Or if you're using a different format:

```javascript
// Change this:
<img src={`/api/storage/${filename}`} alt="Robot" />

// To this:
<img src={`/uploads/${filename}`} alt="Robot" />
```

## Testing the Fixes

After applying any of the fixes:

1. Visit the team details page (e.g., https://1334pitscouting.vercel.app/team/1)
2. The page should load without a white screen
3. The coralLevels should be displayed correctly
4. Images should be displayed properly

You can also test the image paths directly:
- Visit: `https://pit-scouting-backend.onrender.com/test-image-paths`
- Enter an image filename (e.g., `1741974263519.png`)
- Click "Test Image" to verify it's accessible via both paths

## Need More Help?

If you're still experiencing issues after applying these fixes, please:

1. Check the backend logs for errors
2. Try the test endpoints:
   - `/check-image/[filename]` - Check if an image exists
   - `/test-image-paths` - Test image paths
3. Contact the development team with specific error messages 