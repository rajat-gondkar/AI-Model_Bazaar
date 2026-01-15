#!/bin/bash
# Incremental Update Script for AI Model Bazaar
# Updates only the specified service (backend/frontend) without full redeploy
# Usage: ./update-service.sh [backend|frontend|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_cyan() { echo -e "${CYAN}$1${NC}"; }

CONFIG_FILE="$HOME/.model-hub-config"

# Show usage
show_usage() {
    echo ""
    log_cyan "========================================"
    log_cyan " AI Model Bazaar - Incremental Update"
    log_cyan "========================================"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  backend   - Update only the backend service"
    echo "  frontend  - Update only the frontend service"
    echo "  all       - Update both services (pull and rebuild)"
    echo "  restart   - Restart services without rebuilding"
    echo "  logs      - View container logs"
    echo "  status    - Check service status"
    echo ""
    echo "Examples:"
    echo "  $0 backend   # Update backend only"
    echo "  $0 frontend  # Update frontend only"
    echo "  $0 all       # Update everything"
    echo "  $0 status    # Check current status"
    echo ""
}

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Configuration file not found!"
    echo ""
    echo "Please run setup-credentials.sh first to configure your deployment."
    exit 1
fi

# Load configuration
source "$CONFIG_FILE"

# Validate required variables
if [ -z "$EC2_IP" ] || [ -z "$SSH_KEY_PATH" ] || [ -z "$SSH_USER" ]; then
    log_error "Missing required configuration. Please run setup-credentials.sh"
    exit 1
fi

# SSH command helper
SSH_CMD="ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_IP}"

# Function to check service status
check_status() {
    log_step "Checking service status on EC2..."
    $SSH_CMD << 'EOF'
        echo ""
        echo "=== Docker Containers ==="
        sudo docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20
        echo ""
        echo "=== Container Health ==="
        for container in model-hub-backend model-hub-frontend; do
            status=$(sudo docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "not found")
            echo "$container: $status"
        done
        echo ""
        echo "=== Port Status ==="
        echo "Backend (8000): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health || echo 'unreachable')"
        echo "Frontend (3000): $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'unreachable')"
        echo ""
        echo "=== Demo Ports (8501-8510 sample) ==="
        netstat -tlnp 2>/dev/null | grep -E "850[0-9]|851[0]" || echo "No demo ports in use"
EOF
}

# Function to view logs
view_logs() {
    log_step "Fetching container logs..."
    read -p "Which service? (backend/frontend/all): " service
    $SSH_CMD << EOF
        cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo
        case "$service" in
            backend)
                sudo docker logs --tail 50 model-hub-backend
                ;;
            frontend)
                sudo docker logs --tail 50 model-hub-frontend
                ;;
            *)
                echo "=== Backend Logs ==="
                sudo docker logs --tail 25 model-hub-backend
                echo ""
                echo "=== Frontend Logs ==="
                sudo docker logs --tail 25 model-hub-frontend
                ;;
        esac
EOF
}

# Function to restart services
restart_services() {
    log_step "Restarting services on EC2..."
    $SSH_CMD << 'EOF'
        cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo
        echo "Restarting containers..."
        sudo docker-compose restart
        echo ""
        echo "Waiting for services to be healthy..."
        sleep 10
        sudo docker ps --format "table {{.Names}}\t{{.Status}}"
EOF
    log_info "Services restarted!"
}

# Function to update a specific service
update_service() {
    local SERVICE=$1
    
    log_step "Updating $SERVICE on EC2..."
    
    # First, push local changes to git
    log_step "Pushing local changes to git..."
    cd "$(dirname "$0")/.."
    
    # Check if there are changes to commit
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warn "You have uncommitted changes. Commit them first? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            git add -A
            read -p "Enter commit message: " commit_msg
            git commit -m "${commit_msg:-Update $SERVICE}"
        fi
    fi
    
    git push origin ${BRANCH:-main} 2>/dev/null || git push origin main
    log_info "Changes pushed to repository"
    
    # Update on EC2
    $SSH_CMD << EOF
        set -e
        cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo
        
        echo "=== Pulling latest changes ==="
        sudo git fetch origin
        sudo git reset --hard origin/${BRANCH:-main}
        
        echo ""
        echo "=== Rebuilding $SERVICE ==="
        case "$SERVICE" in
            backend)
                sudo docker-compose build --no-cache backend
                sudo docker-compose up -d backend
                ;;
            frontend)
                sudo docker-compose build --no-cache frontend
                sudo docker-compose up -d frontend
                ;;
            all)
                sudo docker-compose build --no-cache
                sudo docker-compose up -d
                ;;
        esac
        
        echo ""
        echo "=== Waiting for services ==="
        sleep 15
        
        echo ""
        echo "=== Service Status ==="
        sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
        
        echo ""
        echo "=== Health Check ==="
        curl -s http://localhost:8000/health || echo "Backend health check failed"
EOF

    log_info "$SERVICE updated successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   Frontend: http://${EC2_IP}:3000"
    echo "   Backend:  http://${EC2_IP}:8000"
    echo "   Demos:    http://${EC2_IP}:8501 (when running)"
}

# Main script logic
case "${1:-}" in
    backend)
        log_cyan "Updating Backend Service Only"
        update_service "backend"
        ;;
    frontend)
        log_cyan "Updating Frontend Service Only"
        update_service "frontend"
        ;;
    all)
        log_cyan "Updating All Services"
        update_service "all"
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    status)
        check_status
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

echo ""
log_info "Done!"
