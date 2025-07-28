#!/bin/bash

echo "🔧 Corrigindo problema do Nginx..."
echo "=================================="

# 1. Parar Nginx
echo "🛑 Parando Nginx..."
sudo systemctl stop nginx

# 2. Verificar se há processos na porta 5002
echo "🔍 Verificando processos na porta 5002..."
sudo netstat -tlnp | grep :5002 || echo "Nenhum processo na porta 5002"

# 3. Aplicar configuração corrigida do Nginx
echo "⚙️ Aplicando configuração corrigida do Nginx..."
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
    }
}
EOF

# 4. Testar configuração
echo "🔍 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    
    # 5. Iniciar Nginx
    echo "🚀 Iniciando Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # 6. Verificar status
    echo "📊 Status do Nginx:"
    sudo systemctl status nginx --no-pager -l
    
    # 7. Testar conectividade
    echo "🧪 Testando conectividade..."
    echo "Testando frontend:"
    curl -I https://devhubtrader.com.br 2>/dev/null | head -1 || echo "❌ Frontend não está respondendo"
    
    echo "Testando backend:"
    curl -I https://api.devhubtrader.com.br 2>/dev/null | head -1 || echo "❌ Backend não está respondendo"
    
    echo ""
    echo "✅ Nginx corrigido com sucesso!"
    echo "🌐 Agora:"
    echo "   - Frontend: https://devhubtrader.com.br"
    echo "   - Backend: https://api.devhubtrader.com.br"
    echo "   - O backend aceita chamadas de qualquer origem configurada"
    
else
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi 