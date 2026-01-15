#!/bin/bash
# Manage AI Model Bazaar application on EC2
# Requires setup-credentials.sh to be run first

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CONFIG_FILE="$HOME/.model-hub-config"

if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Configuration not found. Run ./setup-credentials.sh first"
    exit 1
fi

source "$CONFIG_FILE"

COMMAND=${1:-help}

case "$COMMAND" in
    logs)
        log_info "Fetching application logs..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} \
            "cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo; sudo docker-compose logs -f"
        ;;
    
    status)
        log_info "Checking application status..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} \
            "cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo; sudo docker-compose ps"
        ;;
    
    restart)
        log_info "Restarting application..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} \
            "cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo; sudo docker-compose restart"
        log_info "✓ Application restarted"
        ;;
    
    stop)
        log_info "Stopping application..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} \
            "cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo; sudo docker-compose down"
        log_info "✓ Application stopped"
        ;;
    
    start)
        log_info "Starting application..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} \
            "cd /opt/model-hub/repo/model-hub 2>/dev/null || cd /opt/model-hub/repo; sudo docker-compose up -d"
        log_info "✓ Application started"
        ;;
    
    update)
        log_info "Updating code from repository..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP} << 'REMOTE_SCRIPT'
            cd /opt/model-hub/repo
            sudo git fetch origin
            sudo git pull origin main
            cd model-hub 2>/dev/null || cd .
            sudo docker-compose down
            sudo docker-compose build --no-cache
            sudo docker-compose up -d
REMOTE_SCRIPT
        log_info "✓ Application updated"
        ;;
    
    shell)
        log_info "Opening SSH shell..."
        ssh -i "$SSH_KEY_PATH" ${SSH_USER}@${EC2_IP}
        ;;
    
    health)
        log_info "Checking application health..."
        HEALTH=$(curl -s http://$EC2_IP:8000/health 2>/dev/null || echo "failed")
        if echo "$HEALTH" | grep -q "healthy"; then
            log_info "✓ Backend is healthy: $HEALTH"
        else
            log_error "✗ Backend health check failed"
        fi
        ;;
    
    help|*)
        echo "AI Model Bazaar - Application Management"
        echo ""
        echo "Usage: ./manage-app.sh [command]"
        echo ""
        echo "Commands:"
        echo "  logs      - View application logs (live)"
        echo "  status    - Check container status"
        echo "  restart   - Restart all services"
        echo "  stop      - Stop all services"
        echo "  start     - Start all services"
        echo "  update    - Pull latest code and rebuild"
        echo "  shell     - Open SSH shell to EC2"
        echo "  health    - Check backend health endpoint"
        echo "  help      - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./manage-app.sh logs"
        echo "  ./manage-app.sh restart"
        echo "  ./manage-app.sh update"
        ;;
esac
