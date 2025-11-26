# Model Hub + Demo Launcher - Implementation Plan

## 📋 Project Overview

A web platform where AI model creators upload their projects (as ZIP files) and users can browse and launch interactive Streamlit demos.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Landing   │  │   Gallery   │  │   Upload    │  │   Model     │ │
│  │    Page     │  │    Page     │  │    Page     │  │  Details    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                              │                                       │
│                    REST API Calls (Axios)                           │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Auth     │  │  Projects   │  │    Demo     │  │   Health    │ │
│  │   Router    │  │   Router    │  │   Router    │  │   Router    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                              │                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ S3 Service  │  │  Archive    │  │   Demo      │                  │
│  │             │  │  Service    │  │  Launcher   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└───────────┬─────────────────┬─────────────────┬─────────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
      ┌──────────┐     ┌──────────┐      ┌──────────────┐
      │  AWS S3  │     │ MongoDB  │      │  EC2 (GPU)   │
      │  Bucket  │     │  Atlas   │      │  Streamlit   │
      └──────────┘     └──────────┘      └──────────────┘
```

---

## 📁 Final Project Structure

```
model-hub/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── config.py                  # Environment configuration
│   │   ├── database.py                # MongoDB connection (Motor)
│   │   │
│   │   ├── models/                    # MongoDB document models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # User document model
│   │   │   └── project.py             # Project document model
│   │   │
│   │   ├── schemas/                   # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # User schemas (register, login, response)
│   │   │   └── project.py             # Project schemas (create, response, list)
│   │   │
│   │   ├── routers/                   # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # /api/auth/* routes
│   │   │   ├── projects.py            # /api/projects/* routes
│   │   │   └── demo.py                # /api/demo/* routes
│   │   │
│   │   ├── services/                  # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        # JWT, password hashing
│   │   │   ├── s3_service.py          # AWS S3 operations
│   │   │   ├── archive_service.py     # ZIP/RAR extraction & validation
│   │   │   └── demo_launcher.py       # venv creation & Streamlit launching
│   │   │
│   │   └── utils/                     # Utility functions
│   │       ├── __init__.py
│   │       ├── validators.py          # File validation helpers
│   │       └── dependencies.py        # FastAPI dependencies (auth, etc.)
│   │
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Environment variables template
│   └── README.md                      # Backend setup instructions
│
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js 13+ App Router
│   │   │   ├── layout.tsx             # Root layout with providers
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── globals.css            # Global styles
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx       # Login page
│   │   │   │   └── register/
│   │   │   │       └── page.tsx       # Registration page
│   │   │   │
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx           # Model gallery with search/filter
│   │   │   │
│   │   │   ├── upload/
│   │   │   │   └── page.tsx           # Upload form + ZIP uploader
│   │   │   │
│   │   │   └── models/
│   │   │       └── [id]/
│   │   │           └── page.tsx       # Model details + Launch button
│   │   │
│   │   ├── components/                # Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # Navigation bar
│   │   │   │   └── Footer.tsx         # Footer
│   │   │   │
│   │   │   ├── ui/                    # Base UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Spinner.tsx
│   │   │   │
│   │   │   ├── forms/
│   │   │   │   ├── UploadForm.tsx     # Metadata form + file upload
│   │   │   │   ├── LoginForm.tsx      # Login form
│   │   │   │   └── RegisterForm.tsx   # Registration form
│   │   │   │
│   │   │   ├── gallery/
│   │   │   │   ├── ModelCard.tsx      # Single model card
│   │   │   │   ├── ModelGrid.tsx      # Grid of model cards
│   │   │   │   └── SearchFilter.tsx   # Search and filter bar
│   │   │   │
│   │   │   └── demo/
│   │   │       └── LaunchButton.tsx   # Launch demo button with status
│   │   │
│   │   ├── lib/                       # Utilities and helpers
│   │   │   ├── api.ts                 # Axios API client
│   │   │   ├── auth.ts                # Auth helpers (token storage)
│   │   │   └── utils.ts               # General utilities
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts             # Authentication hook
│   │   │   └── useProjects.ts         # Projects data hook
│   │   │
│   │   ├── context/                   # React context providers
│   │   │   └── AuthContext.tsx        # Auth state provider
│   │   │
│   │   └── types/                     # TypeScript types
│   │       └── index.ts               # All type definitions
│   │
│   ├── public/                        # Static assets
│   │   └── images/
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── .env.example
│   └── README.md
│
├── demo-environments/                 # Runtime: venvs created here
│   └── .gitkeep
│
├── docs/
│   ├── API.md                         # API documentation
│   ├── DEPLOYMENT.md                  # AWS deployment guide
│   └── BUNDLE_FORMAT.md               # How to create ZIP bundle
│
├── .gitignore
└── README.md                          # Project overview
```

---

## 🔧 Backend Implementation Details

### 1. Configuration (`app/config.py`)
```python
# Environment variables needed:
- MONGODB_URL          # MongoDB connection string
- DATABASE_NAME        # MongoDB database name
- JWT_SECRET_KEY       # Secret for JWT tokens
- JWT_ALGORITHM        # Algorithm (HS256)
- ACCESS_TOKEN_EXPIRE  # Token expiry in minutes
- AWS_ACCESS_KEY_ID    # AWS credentials
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- S3_BUCKET_NAME       # S3 bucket for project files
- DEMO_BASE_URL        # Base URL for demo instances
- DEMO_ENVIRONMENTS_PATH  # Local path for venvs
```

### 2. MongoDB Document Models

**User Document:**
```python
{
    "_id": ObjectId,
    "email": str,
    "username": str,
    "hashed_password": str,
    "is_active": bool,
    "is_creator": bool,
    "created_at": datetime,
    "updated_at": datetime
}
```

**Project Document:**
```python
{
    "_id": ObjectId,
    "name": str,
    "description": str,
    "tags": List[str],
    "author_name": str,
    "github_url": Optional[str],
    "created_by": ObjectId,          # Reference to User
    "s3_path": str,                  # projects/{project_id}/
    "files": {
        "app_file": str,             # Main Streamlit file name
        "model_files": List[str],
        "requirements_file": str,
        "other_files": List[str]
    },
    "status": str,                   # "pending", "ready", "running", "error"
    "demo_url": Optional[str],
    "demo_port": Optional[int],
    "demo_pid": Optional[int],
    "created_at": datetime,
    "updated_at": datetime
}
```

### 3. API Endpoints

#### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new creator | No |
| POST | `/login` | Login, get JWT token | No |
| GET | `/me` | Get current user info | Yes |
| POST | `/logout` | Invalidate token | Yes |

#### Project Routes (`/api/projects`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload ZIP + metadata | Yes (Creator) |
| GET | `/` | List all projects | No |
| GET | `/{id}` | Get project details | No |
| DELETE | `/{id}` | Delete project | Yes (Owner) |
| GET | `/my-projects` | List user's projects | Yes |

#### Demo Routes (`/api/demo`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/{project_id}/launch` | Launch demo | No |
| GET | `/{project_id}/status` | Check demo status | No |
| POST | `/{project_id}/stop` | Stop running demo | Yes (Owner) |

### 4. Services Implementation

#### S3 Service (`s3_service.py`)
- `upload_file(file, s3_key)` - Upload single file
- `upload_directory(local_path, s3_prefix)` - Upload extracted files
- `download_project(project_id, local_path)` - Download for demo launch
- `delete_project(project_id)` - Delete all project files
- `generate_presigned_url(s3_key)` - For direct downloads

#### Archive Service (`archive_service.py`)
- `extract_archive(file, dest_path)` - Extract ZIP/RAR
- `validate_bundle(extracted_path)` - Check required files exist
- `get_file_list(extracted_path)` - List all files in bundle
- `find_streamlit_entry(extracted_path)` - Find main app.py

#### Demo Launcher (`demo_launcher.py`)
- `create_venv(project_id)` - Create isolated virtual environment
- `install_requirements(project_id, requirements_path)` - pip install
- `start_streamlit(project_id, app_path, port)` - Launch Streamlit
- `stop_streamlit(project_id)` - Kill running process
- `get_available_port()` - Find free port (8501-8600 range)
- `cleanup_venv(project_id)` - Remove venv after stop

---

## 🎨 Frontend Implementation Details

### 1. Pages

#### Landing Page (`/`)
- Hero section with tagline
- Featured models carousel
- "Browse Gallery" and "Upload Model" CTAs
- How it works section

#### Gallery Page (`/gallery`)
- Search bar (search by name, description)
- Filter sidebar (tags, author)
- Model cards grid (paginated)
- Sort options (newest, popular)

#### Upload Page (`/upload`) - Protected
- Metadata form:
  - Project Name (required)
  - Description (required, textarea)
  - Tags (multi-select or comma-separated)
  - Author Name (required)
  - GitHub URL (optional)
- ZIP file uploader with drag-drop
- File validation feedback
- Upload progress bar
- Success/error messages

#### Model Details Page (`/models/[id]`)
- Project name, description, author
- Tags as badges
- GitHub link (if provided)
- File list preview
- **Launch Demo** button
- Demo status indicator
- Embedded iframe (when demo is running)

#### Auth Pages
- `/auth/login` - Email/password login
- `/auth/register` - Registration form

### 2. Components

#### Navbar
- Logo
- Links: Gallery, Upload (if logged in)
- Auth buttons: Login/Register or User menu

#### ModelCard
- Thumbnail (placeholder or auto-generated)
- Title, short description
- Tags (max 3 shown)
- Author name
- "View Details" button

#### UploadForm
- Form fields for metadata
- Drag-drop zone for ZIP file
- File type validation (ZIP/RAR only)
- Size limit check (max 500MB)
- Submit button with loading state

#### LaunchButton
- States: Ready, Launching, Running, Error
- Click to launch
- Shows demo URL when running
- Optional: Stop button for owners

### 3. API Client (`lib/api.ts`)
```typescript
// Axios instance with:
- Base URL configuration
- JWT token interceptor
- Error handling interceptor
- Request/response typing

// Methods:
- auth.register(data)
- auth.login(data)
- auth.me()
- projects.list(filters)
- projects.get(id)
- projects.upload(formData)
- projects.delete(id)
- demo.launch(projectId)
- demo.status(projectId)
- demo.stop(projectId)
```

---

## 📦 ZIP Bundle Requirements

Users must upload a ZIP file containing:

```
project-name.zip
├── app.py              # REQUIRED - Main Streamlit entry point
├── requirements.txt    # REQUIRED - Python dependencies
├── model.pkl           # Model file(s) - any format
├── model.pt            # (can have multiple)
├── utils/              # Optional helper modules
│   └── helpers.py
└── assets/             # Optional static files
    └── image.png
```

### Validation Rules:
1. Must contain `app.py` or `main.py` (Streamlit entry)
2. Must contain `requirements.txt`
3. Max file size: 500MB
4. Allowed extensions: .py, .pkl, .pt, .h5, .onnx, .txt, .json, .csv, .png, .jpg, .jpeg, .gif
5. No executable files (.exe, .sh, .bat)

---

## 🔐 Security Measures

### Authentication
- JWT tokens with expiration (24 hours)
- Password hashing with bcrypt
- Token stored in httpOnly cookie or localStorage

### File Upload Security
- File type validation (magic bytes + extension)
- File size limits
- Filename sanitization
- No path traversal allowed
- Scan for suspicious patterns

### Demo Isolation
- Separate venv per project
- Resource limits (memory, CPU time)
- Network isolation (future)
- Process monitoring and auto-kill

### API Security
- Rate limiting
- CORS configuration
- Input validation with Pydantic
- SQL/NoSQL injection prevention

---

## 🚀 AWS Deployment Architecture

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │   (CDN + SSL)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │  S3 (Frontend)  │          │  ALB (Backend)  │
    │  Static Hosting │          │  Load Balancer  │
    └─────────────────┘          └────────┬────────┘
                                          │
                                          ▼
                               ┌─────────────────┐
                               │   EC2 (GPU)     │
                               │  - FastAPI      │
                               │  - Streamlit    │
                               │    Demos        │
                               └────────┬────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │   MongoDB       │ │    S3 Bucket    │ │   CloudWatch    │
          │   Atlas         │ │  (Project Files)│ │   (Logs)        │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### AWS Services Used:
- **S3**: Frontend hosting + Project file storage
- **CloudFront**: CDN, SSL termination
- **EC2 (GPU)**: Backend API + Streamlit demos
- **ALB**: Load balancing, health checks
- **MongoDB Atlas**: Database (managed MongoDB)
- **CloudWatch**: Logging and monitoring
- **IAM**: Access control
- **Route 53**: DNS (optional)

---

## 📝 Implementation Order

### Phase 1: Backend Core (Day 1-2)
- [ ] Project setup, requirements.txt
- [ ] Config and environment handling
- [ ] MongoDB connection with Motor
- [ ] User model and auth service
- [ ] Auth routes (register, login, me)
- [ ] JWT middleware

### Phase 2: Project Management (Day 2-3)
- [ ] Project model
- [ ] S3 service
- [ ] Archive service (extract, validate)
- [ ] Project upload route
- [ ] Project list/get routes
- [ ] File validation utilities

### Phase 3: Demo Launcher (Day 3-4)
- [ ] Demo launcher service
- [ ] Venv management
- [ ] Streamlit process management
- [ ] Demo routes (launch, status, stop)
- [ ] Port management

### Phase 4: Frontend Setup (Day 4-5)
- [ ] Next.js project init
- [ ] Tailwind configuration
- [ ] Layout and Navbar
- [ ] API client setup
- [ ] Auth context

### Phase 5: Frontend Pages (Day 5-7)
- [ ] Landing page
- [ ] Auth pages (login, register)
- [ ] Gallery page with search/filter
- [ ] Upload page with form
- [ ] Model details page
- [ ] Launch demo integration

### Phase 6: Testing & Polish (Day 7-8)
- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] Loading states
- [ ] Responsive design
- [ ] Documentation

### Phase 7: Deployment (Day 8-9)
- [ ] AWS setup documentation
- [ ] Environment configuration
- [ ] Deployment scripts
- [ ] Monitoring setup

---

## 🧪 Testing Strategy

### Backend Tests
- Unit tests for services
- Integration tests for API routes
- File upload tests
- Auth flow tests

### Frontend Tests
- Component unit tests
- Page integration tests
- Form validation tests
- API mocking

### E2E Tests
- Complete upload flow
- Gallery browsing
- Demo launching

---

## 📊 API Request/Response Examples

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "creator@example.com",
    "username": "johndoe",
    "password": "securepassword123"
}

Response 201:
{
    "id": "507f1f77bcf86cd799439011",
    "email": "creator@example.com",
    "username": "johndoe",
    "is_creator": true,
    "created_at": "2025-11-26T10:00:00Z"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "creator@example.com",
    "password": "securepassword123"
}

Response 200:
{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
        "id": "507f1f77bcf86cd799439011",
        "email": "creator@example.com",
        "username": "johndoe"
    }
}
```

### Upload Project
```http
POST /api/projects/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data

name: Image Classifier
description: A CNN model for classifying images into 10 categories
tags: computer-vision,classification,cnn
author_name: John Doe
github_url: https://github.com/johndoe/image-classifier
file: [project.zip]

Response 201:
{
    "id": "507f1f77bcf86cd799439012",
    "name": "Image Classifier",
    "description": "A CNN model for classifying images into 10 categories",
    "tags": ["computer-vision", "classification", "cnn"],
    "author_name": "John Doe",
    "github_url": "https://github.com/johndoe/image-classifier",
    "status": "ready",
    "created_at": "2025-11-26T10:30:00Z",
    "files": {
        "app_file": "app.py",
        "model_files": ["model.pkl"],
        "requirements_file": "requirements.txt"
    }
}
```

### List Projects
```http
GET /api/projects?tags=computer-vision&search=classifier&page=1&limit=10

Response 200:
{
    "projects": [
        {
            "id": "507f1f77bcf86cd799439012",
            "name": "Image Classifier",
            "description": "A CNN model for...",
            "tags": ["computer-vision", "classification"],
            "author_name": "John Doe",
            "status": "ready",
            "created_at": "2025-11-26T10:30:00Z"
        }
    ],
    "total": 1,
    "page": 1,
    "pages": 1
}
```

### Launch Demo
```http
POST /api/demo/507f1f77bcf86cd799439012/launch

Response 200:
{
    "status": "launching",
    "message": "Demo is being prepared...",
    "estimated_time": 30
}

// After polling /api/demo/{id}/status:
{
    "status": "running",
    "demo_url": "http://ec2-xx-xx-xx-xx.compute.amazonaws.com:8501",
    "started_at": "2025-11-26T10:35:00Z"
}
```

---

## ⚠️ Known Limitations (Prototype)

1. **Single EC2 Instance**: All demos run on one server (scaling needed for production)
2. **No GPU Sharing**: One demo at a time uses GPU (queue system needed)
3. **No Persistent Sessions**: Demos timeout after inactivity
4. **Limited Monitoring**: Basic process management only
5. **No Billing**: Free for all users (add Stripe for production)

---

## 🔮 Future Enhancements

1. **Kubernetes Deployment**: Scale demos with K8s
2. **GPU Scheduling**: Queue system for GPU access
3. **User Reviews/Ratings**: Community feedback
4. **Version Control**: Multiple versions per project
5. **Analytics**: Usage tracking, popular models
6. **API Access**: Programmatic model inference
7. **Collaboration**: Team projects
8. **Monetization**: Paid tiers, creator earnings

---

*Document created: November 26, 2025*
*Last updated: November 26, 2025*
