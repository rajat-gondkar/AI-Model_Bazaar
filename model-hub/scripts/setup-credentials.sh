#!/bin/bash
# One-Time Credentials Setup for AI Model Bazaar
# Run this once to save your configuration, then use deploy-to-ec2.sh for deployments

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

clear
echo "========================================"
echo "AI Model Bazaar - Setup Configuration"
echo "========================================"
echo ""
echo "This will save your credentials for easy deployment."
echo "Credentials will be stored in: $CONFIG_FILE"
echo ""

# Check if config already exists
if [ -f "$CONFIG_FILE" ]; then
    log_warn "Configuration file already exists!"
    echo ""
    echo "Current configuration:"
    cat "$CONFIG_FILE" | grep -v "SECRET\|PASSWORD\|mongodb" | sed 's/=.*/=***/'
    echo ""
    read -p "Do you want to update it? (yes/no): " UPDATE_CONFIG
    if [ "$UPDATE_CONFIG" != "yes" ]; then
        log_info "Keeping existing configuration"
        exit 0
    fi
    # Backup existing config
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
    log_info "Backed up existing config to ${CONFIG_FILE}.backup"
fi

echo ""
log_step "Step 1: EC2 Instance Details"
echo ""

read -p "EC2 Public IP Address: " EC2_IP
if [ -z "$EC2_IP" ]; then
    log_error "EC2 IP is required"
    exit 1
fi

read -p "Path to SSH Key (.pem file) [~/.ssh/model-hub-key.pem]: " SSH_KEY_PATH
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/model-hub-key.pem}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"

if [ ! -f "$SSH_KEY_PATH" ]; then
    log_error "SSH key file not found at: $SSH_KEY_PATH"
    exit 1
fi
chmod 400 "$SSH_KEY_PATH"

read -p "SSH Username [ec2-user]: " SSH_USER
SSH_USER=${SSH_USER:-ec2-user}

echo ""
log_step "Step 2: Application Configuration"
echo ""

read -p "MongoDB Atlas URL: " MONGODB_URL
if [ -z "$MONGODB_URL" ]; then
    log_error "MongoDB URL is required"
    exit 1
fi

read -p "Database Name [model_hub]: " DATABASE_NAME
DATABASE_NAME=${DATABASE_NAME:-model_hub}

echo ""
read -p "JWT Secret Key (min 32 chars) [auto-generate]: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    log_info "Generated JWT Secret: ${JWT_SECRET:0:10}..."
fi

echo ""
log_step "Step 3: AWS Configuration"
echo ""

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

echo ""
log_step "Step 4: Repository Configuration"
echo ""

read -p "GitHub Repository URL [https://github.com/rajat-gondkar/AI-Model_Bazaar.git]: " REPO_URL
REPO_URL=${REPO_URL:-https://github.com/rajat-gondkar/AI-Model_Bazaar.git}

read -p "Branch name [main]: " BRANCH
BRANCH=${BRANCH:-main}

echo ""
log_step "Step 5: Demo Configuration"
echo ""

read -p "Demo Port Start [8501]: " DEMO_PORT_START
DEMO_PORT_START=${DEMO_PORT_START:-8501}

read -p "Demo Port End [8600]: " DEMO_PORT_END
DEMO_PORT_END=${DEMO_PORT_END:-8600}

read -p "Max Upload Size MB [500]: " MAX_UPLOAD_SIZE
MAX_UPLOAD_SIZE=${MAX_UPLOAD_SIZE:-500}

# Save configuration
log_step "Saving configuration..."

cat > "$CONFIG_FILE" << EOF
# AI Model Bazaar Configuration
# Created: $(date)

# EC2 Configuration
EC2_IP=$EC2_IP
SSH_KEY_PATH=$SSH_KEY_PATH
SSH_USER=$SSH_USER

# Application Configuration
MONGODB_URL=$MONGODB_URL
DATABASE_NAME=$DATABASE_NAME
JWT_SECRET_KEY=$JWT_SECRET

# AWS Configuration
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
AWS_REGION=$AWS_REGION
S3_BUCKET_NAME=$S3_BUCKET

# Repository Configuration
REPO_URL=$REPO_URL
BRANCH=$BRANCH

# Demo Configuration
DEMO_PORT_START=$DEMO_PORT_START
DEMO_PORT_END=$DEMO_PORT_END
MAX_UPLOAD_SIZE_MB=$MAX_UPLOAD_SIZE
EOF

chmod 600 "$CONFIG_FILE"

echo ""
echo "========================================"
log_info "Configuration saved successfully!"
echo "========================================"
echo ""
echo "📁 Config file: $CONFIG_FILE"
echo ""
echo "🔐 Security:"
echo "   - File permissions set to 600 (owner read/write only)"
echo "   - Contains sensitive credentials - keep secure!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Test SSH connection:"
echo "      ssh -i $SSH_KEY_PATH ${SSH_USER}@${EC2_IP}"
echo ""
echo "   2. Deploy your application:"
echo "      ./deploy-to-ec2.sh"
echo ""
echo "   3. To update this configuration later:"
echo "      ./setup-credentials.sh"
echo ""
echo "========================================"
