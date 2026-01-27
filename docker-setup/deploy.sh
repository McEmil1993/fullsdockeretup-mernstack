#!/bin/bash

# Production Deployment Script
# Usage: ./deploy.sh [build|start|stop|restart|logs|status]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Student Info System - Production${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

function print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function print_error() {
    echo -e "${RED}✗ $1${NC}"
}

function print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

function check_health() {
    print_info "Checking service health..."
    sleep 5
    
    # Check backend
    if curl -sf http://localhost:3000/api/auth/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed (may need Cloudflare Tunnel)"
    fi
}

function build_production() {
    print_header
    print_info "Building production images..."
    docker compose build --no-cache
    print_success "Build complete!"
}

function start_production() {
    print_header
    print_info "Starting production containers..."
    docker compose up --build -d
    print_success "Containers started!"
    check_health
    echo ""
    docker compose ps
}

function stop_production() {
    print_header
    print_info "Stopping containers..."
    docker compose down
    print_success "Containers stopped!"
}

function restart_production() {
    print_header
    print_info "Restarting containers..."
    docker compose restart
    print_success "Containers restarted!"
    check_health
}

function show_logs() {
    print_header
    print_info "Showing logs (Ctrl+C to exit)..."
    docker compose logs -f
}

function show_status() {
    print_header
    print_info "Container Status:"
    docker compose ps
    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream
}

function rebuild_and_deploy() {
    print_header
    print_info "Rebuilding and deploying..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    print_success "Deployment complete!"
    check_health
    echo ""
    docker compose ps
}

function show_help() {
    print_header
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build       - Build production images"
    echo "  start       - Start production containers"
    echo "  stop        - Stop all containers"
    echo "  restart     - Restart all containers"
    echo "  logs        - Show live logs"
    echo "  status      - Show container status and resource usage"
    echo "  deploy      - Full rebuild and deploy (stop → build → start)"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh build      # Build images"
    echo "  ./deploy.sh start      # Start containers"
    echo "  ./deploy.sh logs       # View logs"
    echo "  ./deploy.sh deploy     # Full deployment"
}

# Main script
case "$1" in
    build)
        build_production
        ;;
    start)
        start_production
        ;;
    stop)
        stop_production
        ;;
    restart)
        restart_production
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    deploy)
        rebuild_and_deploy
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
