#!/bin/bash

echo "🔍 Teste Rápido do Backend"
echo "=========================="

# Testar rota raiz
echo "1. Testando rota raiz (/):"
curl -s http://localhost:5002/ | jq . 2>/dev/null || curl -s http://localhost:5002/

echo ""
echo "2. Testando health check (/health):"
curl -s http://localhost:5002/health | jq . 2>/dev/null || curl -s http://localhost:5002/health

echo ""
echo "3. Testando endpoint /chat:"
curl -s http://localhost:5002/chat | head -c 100

echo ""
echo "4. Status do serviço:"
sudo systemctl is-active devhub-backend.service

echo ""
echo "✅ Teste concluído!" 