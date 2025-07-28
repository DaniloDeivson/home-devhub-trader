#!/bin/bash

echo "🔄 Reiniciando Backend com novas configurações..."
echo "================================================"

# Parar o serviço
echo "🛑 Parando serviço do backend..."
sudo systemctl stop devhub-backend.service

# Aguardar um pouco
sleep 2

# Verificar se parou
if sudo systemctl is-active --quiet devhub-backend.service; then
    echo "⚠️ Serviço ainda está rodando, forçando parada..."
    sudo systemctl kill devhub-backend.service
    sleep 3
fi

# Iniciar o serviço
echo "🚀 Iniciando serviço do backend..."
sudo systemctl start devhub-backend.service

# Aguardar inicialização
sleep 5

# Verificar status
echo "📊 Status do serviço:"
sudo systemctl status devhub-backend.service --no-pager -l

echo ""
echo "🔍 Testando endpoints..."
echo "1. Testando rota raiz:"
curl -s http://localhost:5002/ | head -c 200
echo ""

echo "2. Testando health check:"
curl -s http://localhost:5002/health | head -c 200
echo ""

echo "3. Verificando logs recentes:"
sudo journalctl -u devhub-backend.service --no-pager -n 10

echo ""
echo "✅ Backend reiniciado com sucesso!"
echo "🌐 Agora a API aceita chamadas de:"
echo "   - localhost:4173 (desenvolvimento)"
echo "   - devhubtrader.com.br (produção)"
echo "   - www.devhubtrader.com.br (produção)" 