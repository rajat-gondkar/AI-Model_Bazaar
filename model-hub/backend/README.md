# Model Hub Backend

FastAPI backend for the Model Hub + Demo Launcher platform.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens (generate a secure random string)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: S3 bucket for storing project files

### 4. Run the Server

Development:
```bash
uvicorn app.main:app --reload --port 8000
```

Production:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app entry point
│   ├── config.py        # Environment configuration
│   ├── database.py      # MongoDB connection
│   ├── models/          # MongoDB document models
│   ├── schemas/         # Pydantic request/response schemas
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Projects
- `POST /api/projects/upload` - Upload new project (ZIP file + metadata)
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `DELETE /api/projects/{id}` - Delete project

### Demo
- `POST /api/demo/{id}/launch` - Launch demo
- `GET /api/demo/{id}/status` - Get demo status
- `POST /api/demo/{id}/stop` - Stop demo
