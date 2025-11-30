# AI Model Bazaar 🤖

A web platform where AI/ML model creators can upload their trained models bundled with Streamlit demo apps, and users can browse, discover, and instantly launch interactive demos to test models in real-time.

## 🎯 Project Overview

**AI Model Bazaar** bridges the gap between model creators and users by providing:

- **For Model Creators**: Upload your trained ML models along with a Streamlit demo app as a single ZIP file. Fill in metadata (name, description, tags) via a simple form, and your model becomes instantly accessible to the community.

- **For Users/Testers**: Browse a gallery of AI models, filter by tags or search by name, and launch live interactive demos with a single click. No setup required - demos run in isolated environments on the server.

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
- AWS S3 for secure file storage
- Organized structure: `projects/{project_id}/files`
- Automatic cleanup on project deletion

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│  Landing Page │ Gallery │ Upload Form │ Model Details │ Auth Pages  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ REST API (Axios)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                           │
│  Auth Router │ Projects Router │ Demo Router │ Health Router        │
│                                                                     │
│  Services: S3 Service │ Archive Service │ Demo Launcher             │
└───────────┬─────────────────────┬─────────────────────┬─────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
      ┌──────────┐         ┌──────────┐          ┌──────────────┐
      │  AWS S3  │         │ MongoDB  │          │ Demo Runner  │
      │  Bucket  │         │  Atlas   │          │ (Streamlit)  │
      └──────────┘         └──────────┘          └──────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, TailwindCSS |
| Backend | FastAPI, Python 3.9+ |
| Database | MongoDB (Atlas) |
| Storage | AWS S3 |
| Auth | JWT (python-jose), bcrypt |
| Demo Runner | Python venv, Streamlit |

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
│   └── docs/
│       └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── IMPLEMENTATION_PLAN.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (free tier works)
- AWS account with S3 access (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/rajat-gondkar/AI-Model_Bazaar.git
cd AI-Model_Bazaar
```

### 2. Backend Setup

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

### 3. Frontend Setup

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

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ⚙️ Configuration

### Backend Environment Variables (`.env`)

```env
# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=model_hub

# JWT
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Demo Configuration
DEMO_BASE_URL=http://localhost
DEMO_PORT_START=8501
DEMO_PORT_END=8600

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/projects/upload` | Upload new model |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Get project details |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/demo/{id}/launch` | Launch demo |
| GET | `/api/demo/{id}/status` | Check demo status |
| POST | `/api/demo/{id}/stop` | Stop demo |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rajat Gondkar**
- GitHub: [@rajat-gondkar](https://github.com/rajat-gondkar)

---

⭐ Star this repo if you find it helpful!
