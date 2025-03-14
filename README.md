# PitScouting Backend

Backend for the Team 1334 Scouting App.

## TypeScript Error Fixes

The following TypeScript errors have been fixed:

1. **Syntax Error in `team.model.ts`**:
   - Fixed syntax errors in the team model file.
   - Properly defined the TeamAttributes interface and TeamModel.
   - Added proper getter and setter methods for coralLevels to handle different formats.

2. **Type Errors in `team.controller.ts`**:
   - Changed return type from `Promise<void>` to `Promise<any>` for controller functions.
   - Added proper return statements for all response objects.
   - Added type annotations for map function parameters.
   - Used type assertion (`as any`) for the team object to avoid TypeScript errors.

## Deployment Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/PitScouting-backend.git
   cd PitScouting-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=10000
NODE_ENV=production
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Database Setup

The application supports both SQLite and PostgreSQL databases.

- For SQLite (default for development):
  ```bash
  npm run setup-db-dev
  ```

- For PostgreSQL (recommended for production):
  ```bash
  npm run migrate
  ```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/:teamNumber` - Get team by number
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create a new match
- `GET /uploads/:filename` - Get uploaded images

## Troubleshooting

If you encounter any issues with the frontend, please refer to the `FRONTEND-FIX.md` file for detailed instructions on how to fix common frontend issues.

## License

MIT 