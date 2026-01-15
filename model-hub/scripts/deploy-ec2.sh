#!/bin/bash
# EC2 Deployment Script for AI Model Bazaar
# Run this on the EC2 instance after infrastructure is created

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_DIR="/opt/model-hub"
REPO_URL="${REPO_URL:-https://github.com/rajat-gondkar/AI-Model_Bazaar.git}"
BRANCH="${BRANCH:-main}"

log_info "Starting AI Model Bazaar deployment..."

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root or with sudo"
    exit 1
fi

# Update system packages
log_info "Updating system packages..."
yum update -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -a -G docker ec2-user
else
    log_info "Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    log_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    log_info "Docker Compose already installed"
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    log_info "Installing Git..."
    yum install -y git
else
    log_info "Git already installed"
fi

# Create app directory
log_info "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    log_info "Updating existing repository..."
    git fetch origin
    git reset --hard origin/$BRANCH
else
    log_info "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi

# Navigate to model-hub directory
cd model-hub

# Check for .env file
if [ ! -f ".env" ]; then
    log_warn ".env file not found. Creating template..."
    cat > .env << 'EOF'
# MongoDB Configuration
MONGODB_URL=your-mongodb-url
DATABASE_NAME=model_hub

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-2
S3_BUCKET_NAME=ai-model-bazaar-projects

# Demo Configuration
DEMO_BASE_URL=http://your-server-ip
DEMO_PORT_START=8501
DEMO_PORT_END=8600
MAX_UPLOAD_SIZE_MB=500

# CORS Configuration (update with your domain/IP)
CORS_ORIGINS=http://your-server-ip:3000,http://your-domain.com

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://your-server-ip:8000

# Debug
DEBUG=False
EOF
    log_error "Please edit $APP_DIR/model-hub/.env with your configuration, then run this script again"
    exit 1
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Remove old images (optional, saves space)
log_info "Cleaning up old Docker images..."
docker image prune -f

# Build and start containers
log_info "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Check service status
log_info "Checking service status..."
docker-compose ps

# Check backend health
BACKEND_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null || echo "failed")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    log_info "Backend is healthy!"
else
    log_warn "Backend health check failed. Check logs with: docker-compose logs backend"
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    log_info "Frontend is accessible!"
else
    log_warn "Frontend may still be starting. Check logs with: docker-compose logs frontend"
fi

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")

log_info "========================================"
log_info "Deployment complete!"
log_info "========================================"
log_info "Frontend: http://$PUBLIC_IP:3000"
log_info "Backend:  http://$PUBLIC_IP:8000"
log_info "API Docs: http://$PUBLIC_IP:8000/docs"
log_info "========================================"
log_info "Useful commands:"
log_info "  View logs:     docker-compose logs -f"
log_info "  Restart:       docker-compose restart"
log_info "  Stop:          docker-compose down"
log_info "  Status:        docker-compose ps"
log_info "========================================"
