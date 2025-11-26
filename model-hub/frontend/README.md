# Model Hub Frontend

A Next.js-based frontend for the Model Hub platform, allowing users to upload, browse, and interact with AI model demonstrations.

## Features

- 🎨 Modern UI with TailwindCSS
- 🔐 User authentication (login/register)
- 📤 ZIP/RAR file upload with metadata form
- 🖼️ Model gallery with search and filtering
- 🚀 Demo launching with live status updates
- 👤 User profile management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **File Upload**: react-dropzone
- **Icons**: Lucide React
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (default: http://localhost:8000)

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd model-hub/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

4. **Update environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── gallery/           # Model gallery
│   │   ├── models/[id]/       # Model detail page
│   │   ├── profile/           # User profile
│   │   ├── upload/            # Upload new model
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/            # React components
│   │   ├── demo/
│   │   │   └── LaunchButton.tsx
│   │   ├── forms/
│   │   │   └── UploadForm.tsx
│   │   ├── gallery/
│   │   │   ├── ModelCard.tsx
│   │   │   └── SearchFilter.tsx
│   │   └── layout/
│   │       └── Navbar.tsx
│   │
│   ├── context/               # React context providers
│   │   └── AuthContext.tsx    # Authentication state
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts            # API client
│   │   ├── auth.ts           # Auth utilities
│   │   └── utils.ts          # General utilities
│   │
│   └── types/                 # TypeScript types
│       └── index.ts
│
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # TailwindCSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

## Key Components

### UploadForm
Handles ZIP/RAR file upload with metadata collection:
- Project name, description, and tags
- Author information
- GitHub URL (optional)
- Drag-and-drop file upload

### ModelCard
Displays model information in the gallery:
- Project thumbnail/preview
- Status badge
- Tags
- Quick access to demo launch

### LaunchButton
Controls demo lifecycle:
- Start/stop demo
- Real-time status polling
- Opens demo in new tab when ready

### AuthContext
Global authentication state:
- User session management
- Token storage/refresh
- Protected route handling

## API Integration

The frontend communicates with the backend API through the `api.ts` module:

```typescript
// Projects API
projectsApi.getAll(search?, tag?)  // Get all projects
projectsApi.get(id)                 // Get single project
projectsApi.create(formData)        // Upload new project
projectsApi.delete(id)              // Delete project
projectsApi.getMyProjects()         // Get user's projects

// Demo API
demoApi.launch(projectId)           // Start demo
demoApi.getStatus(projectId)        // Check demo status
demoApi.stop(projectId)             // Stop demo

// Auth API
authApi.login(credentials)          // Login
authApi.register(userData)          // Register
authApi.getProfile()                // Get current user
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |

## Deployment

### Using Docker

```bash
# Build the Docker image
docker build -t model-hub-frontend .

# Run the container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com model-hub-frontend
```

### Using Vercel

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Using AWS Amplify

1. Connect your repository
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `.next`
3. Add environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
