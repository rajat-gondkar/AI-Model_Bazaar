#!/bin/bash
# AWS Infrastructure Setup Script
# Creates all AWS resources needed for Model Hub deployment

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

# Default values
STACK_NAME="model-hub-stack"
REGION="${AWS_REGION:-ap-southeast-2}"
INSTANCE_TYPE="m7i-flex.large"

# Check for required tools
check_requirements() {
    log_step "Checking requirements..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        log_info "Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log_info "AWS CLI configured for account: $(aws sts get-caller-identity --query Account --output text)"
}

# Create or select EC2 key pair
setup_key_pair() {
    log_step "Setting up EC2 key pair..."
    
    KEY_NAME="model-hub-key"
    KEY_FILE="$HOME/.ssh/${KEY_NAME}.pem"
    
    # Check if key pair exists
    if aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
        log_info "Key pair '$KEY_NAME' already exists"
        if [ ! -f "$KEY_FILE" ]; then
            log_warn "Key file not found at $KEY_FILE"
            log_warn "If you lost the key file, delete the key pair and run again:"
            log_warn "  aws ec2 delete-key-pair --key-name $KEY_NAME --region $REGION"
        fi
    else
        log_info "Creating new key pair '$KEY_NAME'..."
        mkdir -p $HOME/.ssh
        aws ec2 create-key-pair \
            --key-name $KEY_NAME \
            --region $REGION \
            --query 'KeyMaterial' \
            --output text > $KEY_FILE
        chmod 400 $KEY_FILE
        log_info "Key pair saved to $KEY_FILE"
    fi
}

# Prompt for configuration
get_configuration() {
    log_step "Configuration..."
    
    echo ""
    echo "Please provide the following configuration values:"
    echo "(Press Enter to use default values shown in brackets)"
    echo ""
    
    # MongoDB URL
    read -p "MongoDB URL [required]: " MONGODB_URL
    if [ -z "$MONGODB_URL" ]; then
        log_error "MongoDB URL is required"
        exit 1
    fi
    
    # JWT Secret
    read -p "JWT Secret Key (min 32 chars) [auto-generate]: " JWT_SECRET
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -hex 32)
        log_info "Generated JWT Secret: ${JWT_SECRET:0:10}..."
    fi
    
    # AWS Access Keys (for S3 within the app)
    read -p "AWS Access Key ID for S3 [from current profile]: " S3_ACCESS_KEY
    if [ -z "$S3_ACCESS_KEY" ]; then
        S3_ACCESS_KEY=$(aws configure get aws_access_key_id)
    fi
    
    read -p "AWS Secret Access Key for S3 [from current profile]: " S3_SECRET_KEY
    if [ -z "$S3_SECRET_KEY" ]; then
        S3_SECRET_KEY=$(aws configure get aws_secret_access_key)
    fi
    
    # S3 Bucket
    read -p "S3 Bucket Name [ai-model-bazaar-projects]: " S3_BUCKET
    S3_BUCKET=${S3_BUCKET:-ai-model-bazaar-projects}
    
    # Instance Type
    echo "Available instance types (free tier): t3.small (2vCPU/2GB), c7i-flex.large (2vCPU/4GB), m7i-flex.large (2vCPU/8GB)"
    read -p "EC2 Instance Type [m7i-flex.large]: " INSTANCE_TYPE_INPUT
    INSTANCE_TYPE=${INSTANCE_TYPE_INPUT:-m7i-flex.large}
}

# Deploy CloudFormation stack
deploy_stack() {
    log_step "Deploying CloudFormation stack..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    TEMPLATE_FILE="$SCRIPT_DIR/../aws/cloudformation.yaml"
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "CloudFormation template not found at $TEMPLATE_FILE"
        exit 1
    fi
    
    log_info "Creating/updating stack '$STACK_NAME'..."
    
    aws cloudformation deploy \
        --template-file $TEMPLATE_FILE \
        --stack-name $STACK_NAME \
        --region $REGION \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
            ProjectName=model-hub \
            Environment=production \
            InstanceType=$INSTANCE_TYPE \
            KeyPairName=$KEY_NAME \
            MongoDBURL="$MONGODB_URL" \
            JWTSecretKey="$JWT_SECRET" \
            AWSAccessKeyIdParam="$S3_ACCESS_KEY" \
            AWSSecretAccessKeyParam="$S3_SECRET_KEY" \
            S3BucketNameParam="$S3_BUCKET" \
            AWSRegionParam="$REGION" \
        --no-fail-on-empty-changeset
    
    log_info "Stack deployment initiated. Waiting for completion..."
    
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION 2>/dev/null || \
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $REGION 2>/dev/null || true
}

# Get stack outputs
get_outputs() {
    log_step "Getting deployment information..."
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output json)
    
    PUBLIC_IP=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="EC2PublicIP") | .OutputValue')
    FRONTEND_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="FrontendURL") | .OutputValue')
    BACKEND_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="BackendURL") | .OutputValue')
    SSH_COMMAND=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="SSHCommand") | .OutputValue')
    
    echo ""
    echo "========================================"
    echo -e "${GREEN}Deployment Successful!${NC}"
    echo "========================================"
    echo "Public IP:   $PUBLIC_IP"
    echo "Frontend:    $FRONTEND_URL"
    echo "Backend:     $BACKEND_URL"
    echo "API Docs:    $BACKEND_URL/docs"
    echo ""
    echo "SSH Access:"
    echo "  $SSH_COMMAND"
    echo ""
    echo "========================================"
    echo "Next Steps:"
    echo "========================================"
    echo "1. Wait 2-3 minutes for EC2 instance to initialize"
    echo "2. SSH into the instance:"
    echo "   $SSH_COMMAND"
    echo ""
    echo "3. Clone your repository and deploy:"
    echo "   sudo git clone https://github.com/your-repo/model-hub.git /opt/model-hub"
    echo "   cd /opt/model-hub/model-hub"
    echo "   sudo docker-compose up -d"
    echo ""
    echo "4. Or use the automated deployment script:"
    echo "   sudo bash /opt/model-hub/scripts/deploy-ec2.sh"
    echo "========================================"
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "AI Model Bazaar - AWS Infrastructure Setup"
    echo "========================================"
    echo ""
    
    check_requirements
    setup_key_pair
    get_configuration
    deploy_stack
    get_outputs
}

# Handle script arguments
case "${1:-}" in
    --destroy)
        log_step "Destroying CloudFormation stack..."
        aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION
        log_info "Stack deletion initiated. This may take a few minutes."
        ;;
    --status)
        aws cloudformation describe-stacks \
            --stack-name $STACK_NAME \
            --region $REGION \
            --query 'Stacks[0].{Status:StackStatus,Created:CreationTime}' \
            --output table
        ;;
    --help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  (no args)   Deploy the infrastructure"
        echo "  --destroy   Delete the CloudFormation stack"
        echo "  --status    Check stack status"
        echo "  --help      Show this help message"
        ;;
    *)
        main
        ;;
esac
