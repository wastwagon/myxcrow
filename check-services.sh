#!/bin/bash

echo "🔍 MYXCROW Services Status Check"
echo "================================="
echo ""

# API Health
if curl -s http://localhost:4000/api/health | grep -q ok; then
    echo "✅ API: Running (http://localhost:4000/api)"
else
    echo "❌ API: Not responding"
fi

# Web App
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3007 | grep -q 200; then
    echo "✅ Web App: Running (http://localhost:3007)"
else
    echo "❌ Web App: Not responding"
fi

# MinIO
if curl -s http://localhost:9004 > /dev/null; then
    echo "✅ MinIO Console: Running (http://localhost:9004)"
else
    echo "❌ MinIO Console: Not responding"
fi

# Mailpit  
if curl -s http://localhost:8026 > /dev/null; then
    echo "✅ Mailpit: Running (http://localhost:8026)"
else
    echo "❌ Mailpit: Not responding"
fi

echo ""
echo "📊 Docker Containers:"
docker ps --filter "name=escrow_" --format "table {{.Names}}\t{{.Status}}" | grep escrow || echo "No containers running"

echo ""
echo "💡 Quick Commands:"
echo "   View logs: docker-compose -f infra/docker/docker-compose.dev.yml logs -f"
echo "   Stop all:  docker-compose -f infra/docker/docker-compose.dev.yml down"
echo "   Restart:   docker-compose -f infra/docker/docker-compose.dev.yml restart"
