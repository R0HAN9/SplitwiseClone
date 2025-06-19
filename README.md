# Splitwise Clone

A simple full-stack web application for splitting expenses among friends, built with FastAPI, React, and PostgreSQL.

## Features

- **Group Management**: Create groups and add members
- **Expense Tracking**: Add expenses with equal or percentage-based splits
- **Balance Calculation**: See who owes whom and suggested settlements
- **Clean UI**: Modern interface built with React and TailwindCSS

## Tech Stack

- **Backend**: Python (FastAPI) + PostgreSQL + SQLAlchemy ORM
- **Frontend**: React + TailwindCSS
- **DevOps**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for running frontend outside Docker)

### Option 1: Full Docker Setup

1. Clone the repository
2. Run the application:
   ```bash
   docker-compose up --build
   ```
3. Access the API at http://localhost:8000
4. API documentation available at http://localhost:8000/docs

### Option 2: Backend in Docker, Frontend Local (Recommended for Development)

1. Start the backend and database:

   ```bash
   docker-compose up db backend
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Start the frontend development server:

   ```bash
   npm start
   ```

4. Access the application at http://localhost:3000

## Project Structure

```
splitwise-clone/
├── backend/
│   ├── main.py              # FastAPI app with all routes
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # Database connection setup
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Backend Docker configuration
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React application
│   │   ├── index.js         # React entry point
│   │   └── index.css        # TailwindCSS styles
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── package.json         # Node.js dependencies
│   ├── tailwind.config.js   # TailwindCSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   └── Dockerfile          # Frontend Docker configuration
├── docker-compose.yml       # Docker services configuration
└── README.md               # This file
```

## API Endpoints

### Groups

- `POST /groups` - Create a new group
- `GET /groups` - List all groups
- `GET /groups/{group_id}` - Get group details

### Expenses

- `POST /groups/{group_id}/expenses` - Add expense to group

### Balances

- `GET /groups/{group_id}/balances` - Get group balances and settlements
- `GET /users/{user_name}/balances` - Get user's overall balance

## Usage Guide

### Creating a Group

1. Click "Create Group" in the navigation
2. Enter a group name
3. Add at least 2 members
4. Click "Create Group"

### Adding Expenses

1. Select a group from the groups list
2. Go to the "Expenses" tab
3. Click "Add Expense"
4. Fill in the expense details:
   - Description (e.g., "Dinner at restaurant")
   - Amount (e.g., 120.00)
   - Who paid
   - Split type:
     - **Equal**: Amount split evenly among all members
     - **Percentage**: Custom percentage for each member

### Viewing Balances

1. Select a group
2. Go to the "Balances" tab
3. View individual balances and suggested settlements

## Database Schema

The application uses four main tables:

- **Users**: Store user information
- **Groups**: Store group details
- **Expenses**: Store expense records
- **Splits**: Store how each expense is split among users

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Database Migrations

The application automatically creates tables on startup. For production, consider using Alembic for proper database migrations.

## Environment Variables

### Backend

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://user:password@db:5432/splitwise`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
