#!/bin/bash

# Configure Docker Desktop Resources
# This script checks your system and recommends Docker Desktop settings

echo "🔧 Docker Desktop Resource Configuration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check system resources
echo "📊 Your System Resources:"
echo "------------------------"

# Total RAM
TOTAL_RAM_GB=$(sysctl hw.memsize | awk '{print int($2/1024/1024/1024)}')
echo "   Total RAM: ${TOTAL_RAM_GB} GB"

# CPU Cores
CPU_CORES=$(sysctl -n hw.ncpu)
echo "   CPU Cores: ${CPU_CORES}"

# Available disk
AVAIL_DISK=$(df -h / | tail -1 | awk '{print $4}')
echo "   Available Disk: ${AVAIL_DISK}"
echo ""

# Calculate recommendations
echo "💡 Recommended Docker Desktop Settings:"
echo "---------------------------------------"

# Memory recommendation (use 50% of total, but max 12GB, min 4GB)
if [ $TOTAL_RAM_GB -ge 16 ]; then
    RECOMMENDED_MEMORY=8
elif [ $TOTAL_RAM_GB -ge 8 ]; then
    RECOMMENDED_MEMORY=4
else
    RECOMMENDED_MEMORY=2
fi

# CPU recommendation (use 50% of cores, but max 6, min 2)
if [ $CPU_CORES -ge 8 ]; then
    RECOMMENDED_CPUS=4
elif [ $CPU_CORES -ge 4 ]; then
    RECOMMENDED_CPUS=2
else
    RECOMMENDED_CPUS=1
fi

echo -e "   ${BLUE}Memory: ${RECOMMENDED_MEMORY} GB${NC} (minimum for this project: 4GB)"
echo -e "   ${BLUE}CPUs: ${RECOMMENDED_CPUS}${NC} (minimum for this project: 4)"
echo "   Disk: 20GB+ (for images and containers)"
echo ""

# Instructions
echo "📋 How to Apply These Settings:"
echo "-------------------------------"
echo ""
echo "1. Open Docker Desktop"
echo "2. Click the Settings (gear) icon (top right)"
echo "3. Go to 'Resources' → 'Advanced'"
echo "4. Adjust the following:"
echo ""
echo -e "   ${GREEN}Memory:${NC}"
echo "   - Drag slider to ${RECOMMENDED_MEMORY} GB"
echo "   - If ${RECOMMENDED_MEMORY} GB is less than 4GB, set to 4GB minimum"
echo ""
echo -e "   ${GREEN}CPUs:${NC}"
echo "   - Set to ${RECOMMENDED_CPUS} CPUs"
echo "   - If ${RECOMMENDED_CPUS} is less than 4, set to 4 minimum"
echo ""
echo "5. Click 'Apply & Restart'"
echo "6. Wait for Docker Desktop to restart (30-60 seconds)"
echo "7. Wait for 'Engine running' status"
echo "8. Open a NEW terminal window"
echo "9. Run: cd /Users/OceanCyber/Downloads/myxcrow && ./setup-local.sh"
echo ""

# Check if Docker is accessible
echo "🧪 Testing Docker Connection..."
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is accessible${NC}"
    echo ""
    echo "Current Docker resource usage:"
    docker system df 2>/dev/null | head -10 || echo "   (Unable to get detailed info)"
else
    echo -e "${YELLOW}⚠️  Docker not accessible${NC}"
    echo "   This is normal if Docker Desktop needs to be restarted"
fi
echo ""

echo "📝 Summary:"
echo "----------"
echo "Your system has ${TOTAL_RAM_GB} GB RAM and ${CPU_CORES} CPU cores."
echo "For MYXCROW project, Docker Desktop needs:"
echo "  - Memory: 4GB minimum (you have ${TOTAL_RAM_GB} GB available)"
echo "  - CPUs: 4 minimum (you have ${CPU_CORES} cores available)"
echo ""
if [ $TOTAL_RAM_GB -lt 8 ]; then
    echo -e "${YELLOW}⚠️  Warning: Your system has limited RAM.${NC}"
    echo "   Consider closing other applications before building."
fi
echo ""

