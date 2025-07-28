#!/bin/bash

echo "🔄 Aplicando redirecionamento da porta 5002..."
echo "=============================================="

# 1. Parar Nginx
echo "🛑 Parando Nginx..."
sudo systemctl stop nginx

# 2. Aplicar nova configuração
echo "⚙️ Aplicando nova configuração do Nginx..."
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

# Nota: O redirecionamento da porta 5002 é feito pelo próprio backend
# O Nginx não precisa escutar na porta 5002, apenas redirecionar via domínio

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

# 3. Testar configuração
echo "🔍 Testando configuração do Nginx..."
if sudo nginx -t; then
    echo "✅ Configuração válida!"
    
    # 4. Iniciar Nginx
    echo "🚀 Iniciando Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # 5. Testar redirecionamento
    echo "🧪 Testando redirecionamento..."
    echo "Testando chamada direta na porta 5002:"
    curl -I http://localhost:5002/ 2>/dev/null | head -1 || echo "❌ Erro no teste"
    
    echo "Testando API via domínio:"
    curl -I https://api.devhubtrader.com.br/ 2>/dev/null | head -1 || echo "❌ Erro no teste"
    
    echo ""
    echo "✅ Redirecionamento aplicado com sucesso!"
    echo "🌐 Agora:"
    echo "   - Chamadas diretas na porta 5002 são redirecionadas para api.devhubtrader.com.br"
    echo "   - O frontend pode usar api.devhubtrader.com.br normalmente"
    echo "   - O backend aceita chamadas de qualquer origem configurada"
    
else
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi 