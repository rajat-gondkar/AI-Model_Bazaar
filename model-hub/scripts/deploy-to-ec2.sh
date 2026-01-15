#!/bin/bash
# Deploy AI Model Bazaar to EC2 using saved credentials
# Run setup-credentials.sh first to configure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

CONFIG_FILE="$HOME/.model-hub-config"

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Configuration file not found!"
    echo ""
    echo "Please run setup-credentials.sh first to configure your deployment."
    echo ""
    echo "  ./setup-credentials.sh"
    echo ""
    exit 1
fi

# Load configuration
log_info "Loading configuration from $CONFIG_FILE"
source "$CONFIG_FILE"

# Validate required variables
REQUIRED_VARS=(
    "EC2_IP" "SSH_KEY_PATH" "SSH_USER" 
    "MONGODB_URL" "JWT_SECRET_KEY" 
    "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" 
    "AWS_REGION" "S3_BUCKET_NAME" 
    "REPO_URL" "BRANCH"
)

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        log_error "Missing required variable: $VAR"
        log_error "Please run setup-credentials.sh to reconfigure"
        exit 1
    fi
done

clear
echo "========================================"
echo "AI Model Bazaar - Deploy to EC2"
echo "========================================"
echo ""
echo "📋 Deployment Details:"
echo "   EC2 IP:       $EC2_IP"
echo "   SSH User:     $SSH_USER"
echo "   Repository:   $REPO_URL"
echo "   Branch:       $BRANCH"
echo "   AWS Region:   $AWS_REGION"
echo "   S3 Bucket:    $S3_BUCKET_NAME"
echo ""
read -p "Proceed with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_error "Deployment cancelled"
    exit 1
fi

# Test SSH connection
log_step "Testing SSH connection..."
if ! ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SSH_USER}@${EC2_IP} "echo 'SSH OK'" &>/dev/null; then
    log_error "Cannot connect to EC2 instance via SSH"
    log_error "Please check:"
    log_error "  1. EC2 instance is running"
    log_error "  2. Security group allows SSH from your IP"
    log_error "  3. SSH key is correct"
    exit 1
fi
log_info "SSH connection successful!"

# Create deployment script
log_step "Creating deployment script..."
DEPLOY_SCRIPT="/tmp/model-hub-deploy-$(date +%s).sh"

cat > "$DEPLOY_SCRIPT" << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "=== System Update ==="
sudo yum update -y || sudo apt-get update -y

echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "amzn" ]]; then
            sudo yum install -y docker git
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -a -G docker $USER
        elif [[ "$ID" == "ubuntu" ]]; then
            sudo apt-get install -y docker.io docker-compose git
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -a -G docker $USER
        fi
    fi
else
    echo "Docker already installed"
fi

echo "=== Installing Docker Compose ==="
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi

echo "=== Cloning Repository ==="
sudo rm -rf /opt/model-hub
sudo mkdir -p /opt/model-hub
cd /opt/model-hub
sudo git clone -b BRANCH_PLACEHOLDER REPO_URL_PLACEHOLDER repo

echo "=== Checking Repository Structure ==="
if [ -d "repo/model-hub" ]; then
    echo "Found model-hub subdirectory"
    cd repo/model-hub
elif [ -f "repo/docker-compose.yml" ]; then
    echo "Using repo root directory"
    cd repo
else
    echo "ERROR: Cannot find docker-compose.yml"
    ls -la repo/
    exit 1
fi

APP_DIR=$(pwd)
echo "Application directory: $APP_DIR"

echo "=== Verifying docker-compose.yml ==="
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found"
    exit 1
fi

echo "=== Creating Environment File ==="
sudo tee .env > /dev/null << 'ENV_EOF'
# MongoDB Configuration
MONGODB_URL=MONGODB_URL_PLACEHOLDER
DATABASE_NAME=DATABASE_NAME_PLACEHOLDER

# JWT Configuration
JWT_SECRET_KEY=JWT_SECRET_PLACEHOLDER
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AWS Configuration
AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_PLACEHOLDER
AWS_SECRET_ACCESS_KEY=AWS_SECRET_KEY_PLACEHOLDER
AWS_REGION=AWS_REGION_PLACEHOLDER
S3_BUCKET_NAME=S3_BUCKET_PLACEHOLDER

# Demo Configuration
DEMO_BASE_URL=http://EC2_IP_PLACEHOLDER
DEMO_ENVIRONMENTS_PATH=/tmp/model-hub-demos
DEMO_PORT_START=DEMO_PORT_START_PLACEHOLDER
DEMO_PORT_END=DEMO_PORT_END_PLACEHOLDER

# File Upload Configuration
MAX_UPLOAD_SIZE_MB=MAX_UPLOAD_SIZE_PLACEHOLDER
ALLOWED_EXTENSIONS=.py,.pkl,.pt,.h5,.onnx,.txt,.json,.csv,.png,.jpg,.jpeg,.gif,.pth,.pb,.weights

# CORS Configuration
CORS_ORIGINS=http://EC2_IP_PLACEHOLDER:3000,http://EC2_IP_PLACEHOLDER

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://EC2_IP_PLACEHOLDER:8000

# Server Configuration
DEBUG=False
ENV_EOF

echo "=== Stopping Existing Containers ==="
sudo docker-compose down --remove-orphans 2>/dev/null || true

echo "=== Building Docker Images ==="
sudo docker-compose build --no-cache

echo "=== Starting Containers ==="
sudo docker-compose up -d

echo "=== Waiting for Services ==="
sleep 20

echo "=== Checking Service Status ==="
sudo docker-compose ps

echo "=== Testing Backend Health ==="
for i in {1..10}; do
    if curl -f http://localhost:8000/health 2>/dev/null; then
        echo "✓ Backend is healthy!"
        break
    fi
    echo "Waiting for backend... ($i/10)"
    sleep 3
done

echo ""
echo "========================================"
echo "=== Deployment Complete ==="
echo "========================================"
echo "Application Directory: $APP_DIR"
echo ""
echo "Access your application:"
echo "  Frontend:  http://EC2_IP_PLACEHOLDER:3000"
echo "  Backend:   http://EC2_IP_PLACEHOLDER:8000"
echo "  API Docs:  http://EC2_IP_PLACEHOLDER:8000/docs"
echo ""
echo "Useful commands:"
echo "  cd $APP_DIR"
echo "  sudo docker-compose logs -f"
echo "  sudo docker-compose ps"
echo "  sudo docker-compose restart"
DEPLOY_EOF

# Replace placeholders
sed -i.bak "s|REPO_URL_PLACEHOLDER|$REPO_URL|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|BRANCH_PLACEHOLDER|$BRANCH|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|MONGODB_URL_PLACEHOLDER|$MONGODB_URL|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|DATABASE_NAME_PLACEHOLDER|${DATABASE_NAME:-model_hub}|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|JWT_SECRET_PLACEHOLDER|$JWT_SECRET_KEY|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_ACCESS_KEY_PLACEHOLDER|$AWS_ACCESS_KEY_ID|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_SECRET_KEY_PLACEHOLDER|$AWS_SECRET_ACCESS_KEY|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_REGION_PLACEHOLDER|$AWS_REGION|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|S3_BUCKET_PLACEHOLDER|$S3_BUCKET_NAME|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|EC2_IP_PLACEHOLDER|$EC2_IP|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|DEMO_PORT_START_PLACEHOLDER|${DEMO_PORT_START:-8501}|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|DEMO_PORT_END_PLACEHOLDER|${DEMO_PORT_END:-8600}|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|MAX_UPLOAD_SIZE_PLACEHOLDER|${MAX_UPLOAD_SIZE_MB:-500}|g" "$DEPLOY_SCRIPT"
rm -f "${DEPLOY_SCRIPT}.bak"

# Copy script to EC2
log_step "Copying deployment script to EC2..."
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$DEPLOY_SCRIPT" ${SSH_USER}@${EC2_IP}:/tmp/deploy.sh

# Execute deployment
log_step "Deploying application on EC2..."
echo ""
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_IP} "bash /tmp/deploy.sh" || {
    log_error "Deployment failed. Check the output above for errors."
    exit 1
}

# Cleanup local script
rm -f "$DEPLOY_SCRIPT"

echo ""
echo "========================================"
log_info "🎉 Deployment Complete!"
echo "========================================"
echo ""
echo "🌐 Your Application URLs:"
echo "   Frontend:  http://$EC2_IP:3000"
echo "   Backend:   http://$EC2_IP:8000"
echo "   API Docs:  http://$EC2_IP:8000/docs"
echo ""
echo "🔑 SSH Access:"
echo "   ssh -i $SSH_KEY_PATH ${SSH_USER}@${EC2_IP}"
echo ""
echo "📊 Manage Your Application:"
echo "   View logs:       ./manage-app.sh logs"
echo "   Check status:    ./manage-app.sh status"
echo "   Restart:         ./manage-app.sh restart"
echo "   Update code:     ./manage-app.sh update"
echo ""
echo "⚠️  Important:"
echo "   1. Add $EC2_IP to MongoDB Atlas IP Whitelist"
echo "   2. Wait 1-2 minutes for all services to start"
echo "   3. Check security group allows required ports"
echo ""
echo "🔄 To redeploy later:"
echo "   ./deploy-to-ec2.sh"
echo ""
echo "⚙️  To update configuration:"
echo "   ./setup-credentials.sh"
echo ""
echo "========================================"

# Update deployment log
echo "$(date): Deployed to $EC2_IP" >> "$HOME/.model-hub-deployments.log"
