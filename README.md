# AI Model Bazaar 🤖☁️

A cloud-deployed web platform where AI/ML model creators can upload their trained models bundled with Streamlit demo apps, and users can browse, discover, and instantly launch interactive demos to test models in real-time. Fully deployed on AWS infrastructure with secure SSL connections and scalable cloud services.

## 🎯 Project Overview

**AI Model Bazaar** is a production-ready, cloud-hosted platform that bridges the gap between model creators and users by providing:

- **For Model Creators**: Upload your trained ML models along with a Streamlit demo app as a single ZIP file. Fill in metadata (name, description, tags) via a simple form, and your model becomes instantly accessible to the community with automatic cloud storage.

- **For Users/Testers**: Browse a gallery of AI models, filter by tags or search by name, and launch live interactive demos with a single click. No setup required - demos run in isolated environments on cloud servers with automatic port management (8501-8600).

## ✨ Features

### 🔐 User Authentication
- Secure registration and login with JWT tokens
- Role-based access (creators can upload, everyone can browse/test)

### 📤 Model Upload
- Upload ZIP files containing:
  - `app.py` - Streamlit demo application
  - `requirements.txt` - Python dependencies
  - Model files (`.pkl`, `.pt`, `.h5`, `.onnx`, etc.)
  - Supporting files (data, images, configs)
- Frontend form for metadata entry (no metadata.json needed)
- Automatic file validation and extraction

### 🖼️ Model Gallery
- Browse all uploaded models with card-based UI
- Search by model name or description
- Filter by tags (NLP, Computer Vision, Classification, etc.)
- View model details, author info, and GitHub links

### 🚀 Demo Launcher
- One-click demo launching
- Isolated Python virtual environments per demo
- Real-time status updates (launching, running, stopped)
- Automatic port management (8501-8600)
- Demo cleanup on stop

### ☁️ Cloud Storage
- AWS S3 for secure file storage with bucket policies
- Organized structure: `projects/{project_id}/files`
- Automatic cleanup on project deletion
- Secure presigned URL generation for file access

### 🌐 Cloud Infrastructure & SSL
- Deployed on AWS EC2 (t3.medium) with Docker containerization
- MongoDB Atlas for cloud database with TLS/SSL encryption
- SSL certificates managed via certifi for secure connections
- SSH key-based authentication for secure server access
- Automated deployment scripts for incremental updates
- Demo port exposure (8501-8600) for Streamlit applications

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AWS CLOUD INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         EC2 Instance (t3.medium - ap-southeast-2)          │    │
│  │                  Docker Compose Orchestration              │    │
│  │  ┌──────────────────────────────────────────────────────┐  │    │
│  │  │            Docker Containers (Networked)             │  │    │
│  │  │                                                      │  │    │
│  │  │  ┌───────────────────┐   ┌──────────────────────┐   │  │    │
│  │  │  │  FRONTEND         │   │  BACKEND             │   │  │    │
│  │  │  │  (Next.js 14)     │   │  (FastAPI)           │   │  │    │
│  │  │  │  Node 20-alpine   │   │  Python 3.11-slim    │   │  │    │
│  │  │  │  Port: 3000       │◄──┤  Port: 8000          │   │  │    │
│  │  │  │  Standalone Build │   │  Demo Ports: 8501-   │   │  │    │
│  │  │  └───────────────────┘   │  8600 (Streamlit)    │   │  │    │
│  │  │                          └──────────────────────┘   │  │    │
│  │  │                                   │                 │  │    │
│  │  │                                   ▼                 │  │    │
│  │  │                    ┌─────────────────────────────┐  │  │    │
│  │  │                    │  Demo Runner & Launcher     │  │  │    │
│  │  │                    │  - Virtual environments     │  │  │    │
│  │  │                    │  - Port management (8501+)  │  │  │    │
│  │  │                    │  - Automatic cleanup        │  │  │    │
│  │  │                    └─────────────────────────────┘  │  │    │
│  │  └──────────────────────────────────────────────────────┘  │    │
│  │                                                            │    │
│  │  SSH Access: modelhub.pem (RSA 2048)                      │    │
│  │  Security Group: Ports 22, 80, 3000, 8000, 8501-8600      │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│           ┌──────────────────┴────────────────────┐                │
│           ▼                                       ▼                │
│  ┌─────────────────────┐              ┌─────────────────────┐      │
│  │   MongoDB Atlas     │              │    Amazon S3        │      │
│  │  (External Cloud)   │              │  (Object Storage)   │      │
│  │  - TLS/SSL Enabled  │              │  - IAM Policies     │      │
│  │  - Cluster: lcexub0 │              │  - Presigned URLs   │      │
│  │  - certifi certs    │              │  - Auto-cleanup     │      │
│  └─────────────────────┘              └─────────────────────┘      │
│                                                                     │
│                         FRONTEND (Next.js)                         │
│  Landing │ Gallery │ Upload Form │ Model Details │ Auth │ Profile  │
└─────────────────────────────────────────────────────────────────────┘

SSH Connection Flow:
Local Machine → SSH (modelhub.pem) → EC2 Instance → Docker Containers

Deployment Flow:
GitHub Repo → Git Pull → Docker Build → Container Restart → Live Update
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Cloud Infrastructure** | AWS EC2 (t3.medium) | Production server hosting |
| | Amazon Linux 2023 | Operating system |
| | Docker & Docker Compose | Container orchestration |
| **Frontend** | Next.js 14 (Standalone) | React framework with SSR |
| | TypeScript | Type-safe development |
| | TailwindCSS | Utility-first styling |
| | Axios | HTTP client |
| **Backend** | FastAPI | High-performance API framework |
| | Python 3.11 | Runtime environment |
| | Uvicorn | ASGI server |
| **Database** | MongoDB Atlas | Cloud NoSQL database |
| | Motor | Async MongoDB driver |
| | TLS/SSL + certifi | Encrypted connections |
| **Storage** | AWS S3 | Object storage for model files |
| | boto3 | AWS SDK for Python |
| **Authentication** | JWT (python-jose) | Token-based auth |
| | bcrypt | Password hashing |
| **Security** | SSL/TLS | Encrypted data transfer |
| | SSH (RSA 2048) | Secure server access |
| | Environment variables | Secrets management |
| **Demo Runner** | Python venv | Isolated environments |
| | Streamlit | Interactive demos |
| | Port management | 8501-8600 range |
| **DevOps** | Git | Version control |
| | Shell scripts | Automated deployment |
| | Docker Multi-stage builds | Optimized images |

## 📁 Project Structure

```
AI-Model_Bazaar/
├── model-hub/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── config.py          # Settings & env vars
│   │   │   ├── database.py        # MongoDB connection
│   │   │   ├── main.py            # FastAPI app
│   │   │   ├── models/            # Pydantic models
│   │   │   ├── routers/           # API endpoints
│   │   │   ├── schemas/           # Request/Response schemas
│   │   │   ├── services/          # Business logic
│   │   │   └── utils/             # Helpers
│   │   ├── demo-environments/     # Isolated demo venvs
│   │   ├── requirements.txt
│   │   └── .env
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/               # Next.js pages
│   │   │   ├── components/        # React components
│   │   │   ├── context/           # Auth context
│   │   │   ├── lib/               # API client, utils
│   │   │   └── types/             # TypeScript types
│   │   ├── package.json
│   │   └── .env.local
│   │
│   ├── scripts/
│   │   ├── deploy-to-ec2.sh       # Full deployment script
│   │   ├── update-service.sh      # Incremental updates
│   │   ├── setup-credentials.sh   # Config management
│   │   └── manage-app.sh          # App management
│   │
│   ├── docker-compose.yml         # Container orchestration
│   ├── nginx/                     # Reverse proxy config
│   └── docs/
│       ├── DEPLOYMENT.md
│       ├── AWS_DEPLOYMENT.md
│       └── MANUAL_EC2_SETUP.md
│
├── .gitignore
├── SECURITY.md                    # Security guidelines
├── README.md
└── IMPLEMENTATION_PLAN.md
```

## ☁️ Cloud Deployment & Infrastructure

### 🌐 AWS Services Used

#### 1. **Amazon EC2 (Elastic Compute Cloud)**
- **Instance Type**: t3.medium (2 vCPU, 4 GB RAM)
- **Region**: ap-southeast-2 (Sydney)
- **Operating System**: Amazon Linux 2023
- **Purpose**: Hosts Docker containers for frontend, backend, and demo runners

**Configuration:**
```bash
Instance ID: i-xxxxxxxxxxxxxxxxx
Public IP: 13.62.235.142
Security Group: model-hub-sg
  - SSH (22) - Your IP only
  - HTTP (80) - 0.0.0.0/0
  - Custom TCP (3000) - 0.0.0.0/0  # Frontend
  - Custom TCP (8000) - 0.0.0.0/0  # Backend API
  - Custom TCP (8501-8600) - 0.0.0.0/0  # Streamlit demos
```

#### 2. **Amazon S3 (Simple Storage Service)**
- **Bucket**: `ai-model-bazaar-projects`
- **Region**: ap-southeast-2
- **Purpose**: Store uploaded model ZIP files and extracted contents

**Features:**
- Server-side encryption enabled
- Versioning enabled for file recovery
- Lifecycle policies for cost optimization
- IAM policies for secure access
- Presigned URLs for temporary access (24-hour expiry)

**Folder Structure:**
```
s3://ai-model-bazaar-projects/
└── projects/
    ├── {project_id_1}/
    │   └── files/
    │       ├── app.py
    │       ├── requirements.txt
    │       └── model.pkl
    └── {project_id_2}/
        └── files/
```

#### 3. **MongoDB Atlas (Database)**
- **Provider**: MongoDB Cloud (External to AWS)
- **Cluster**: lcexub0.mongodb.net
- **Tier**: Free tier (M0)
- **Connection**: TLS/SSL encrypted with certifi certificates

**Security Configuration:**
```python
# database.py - SSL/TLS Configuration
import certifi

client = AsyncIOMotorClient(
    settings.mongodb_url,
    serverSelectionTimeoutMS=5000,
    tlsCAFile=certifi.where(),  # SSL certificate bundle
    tlsAllowInvalidCertificates=True  # For development
)
```

### 🔐 SSH & Security Setup

#### SSH Key Management
```bash
# SSH Key Details
Key Name: modelhub.pem
Algorithm: RSA 2048-bit
Location: /Users/rajat.gondkar/Desktop/CloudEL/modelhub.pem
Permissions: 0400 (read-only for owner)

# Connect to EC2
ssh -i modelhub.pem ec2-user@13.62.235.142
```

#### SSL/TLS Certificates
- **Python certifi package**: Provides Mozilla's CA Bundle for SSL verification
- **MongoDB TLS**: End-to-end encryption for database connections
- **Future Enhancement**: Let's Encrypt for HTTPS on custom domain

```dockerfile
# Backend Dockerfile - SSL Certificate Setup
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    && update-ca-certificates
```

#### Environment Security
- **Secrets Management**: All credentials stored in `.env` files (gitignored)
- **Config Storage**: `~/.model-hub-config` for deployment credentials
- **GitHub Protection**: SECURITY.md guidelines for safe repository management

### 🐳 Docker Architecture

#### Multi-Container Setup
```yaml
# docker-compose.yml highlights
services:
  backend:
    ports:
      - "8000:8000"
      - "8501-8600:8501-8600"  # Demo ports exposed
    environment:
      - MONGODB_URL=${MONGODB_URL}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    volumes:
      - demo-environments:/tmp/model-hub-demos
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]

  frontend:
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
```

**Key Features:**
- Health checks for backend container
- Volume mounts for demo isolation
- Network bridge for inter-container communication
- Automatic restart policies

### 🚀 Deployment Scripts

#### 1. **Full Deployment** (`deploy-to-ec2.sh`)
Performs complete deployment from scratch:
- System updates
- Docker installation
- Git clone from repository
- Environment configuration
- Container build and launch

```bash
cd model-hub/scripts
./setup-credentials.sh  # Configure once
./deploy-to-ec2.sh      # Deploy
```

#### 2. **Incremental Updates** (`update-service.sh`) ⭐ NEW
Update specific services without full redeployment:

```bash
# Update only backend (faster for API changes)
./update-service.sh backend

# Update only frontend (faster for UI changes)
./update-service.sh frontend

# Update both services
./update-service.sh all

# Restart without rebuilding
./update-service.sh restart

# Check status
./update-service.sh status

# View logs
./update-service.sh logs
```

**How it works:**
1. Pushes local changes to GitHub
2. SSH to EC2 and pulls latest code
3. Rebuilds only specified service container
4. Restarts container with zero downtime for other services
5. Verifies health checks

**Time Savings:**
- Full deployment: ~5-7 minutes
- Backend only: ~2-3 minutes
- Frontend only: ~2-3 minutes
- Restart: ~30 seconds

### 🔄 Deployment Flow

```
┌──────────────┐
│ Local Dev    │
│ Environment  │
└──────┬───────┘
       │ 1. Code changes
       ▼
┌──────────────┐
│ Git Commit   │
│ & Push       │
└──────┬───────┘
       │ 2. Push to GitHub
       ▼
┌──────────────────────────────┐
│ Execute update-service.sh    │
│ (backend/frontend/all)       │
└──────┬───────────────────────┘
       │ 3. SSH Connection
       ▼
┌──────────────────────────────┐
│ EC2 Instance                 │
│ - Git pull latest            │
│ - Docker build --no-cache    │
│ - Docker compose up -d       │
└──────┬───────────────────────┘
       │ 4. Container restart
       ▼
┌──────────────────────────────┐
│ Live Application             │
│ http://13.62.235.142:3000   │
└──────────────────────────────┘
```

### 📊 Cloud Resource Costs (Estimates)

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| EC2 t3.medium (730 hrs) | On-Demand | ~$30 USD |
| S3 Storage (50 GB) | Standard | ~$1.15 USD |
| S3 Requests (10K) | Standard | ~$0.05 USD |
| MongoDB Atlas | Free M0 | $0 USD |
| Data Transfer (10 GB) | Out to Internet | ~$0.90 USD |
| **Total** | | **~$32 USD/month** |

*Note: Free tier eligible for first 12 months with AWS*

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas account (free tier works)
- AWS account with S3 and EC2 access (free tier eligible)
- SSH key pair for EC2 access
- Docker & Docker Compose (for local development)

### Option 1: Cloud Deployment (Production) 🌐

#### Quick Deploy to AWS EC2

1. **Clone the repository:**
```bash
git clone https://github.com/rajat-gondkar/AI-Model_Bazaar.git
cd AI-Model_Bazaar/model-hub/scripts
```

2. **Configure credentials (one-time):**
```bash
chmod +x setup-credentials.sh
./setup-credentials.sh
```
You'll be prompted for:
- EC2 IP address
- SSH key path
- MongoDB connection URL
- AWS credentials (Access Key, Secret Key, Region, S3 Bucket)
- JWT secret key

3. **Deploy to EC2:**
```bash
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh
```

4. **Access your application:**
- Frontend: `http://YOUR_EC2_IP:3000`
- Backend API: `http://YOUR_EC2_IP:8000`
- API Docs: `http://YOUR_EC2_IP:8000/docs`

#### Incremental Updates (Fast Deployment)

After initial setup, use the update script for quick changes:

```bash
# Update backend only (API changes)
./update-service.sh backend

# Update frontend only (UI changes)
./update-service.sh frontend

# Update everything
./update-service.sh all

# Check deployment status
./update-service.sh status
```

### Option 2: Local Development

### Option 2: Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/rajat-gondkar/AI-Model_Bazaar.git
cd AI-Model_Bazaar
```

##### 2. Backend Setup

```bash
cd model-hub/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see Configuration section)

# Run the backend
uvicorn app.main:app --reload --port 8000
```

##### 3. Frontend Setup

```bash
cd model-hub/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run the frontend
npm run dev
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Option 3: Docker Compose (Recommended for Local)

```bash
cd model-hub

# Create .env file with your credentials
cp backend/.env.example .env

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# MongoDB Configuration (with SSL/TLS)
MONGODB_URL=mongodb+srv://username.mongodb.net/?retryWrites=true&w=majority&tls=true
DATABASE_NAME=model_hub

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-min-32-chars-recommended-64-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=ai-model-bazaar-projects

# Demo Configuration
DEMO_BASE_URL=http://13.62.235.142  # Your EC2 IP or localhost
DEMO_ENVIRONMENTS_PATH=/tmp/model-hub-demos
DEMO_PORT_START=8501
DEMO_PORT_END=8600
MAX_UPLOAD_SIZE_MB=500

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://13.62.235.142:3000

# Server Configuration
DEBUG=False
```

### Frontend Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://13.62.235.142:8000  # Your EC2 IP:8000 or http://localhost:8000
```

### Cloud Credentials Storage (`~/.model-hub-config`)

Created by `setup-credentials.sh` for deployment automation:

```bash
# EC2 Configuration
EC2_IP=13.62.235.142
SSH_KEY_PATH=/path/to/modelhub.pem
SSH_USER=ec2-user

# Repository Configuration
REPO_URL=https://github.com/rajat-gondkar/AI-Model_Bazaar.git
BRANCH=main

# All other environment variables from above
# (Stored securely, never committed to git)
```

## 📦 Upload Bundle Format

To upload a model, create a ZIP file with this structure:

```
my-model.zip
├── app.py              # Streamlit demo (required)
├── requirements.txt    # Dependencies (required)
├── model.pkl          # Your trained model
└── data/              # Optional supporting files
    └── sample.csv
```

### Example `app.py`:

```python
import streamlit as st
import pickle

st.title("My Image Classifier")

# Load model
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

# Create interface
uploaded_file = st.file_uploader("Upload an image", type=["jpg", "png"])

if uploaded_file:
    # Process and predict
    prediction = model.predict(...)
    st.write(f"Prediction: {prediction}")
```

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Projects (Models)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/projects/upload` | Upload new model ZIP | Yes |
| GET | `/api/projects` | List all projects (with pagination) | No |
| GET | `/api/projects/{id}` | Get project details | No |
| PUT | `/api/projects/{id}` | Update project metadata | Yes (Owner) |
| DELETE | `/api/projects/{id}` | Delete project & S3 files | Yes (Owner) |
| GET | `/api/projects/user/me` | Get current user's projects | Yes |

### Demo Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/demo/{id}/launch` | Launch Streamlit demo | Yes |
| GET | `/api/demo/{id}/status` | Check demo status & port | Yes |
| POST | `/api/demo/{id}/stop` | Stop running demo | Yes |
| POST | `/api/demo/stop-all` | Stop all demos (admin) | Yes |

### Health & Monitoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check & DB status |
| GET | `/` | API welcome message |

## 🆕 Recent Updates & Changes

### v2.0.0 - Cloud Infrastructure Enhancement (January 2026)

#### 🔧 Backend Improvements
- **SSL/TLS Security**: Added certifi package for MongoDB Atlas SSL certificate verification
- **Docker Optimization**: Multi-stage builds with ca-certificates and openssl for secure connections
- **Demo Port Management**: Exposed ports 8501-8600 in docker-compose for Streamlit demos
- **Health Checks**: Implemented container health monitoring with automatic restart

#### 🎨 Frontend Enhancements
- **Standalone Build**: Optimized Next.js output for smaller Docker images
- **Public Directory Handling**: Fixed COPY commands in Dockerfile for proper static file serving
- **API Integration**: Updated all endpoints to use environment-based API URLs

#### ☁️ Cloud & DevOps
- **Incremental Deployment Script**: New `update-service.sh` for fast, service-specific updates
  - Update backend only: ~2-3 minutes (vs 5-7 minutes full deploy)
  - Update frontend only: ~2-3 minutes
  - Status checking and log viewing capabilities
- **SSH Key Management**: Automated SSH key configuration with proper permissions
- **Environment Configuration**: Centralized credential storage in `~/.model-hub-config`
- **Security Enhancements**:
  - Added SECURITY.md with best practices
  - Enhanced .gitignore to prevent credential leaks
  - Implemented proper file exclusion patterns

#### 🐛 Bug Fixes
- Fixed MongoDB SSL connection errors (TLSV1_ALERT_INTERNAL_ERROR)
- Resolved frontend build issues with missing lib/ directory
- Corrected requirements.txt invalid character (₹ → #)
- Fixed Docker volume mounting for demo environments

#### 📚 Documentation
- Comprehensive cloud deployment section in README
- Detailed AWS services documentation
- SSH and SSL setup guides
- Cost estimation table for AWS resources

### v1.0.0 - Initial Release
- Full-stack application with Next.js + FastAPI
- MongoDB Atlas integration
- AWS S3 file storage
- Streamlit demo launcher
- User authentication with JWT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Please read [SECURITY.md](SECURITY.md) before contributing to ensure no sensitive data is committed.**

## 📈 Performance & Scalability

### Current Capacity
- **Concurrent Demos**: Up to 100 (ports 8501-8600)
- **Upload Size**: 500 MB per model
- **Storage**: Unlimited (S3)
- **Users**: Scales with MongoDB Atlas tier

### Optimization Features
- Docker container resource limits
- Automatic demo cleanup
- S3 lifecycle policies for cost management
- Connection pooling for database
- Next.js standalone output (smaller images)

## 🔒 Security Features

- JWT token-based authentication
- bcrypt password hashing (cost factor: 12)
- CORS protection
- Environment variable for secrets
- SSH key authentication for deployment
- SSL/TLS for all database connections
- IAM policies for S3 access
- Security group rules on EC2


## 🙏 Acknowledgments

- **FastAPI** - High-performance Python web framework
- **Next.js** - React framework for production
- **MongoDB Atlas** - Cloud database platform
- **AWS** - Cloud infrastructure services
- **Streamlit** - Interactive demo framework
- **Docker** - Containerization platform

---



📚 **Full Documentation**: [/model-hub/docs](/model-hub/docs)
