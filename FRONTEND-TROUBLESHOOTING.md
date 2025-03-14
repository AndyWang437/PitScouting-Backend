# Frontend Troubleshooting Guide

This guide will help you diagnose and fix common frontend issues, particularly the "white screen" problem that can occur when displaying team details.

## Quick Fixes

1. **Run the diagnostic tool**:
   ```
   npm run diagnose-frontend
   ```

2. **Visit the debugging page**:
   Open your browser and navigate to:
   ```
   http://localhost:10000/frontend-debug
   ```
   This page provides tools to test API connectivity, CORS configuration, and team data rendering.

3. **Insert a test team**:
   ```
   http://localhost:10000/insert-test-team
   ```
   This will create a test team with number 1334 in the database.

## Common Issues and Solutions

### 1. White Screen on Team Details Page

#### Possible Causes:

1. **API Connection Issues**: The frontend can't connect to the backend API.
2. **CORS Issues**: Cross-Origin Resource Sharing is blocking requests.
3. **Data Parsing Issues**: The frontend can't properly parse the data from the API, especially the `coralLevels` field.
4. **React Component Errors**: Errors in the component rendering logic.
5. **Routing Issues**: Problems with React Router configuration.

#### Solutions:

##### API Connection Issues:
- Ensure the API is running and accessible
- Check that the frontend is using the correct API URL
- Add proper error handling for API requests

```jsx
// Example of robust API request with error handling
const fetchTeam = async (teamNumber) => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch(`http://localhost:10000/api/teams/${teamNumber}`);
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching team:', error);
    setError(error.message);
    return null;
  } finally {
    setLoading(false);
  }
};
```

##### CORS Issues:
- The backend has been configured to allow all origins for debugging
- If you're still experiencing CORS issues, check your browser console for specific errors
- Ensure your frontend is making requests with the correct headers

##### Data Parsing Issues:
- Add robust handling for the `coralLevels` field:

```jsx
// Process team data to ensure coralLevels is always an array
const processTeamData = (team) => {
  if (!team) return null;
  
  // Handle coralLevels
  if (team.coralLevels) {
    if (typeof team.coralLevels === 'string') {
      try {
        team.coralLevels = JSON.parse(team.coralLevels);
      } catch (e) {
        console.error('Error parsing coralLevels:', e);
        team.coralLevels = [];
      }
    }
  } else {
    team.coralLevels = [];
  }
  
  return team;
};
```

##### React Component Errors:
- Wrap your components in error boundaries:

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

- Add conditional rendering for loading states:

```jsx
const TeamDetails = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ... fetch data ...
  
  if (loading) {
    return <div>Loading team details...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!team) {
    return <div>No team found</div>;
  }
  
  return (
    // Render team details
  );
};
```

##### Routing Issues:
- Check your React Router configuration:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams/:teamNumber" element={<TeamDetails />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
};
```

- Ensure the `basename` prop is set correctly if your app is deployed to a subdirectory
- Check that your `package.json` has the correct `homepage` field:

```json
{
  "name": "your-app",
  "version": "0.1.0",
  "homepage": ".",
  // ...
}
```

### 2. Checking Browser Console for Errors

Always check your browser's developer console for errors:

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Refresh the page with the white screen
4. Look for any red error messages

Common errors and their solutions:

- **"Failed to fetch"**: API connection issue. Check if the API is running and accessible.
- **CORS errors**: The backend is not allowing cross-origin requests. Check CORS configuration.
- **"Cannot read property 'X' of undefined/null"**: Data structure issue. Add null checks.
- **JSON parsing errors**: Issues with parsing JSON data. Add try/catch blocks.

### 3. Testing with the API Directly

Use the test endpoints we created to verify the API is working correctly:
- Visit `http://localhost:10000/insert-test-team` to create a test team
- Visit `http://localhost:10000/test-team-page` to verify the team details can be displayed
- Visit `http://localhost:10000/frontend-debug` for comprehensive testing

If the test pages work but your frontend doesn't, the issue is likely in your frontend code.

## Advanced Troubleshooting

If the above solutions don't resolve your issue:

1. **Add detailed logging**: Add console.log statements throughout your frontend code to track the flow of data.

2. **Check network requests**: Use the Network tab in your browser's developer tools to see what requests are being made and their responses.

3. **Verify API responses**: Use tools like Postman or the `/frontend-debug` page to test API endpoints directly.

4. **Check for environment differences**: Ensure your development and production environments are configured similarly.

5. **Review build configuration**: Check your build process for any issues that might affect production builds.

## Need More Help?

If you're still experiencing issues after trying these solutions, please provide:

1. Specific error messages from the browser console
2. Screenshots of the issue
3. Details about your environment (browser, operating system, etc.)
4. Any recent changes to the codebase

This information will help diagnose and fix the issue more effectively. 