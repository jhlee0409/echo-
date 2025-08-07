#!/bin/bash

# 소울메이트 AI 컴패니언 게임 - 의존성 설치 스크립트
# Soulmate AI Companion Game - Dependency Installation Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
PACKAGE="📦"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
SPARKLES="✨"

echo -e "${CYAN}${ROCKET} 소울메이트 프로젝트 의존성 설치 시작...${NC}"
echo -e "${CYAN}${ROCKET} Starting Soulmate project dependency installation...${NC}"
echo ""

# Function to print colored output
print_status() {
    local color=$1
    local icon=$2
    local message=$3
    echo -e "${color}${icon} ${message}${NC}"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get package manager
get_package_manager() {
    if command_exists npm; then
        echo "npm"
    elif command_exists yarn; then
        echo "yarn"
    elif command_exists pnpm; then
        echo "pnpm"
    else
        print_status $RED $ERROR "No package manager found. Please install npm, yarn, or pnpm."
        exit 1
    fi
}

# Function to check Node.js version
check_node_version() {
    print_header "Node.js 버전 확인 / Node.js Version Check"
    
    if ! command_exists node; then
        print_status $RED $ERROR "Node.js not found. Please install Node.js 18.0.0 or higher."
        exit 1
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        print_status $RED $ERROR "Node.js version $node_version found. Required: 18.0.0 or higher."
        exit 1
    fi
    
    print_status $GREEN $CHECK "Node.js version: $node_version ✓"
}

# Function to install dependencies
install_dependencies() {
    local pm=$(get_package_manager)
    
    print_header "의존성 설치 / Installing Dependencies"
    print_status $BLUE $PACKAGE "Package manager: $pm"
    
    # Remove existing node_modules and lock files for clean install
    if [ -d "node_modules" ]; then
        print_status $YELLOW $WARNING "Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        print_status $YELLOW $WARNING "Removing package-lock.json for clean install..."
        rm -f package-lock.json
    fi
    
    if [ -f "yarn.lock" ]; then
        print_status $YELLOW $WARNING "Removing yarn.lock for clean install..."
        rm -f yarn.lock
    fi
    
    # Install dependencies based on package manager
    case $pm in
        "npm")
            print_status $BLUE $PACKAGE "Installing with npm..."
            npm install --legacy-peer-deps --progress=true
            ;;
        "yarn")
            print_status $BLUE $PACKAGE "Installing with yarn..."
            yarn install --network-timeout 300000
            ;;
        "pnpm")
            print_status $BLUE $PACKAGE "Installing with pnpm..."
            pnpm install --shamefully-hoist
            ;;
    esac
    
    print_status $GREEN $CHECK "Dependencies installed successfully!"
}

# Function to verify critical dependencies
verify_dependencies() {
    print_header "의존성 검증 / Verifying Dependencies"
    
    local critical_deps=(
        "react"
        "react-dom"
        "typescript"
        "vite"
        "tailwindcss"
        "zustand"
        "axios"
        "@supabase/supabase-js"
    )
    
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_status $GREEN $CHECK "$dep"
        else
            print_status $RED $ERROR "$dep - Missing!"
            exit 1
        fi
    done
}

# Function to setup development environment
setup_dev_environment() {
    print_header "개발 환경 설정 / Development Environment Setup"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_status $GREEN $CHECK ".env.local created from .env.example"
        else
            print_status $YELLOW $WARNING ".env.example not found. Creating basic .env.local..."
            cat > .env.local << EOF
# API Keys - Configure these before starting development
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000

# Game Configuration
VITE_MAX_DAILY_MESSAGES=50
VITE_ENABLE_DEBUG_MODE=true

# Feature Flags
VITE_ENABLE_VOICE_CHAT=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PAYMENT=false
EOF
        fi
    else
        print_status $BLUE $GEAR ".env.local already exists"
    fi
    
    # Setup Git hooks if husky is installed
    if [ -d "node_modules/husky" ]; then
        print_status $BLUE $GEAR "Setting up Git hooks..."
        npx husky install 2>/dev/null || true
        print_status $GREEN $CHECK "Git hooks configured"
    fi
    
    # Create necessary directories
    local dirs=(
        "src/components/ui"
        "src/components/game"
        "src/components/chat"
        "src/store"
        "src/api"
        "src/hooks"
        "src/utils"
        "src/types"
        "src/assets/images"
        "src/assets/sounds"
        "scripts"
        "public/images"
        "public/sounds"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status $GREEN $CHECK "Created directory: $dir"
        fi
    done
}

# Function to run type checking
run_type_check() {
    print_header "TypeScript 타입 검사 / TypeScript Type Check"
    
    if command_exists tsc; then
        if npx tsc --noEmit; then
            print_status $GREEN $CHECK "TypeScript type check passed!"
        else
            print_status $YELLOW $WARNING "TypeScript type check found issues (non-critical)"
        fi
    else
        print_status $YELLOW $WARNING "TypeScript not available for type checking"
    fi
}

# Function to display next steps
show_next_steps() {
    print_header "다음 단계 / Next Steps"
    
    echo -e "${SPARKLES} ${GREEN}설치 완료! 다음 단계를 진행하세요:${NC}"
    echo -e "${SPARKLES} ${GREEN}Installation complete! Follow these next steps:${NC}"
    echo ""
    
    echo -e "${CYAN}1. ${NC}API 키 설정 / Configure API Keys:"
    echo -e "   ${YELLOW}nano .env.local${NC}"
    echo ""
    
    echo -e "${CYAN}2. ${NC}개발 서버 시작 / Start Development Server:"
    echo -e "   ${YELLOW}npm run dev${NC}"
    echo ""
    
    echo -e "${CYAN}3. ${NC}브라우저에서 확인 / Open in Browser:"
    echo -e "   ${YELLOW}http://localhost:5173${NC}"
    echo ""
    
    echo -e "${CYAN}4. ${NC}추가 명령어 / Additional Commands:"
    echo -e "   ${YELLOW}npm run type-check${NC}  # TypeScript 검사"
    echo -e "   ${YELLOW}npm run lint${NC}        # 코드 품질 검사"
    echo -e "   ${YELLOW}npm run build${NC}       # 프로덕션 빌드"
    echo -e "   ${YELLOW}npm run test${NC}        # 테스트 실행"
    echo ""
    
    print_status $PURPLE $SPARKLES "Happy coding! 즐거운 개발 되세요! 🎮✨"
}

# Function to handle errors
handle_error() {
    print_status $RED $ERROR "Installation failed at step: $1"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo -e "1. Check your internet connection"
    echo -e "2. Try running: ${CYAN}npm cache clean --force${NC}"
    echo -e "3. Delete node_modules and try again"
    echo -e "4. Check Node.js version: ${CYAN}node --version${NC}"
    echo ""
    exit 1
}

# Main installation process
main() {
    # Check prerequisites
    check_node_version || handle_error "Node.js version check"
    
    # Install dependencies
    install_dependencies || handle_error "Dependency installation"
    
    # Verify installation
    verify_dependencies || handle_error "Dependency verification"
    
    # Setup development environment
    setup_dev_environment || handle_error "Development environment setup"
    
    # Run type check
    run_type_check || handle_error "TypeScript type check"
    
    # Show completion message
    show_next_steps
    
    echo ""
    print_status $GREEN $ROCKET "소울메이트 프로젝트 설정 완료! / Soulmate project setup complete!"
}

# Run main function
main "$@"