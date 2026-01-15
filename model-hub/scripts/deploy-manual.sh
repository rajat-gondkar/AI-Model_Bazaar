#!/bin/bash
# Manual EC2 Deployment Script for AI Model Bazaar
# Use this if you want to create the EC2 instance manually via AWS Console

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

clear
echo "========================================"
echo "AI Model Bazaar - Manual EC2 Deployment"
echo "========================================"
echo ""

# Check if user wants instructions or has already created instance
echo "Do you need instructions to create an EC2 instance first?"
echo "1) Yes - Show me how to create an EC2 instance"
echo "2) No - I already have an EC2 instance ready"
echo ""
read -p "Enter your choice (1 or 2): " CHOICE

if [ "$CHOICE" = "1" ]; then
    echo ""
    echo "========================================"
    echo "EC2 Instance Creation Guide"
    echo "========================================"
    echo ""
    echo "Step 1: Go to AWS Console"
    echo "  → https://console.aws.amazon.com/ec2/"
    echo ""
    echo "Step 2: Click 'Launch Instance'"
    echo ""
    echo "Step 3: Configure the instance:"
    echo "  Name: model-hub-server"
    echo "  AMI: Amazon Linux 2023 (or Ubuntu 22.04)"
    echo "  Instance Type: m7i-flex.large (or c7i-flex.large or t3.small)"
    echo "  Key Pair: Create new or select existing"
    echo "  Storage: 50 GB gp3"
    echo ""
    echo "Step 4: Configure Security Group - Allow these ports:"
    echo "  ✓ SSH (22) - From your IP"
    echo "  ✓ HTTP (80) - From anywhere (0.0.0.0/0)"
    echo "  ✓ HTTPS (443) - From anywhere (0.0.0.0/0)"
    echo "  ✓ Custom TCP (3000) - From anywhere (Frontend)"
    echo "  ✓ Custom TCP (8000) - From anywhere (Backend API)"
    echo "  ✓ Custom TCP (8501-8600) - From anywhere (Streamlit Demos)"
    echo ""
    echo "Step 5: Review and Launch"
    echo "  → Wait for instance to be 'Running'"
    echo "  → Note down the Public IP address"
    echo ""
    echo "Step 6: Allocate Elastic IP (Optional but Recommended)"
    echo "  → EC2 → Elastic IPs → Allocate Elastic IP"
    echo "  → Associate with your instance"
    echo ""
    echo "========================================"
    echo ""
    read -p "Press Enter when your EC2 instance is ready..."
fi

echo ""
log_step "Collecting EC2 Instance Details..."
echo ""

# Get EC2 instance details
read -p "EC2 Public IP Address: " EC2_IP
if [ -z "$EC2_IP" ]; then
    log_error "EC2 IP is required"
    exit 1
fi

read -p "Path to SSH Key (.pem file): " SSH_KEY_PATH
if [ -z "$SSH_KEY_PATH" ]; then
    log_error "SSH key path is required"
    exit 1
fi

# Expand tilde to home directory
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"

if [ ! -f "$SSH_KEY_PATH" ]; then
    log_error "SSH key file not found at: $SSH_KEY_PATH"
    exit 1
fi

# Set correct permissions for SSH key
chmod 400 "$SSH_KEY_PATH"

read -p "SSH Username [ec2-user]: " SSH_USER
SSH_USER=${SSH_USER:-ec2-user}

echo ""
log_step "Collecting Application Configuration..."
echo ""

# Get MongoDB URL
read -p "MongoDB Atlas URL: " MONGODB_URL
if [ -z "$MONGODB_URL" ]; then
    log_error "MongoDB URL is required"
    exit 1
fi

# JWT Secret
read -p "JWT Secret Key (min 32 chars) [auto-generate]: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    log_info "Generated JWT Secret"
fi

# AWS Credentials
read -p "AWS Access Key ID: " AWS_ACCESS_KEY
if [ -z "$AWS_ACCESS_KEY" ]; then
    log_error "AWS Access Key is required"
    exit 1
fi

read -p "AWS Secret Access Key: " AWS_SECRET_KEY
if [ -z "$AWS_SECRET_KEY" ]; then
    log_error "AWS Secret Key is required"
    exit 1
fi

read -p "AWS Region [ap-southeast-2]: " AWS_REGION
AWS_REGION=${AWS_REGION:-ap-southeast-2}

read -p "S3 Bucket Name [ai-model-bazaar-projects]: " S3_BUCKET
S3_BUCKET=${S3_BUCKET:-ai-model-bazaar-projects}

# GitHub Repository
read -p "GitHub Repository URL [https://github.com/rajat-gondkar/AI-Model_Bazaar.git]: " REPO_URL
REPO_URL=${REPO_URL:-https://github.com/rajat-gondkar/AI-Model_Bazaar.git}

read -p "Branch name [main]: " BRANCH
BRANCH=${BRANCH:-main}

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo "EC2 IP: $EC2_IP"
echo "SSH Key: $SSH_KEY_PATH"
echo "MongoDB: ${MONGODB_URL:0:20}..."
echo "AWS Region: $AWS_REGION"
echo "S3 Bucket: $S3_BUCKET"
echo "Repository: $REPO_URL"
echo "========================================"
echo ""
read -p "Proceed with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_error "Deployment cancelled"
    exit 1
fi

# Test SSH connection
log_step "Testing SSH connection..."
if ! ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${SSH_USER}@${EC2_IP} "echo 'SSH connection successful'" &>/dev/null; then
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
DEPLOY_SCRIPT="/tmp/model-hub-deploy.sh"

cat > "$DEPLOY_SCRIPT" << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "amzn" ]]; then
            # Amazon Linux
            sudo yum update -y
            sudo yum install -y docker git
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -a -G docker $USER
        elif [[ "$ID" == "ubuntu" ]]; then
            # Ubuntu
            sudo apt-get update
            sudo apt-get install -y docker.io docker-compose git
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -a -G docker $USER
        fi
    fi
fi

echo "=== Installing Docker Compose ==="
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "=== Cloning Repository ==="
sudo rm -rf /opt/model-hub
sudo mkdir -p /opt/model-hub
cd /opt/model-hub
sudo git clone -b BRANCH_PLACEHOLDER REPO_URL_PLACEHOLDER repo

echo "=== Checking Repository Structure ==="
if [ -d "repo/model-hub" ]; then
    echo "Found model-hub subdirectory, using it..."
    cd repo/model-hub
elif [ -d "repo" ]; then
    echo "Using repo root directory..."
    cd repo
else
    echo "ERROR: Repository structure not as expected"
    exit 1
fi

echo "=== Verifying docker-compose.yml exists ==="
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found in $(pwd)"
    ls -la
    exit 1
fi

echo "=== Creating Environment File ==="
sudo tee .env > /dev/null << 'EOF'
MONGODB_URL=MONGODB_URL_PLACEHOLDER
DATABASE_NAME=model_hub
JWT_SECRET_KEY=JWT_SECRET_PLACEHOLDER
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_PLACEHOLDER
AWS_SECRET_ACCESS_KEY=AWS_SECRET_KEY_PLACEHOLDER
AWS_REGION=AWS_REGION_PLACEHOLDER
S3_BUCKET_NAME=S3_BUCKET_PLACEHOLDER
DEMO_BASE_URL=http://EC2_IP_PLACEHOLDER
DEMO_ENVIRONMENTS_PATH=/tmp/model-hub-demos
DEMO_PORT_START=8501
DEMO_PORT_END=8600
MAX_UPLOAD_SIZE_MB=500
CORS_ORIGINS=http://EC2_IP_PLACEHOLDER:3000,http://EC2_IP_PLACEHOLDER
DEBUG=False
NEXT_PUBLIC_API_URL=http://EC2_IP_PLACEHOLDER:8000
EOF

echo "=== Current working directory: $(pwd) ==="
echo "=== Files in current directory: ==="
ls -la

echo "=== Building and Starting Containers ==="
sudo docker-compose down --remove-orphans 2>/dev/null || true
sudo docker-compose build --no-cache
sudo docker-compose up -d

echo "=== Waiting for Services ==="
sleep 15

echo "=== Checking Service Status ==="
sudo docker-compose ps

echo "=== Deployment Complete ==="
FINAL_DIR=$(pwd)
echo "Application deployed to: $FINAL_DIR"
echo "Frontend: http://EC2_IP_PLACEHOLDER:3000"
echo "Backend:  http://EC2_IP_PLACEHOLDER:8000"
echo "API Docs: http://EC2_IP_PLACEHOLDER:8000/docs"
echo ""
echo "=== Useful Commands ==="
echo "cd $FINAL_DIR"
echo "sudo docker-compose ps"
echo "sudo docker-compose logs -f"
DEPLOY_EOF

# Replace placeholders
sed -i.bak "s|REPO_URL_PLACEHOLDER|$REPO_URL|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|BRANCH_PLACEHOLDER|$BRANCH|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|MONGODB_URL_PLACEHOLDER|$MONGODB_URL|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|JWT_SECRET_PLACEHOLDER|$JWT_SECRET|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_ACCESS_KEY_PLACEHOLDER|$AWS_ACCESS_KEY|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_SECRET_KEY_PLACEHOLDER|$AWS_SECRET_KEY|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|AWS_REGION_PLACEHOLDER|$AWS_REGION|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|S3_BUCKET_PLACEHOLDER|$S3_BUCKET|g" "$DEPLOY_SCRIPT"
sed -i.bak "s|EC2_IP_PLACEHOLDER|$EC2_IP|g" "$DEPLOY_SCRIPT"
rm -f "${DEPLOY_SCRIPT}.bak"

# Copy script to EC2
log_step "Copying deployment script to EC2..."
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$DEPLOY_SCRIPT" ${SSH_USER}@${EC2_IP}:/tmp/

# Execute deployment
log_step "Deploying application on EC2..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_IP} "bash /tmp/model-hub-deploy.sh" || {
    log_error "Deployment failed. Check the output above for errors."
    exit 1
}

echo ""
echo "========================================"
log_info "Deployment Complete!"
echo "========================================"
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://$EC2_IP:3000"
echo "   Backend:   http://$EC2_IP:8000"
echo "   API Docs:  http://$EC2_IP:8000/docs"
echo ""
echo "🔑 SSH Access:"
echo "   ssh -i $SSH_KEY_PATH ${SSH_USER}@${EC2_IP}"
echo ""
echo "📊 Useful Commands (on EC2):"
echo "   # Find the deployment directory first:"
echo "   cd /opt/model-hub/repo/model-hub  # or"
echo "   cd /opt/model-hub/repo"
echo ""
echo "   # Then use these commands:"
echo "   sudo docker-compose logs -f       # View logs"
echo "   sudo docker-compose ps            # Check status"
echo "   sudo docker-compose restart       # Restart services"
echo "   sudo docker-compose down          # Stop services"
echo ""
echo "⚠️  Important Notes:"
echo "   1. Add your EC2 IP to MongoDB Atlas IP Whitelist"
echo "   2. Wait 1-2 minutes for services to fully start"
echo "   3. Check security group allows required ports"
echo ""
echo "========================================"

# Save configuration
CONFIG_FILE="$HOME/.model-hub-deployment.conf"
cat > "$CONFIG_FILE" << EOF
EC2_IP=$EC2_IP
SSH_KEY_PATH=$SSH_KEY_PATH
SSH_USER=$SSH_USER
DEPLOYED_AT=$(date)
EOF
log_info "Configuration saved to $CONFIG_FILE"
