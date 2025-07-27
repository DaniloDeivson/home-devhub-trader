#!/bin/bash

echo "🚀 DEPLOY IDEAL - DevHub Trader"
echo "================================"

# 1. Parar todos os processos
echo "🛑 Parando processos anteriores..."
pm2 stop all
pm2 delete all
sudo systemctl stop devhub-backend.service 2>/dev/null || true
sudo systemctl stop flaskapi.service 2>/dev/null || true

# 2. Parar Nginx
echo "🛑 Parando Nginx..."
sudo systemctl stop nginx

# 3. Limpar configurações do Nginx
echo "🧹 Limpando configurações do Nginx..."
sudo rm -f /etc/nginx/sites-enabled/*
sudo rm -f /etc/nginx/sites-available/devhubtrader

# 4. Matar processos Python que possam estar rodando
echo "🔪 Matando processos na porta 5002..."
sudo pkill -f "python.*main.py" || true
sudo pkill -f "gunicorn" || true

# 5. Configurar Backend
echo "🐍 Configurando Backend..."
cd /home/python-freela

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
echo "📦 Instalando dependências do backend..."
pip install -r requirements.txt

# Instalar gunicorn se não estiver
pip install gunicorn

# 6. Configurar Frontend
echo "⚛️ Configurando Frontend..."
cd /home/project

# Instalar dependências
echo "📦 Instalando dependências do frontend..."
npm install

# Build para produção
echo "🔨 Fazendo build do frontend..."
npm run build

# 7. Configurar serviço systemd para o backend
echo "⚙️ Configurando serviço systemd para o backend..."
sudo tee /etc/systemd/system/devhub-backend.service > /dev/null << 'EOF'
[Unit]
Description=DevHub Trader Backend API
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/home/python-freela
Environment=PATH=/home/python-freela/venv/bin
ExecStart=/home/python-freela/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5002 main:app --timeout 120
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable devhub-backend.service
sudo systemctl start devhub-backend.service

# 8. Iniciar Frontend com PM2
echo "🚀 Iniciando Frontend com PM2..."
cd /home/project
pm2 start npm --name "devhub-frontend" -- run preview

# 9. Configurar Nginx com SSL
echo "🌐 Configurando Nginx com SSL..."
sudo tee /etc/nginx/sites-available/devhubtrader > /dev/null << 'EOF'
# Configuração Nginx com SSL para DevHub Trader
# Frontend: https://devhubtrader.com.br
# Backend API: https://api.devhubtrader.com.br

# Configuração para o domínio principal (frontend)
server {
    listen 80;
    server_name devhubtrader.com.br www.devhubtrader.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name devhubtrader.com.br www.devhubtrader.com.br;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/devhubtrader.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/devhubtrader.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy para o frontend na porta 4173
    location / {
        proxy_pass http://localhost:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
}

# Configuração para o subdomínio da API (backend)
server {
    listen 80;
    server_name api.devhubtrader.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.devhubtrader.com.br;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.devhubtrader.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.devhubtrader.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy para o backend na porta 5002
    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 100M;
        
        # CORS Headers - Removidos para evitar duplicação com Flask-CORS
        # O Flask-CORS já está configurado no backend
    }
}
EOF

# Ativar configuração
sudo ln -s /etc/nginx/sites-available/devhubtrader /etc/nginx/sites-enabled/

# Testar e iniciar Nginx
echo "🔍 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração do Nginx válida!"
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

# 10. Aguardar um pouco para os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# 11. Verificar status
echo "✅ Verificando status dos serviços..."
pm2 status

echo "🔍 Verificando serviço systemd do backend..."
sudo systemctl status devhub-backend.service --no-pager -l

# 12. Testar conectividade
echo "🔍 Testando conectividade..."
echo "Testando frontend (porta 4173):"
curl -I http://localhost:4173 2>/dev/null | head -1 || echo "❌ Frontend não está respondendo"

echo "Testando backend (porta 5002):"
curl -I http://localhost:5002 2>/dev/null | head -1 || echo "❌ Backend não está respondendo"

echo "Testando Nginx (porta 80):"
curl -I http://localhost 2>/dev/null | head -1 || echo "❌ Nginx não está respondendo"

echo "Testando HTTPS frontend:"
curl -I https://devhubtrader.com.br 2>/dev/null | head -1 || echo "❌ HTTPS frontend não está respondendo"

echo "Testando HTTPS backend:"
curl -I https://api.devhubtrader.com.br 2>/dev/null | head -1 || echo "❌ HTTPS backend não está respondendo"

# 13. Mostrar informações finais
echo ""
echo "🎉 DEPLOY IDEAL CONCLUÍDO COM SUCESSO!"
echo "========================================"
echo ""
echo "🌐 URLs:"
echo "   Frontend: https://devhubtrader.com.br"
echo "   Backend API: https://api.devhubtrader.com.br"
echo ""
echo "📊 Status dos serviços:"
pm2 status
echo ""
sudo systemctl status devhub-backend.service --no-pager -l
echo ""
echo "🔧 Comandos úteis:"
echo "   pm2 status                    - Ver status do frontend"
echo "   pm2 logs                      - Ver logs do frontend"
echo "   sudo systemctl status devhub-backend.service - Ver status do backend"
echo "   sudo journalctl -u devhub-backend.service -f - Ver logs do backend"
echo "   sudo nginx -t                 - Testar configuração do Nginx"
echo "   sudo systemctl restart nginx  - Reiniciar Nginx"
echo "   sudo systemctl restart devhub-backend.service - Reiniciar backend"
echo ""
echo "🔒 SSL Certificados:"
echo "   Frontend: /etc/letsencrypt/live/devhubtrader.com.br/"
echo "   Backend:  /etc/letsencrypt/live/api.devhubtrader.com.br/"
echo ""
echo "📋 Rotas da API disponíveis:"
echo "   POST https://api.devhubtrader.com.br/api/tabela - Upload CSV"
echo "   POST https://api.devhubtrader.com.br/chat - Chat GPT" 