# PitScouting Backend

Backend server for the Team 1334 Scouting App, designed to handle team and match data for robotics competitions.

## Features

- RESTful API for managing teams and matches
- Authentication system with JWT
- Support for both SQLite (development) and PostgreSQL (production)
- File upload for robot images
- Cross-platform compatibility

## Database Configuration

The application uses:
- **SQLite** for development environment
- **PostgreSQL** for production environment

The system automatically detects which database to use based on the `NODE_ENV` environment variable.

### Array Handling

Special care has been taken to ensure arrays (like `coralLevels`) are handled correctly in both database systems:

- In **SQLite**: Arrays are stored as JSON strings and parsed when retrieved
- In **PostgreSQL**: Native array types are used

The models include helper methods like `getCoralLevelsArray()` to ensure consistent array handling across environments.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables in `.env` file:
   ```
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your_jwt_secret
   DATABASE_URL=your_postgres_url (for production)
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reloading
- `npm run build` - Build the TypeScript code
- `npm run setup-db` - Set up the database tables
- `npm run test-db` - Test the database configuration and array handling
- `npm run migrate` - Run database migrations

## Deployment

The application is configured for deployment on Render.com. The `render.yaml` file contains the necessary configuration.

### Production Setup

For production deployment:

1. Set the `NODE_ENV` environment variable to `production`
2. Provide a valid PostgreSQL `DATABASE_URL` environment variable
3. The application will automatically use PostgreSQL in production

## API Endpoints

### Teams

- `GET /api/teams` - Get all teams
- `GET /api/teams/:teamNumber` - Get a specific team
- `POST /api/teams` - Create a new team
- `PUT /api/teams/:teamNumber` - Update a team

### Matches

- `GET /api/matches` - Get all matches
- `GET /api/matches/:matchNumber/:teamNumber` - Get a specific match
- `POST /api/matches` - Create a new match
- `PUT /api/matches/:matchNumber/:teamNumber` - Update a match

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

## License

This project is licensed under the MIT License. 