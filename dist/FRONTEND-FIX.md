# Frontend Fix Instructions

This document provides instructions on how to fix the frontend issues you're experiencing.

## Issue 1: White Screen on Team Details Page

The white screen on the team details page is caused by the `coralLevels` property being a string instead of an array. The frontend is trying to use `.map()` on this property, causing the error:

```
TypeError: e.map is not a function
```

### Automatic Fix

We've created a script that will automatically fix this issue for you:

```bash
# Run from the backend directory
npm run fix-frontend ../path/to/frontend
```

This script will:
1. Look for the TeamDetails.tsx file in your frontend project
2. Add code to handle different formats of coralLevels
3. Fix any image path issues

### Manual Fix

If the automatic fix doesn't work, you can manually add this code to your TeamDetails.tsx file:

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

## Issue 2: Image Path Issue

The image paths are currently pointing to `/api/storage/[filename]` but the server is expecting `/uploads/[filename]`.

### Automatic Fix

The `fix-frontend` script will also fix this issue automatically.

### Manual Fix

If the automatic fix doesn't work, update your image paths in the frontend:

```tsx
// Change this:
<img src={`/api/storage/${team.imageUrl}`} alt="Robot" />

// To this:
<img src={team.imageUrl} alt="Robot" />
```

## Issue 3: Error Creating Team

The error message when creating a team is likely due to a validation issue or a missing response handler. The team is still being created successfully.

### Fix

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

For detailed deployment instructions, please refer to the `DEPLOYMENT-GUIDE.md` file. 