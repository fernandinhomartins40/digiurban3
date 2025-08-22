#!/bin/bash

# Script para atualizar configuração NGINX na VPS
# Configura proxy para container React na porta 3002

set -e

echo "🔧 Atualizando configuração NGINX para servir landing page React..."

# Backup da configuração atual
echo "📁 Fazendo backup da configuração atual..."
cp /etc/nginx/sites-available/digiurban-com-br /etc/nginx/sites-available/digiurban-com-br.backup

# Atualizar configuração para proxy para porta 3002
echo "⚙️ Atualizando configuração NGINX..."
cat > /etc/nginx/sites-available/digiurban-com-br << 'EOF'
# Configuração NGINX VPS para digiurban.com.br
# Faz proxy para container React na porta 3002

server {
    server_name digiurban.com.br www.digiurban.com.br;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configuração de proxy para React App
    client_max_body_size 50M;
    proxy_buffer_size 64k;
    proxy_buffers 32 64k;
    proxy_busy_buffers_size 128k;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Proxy para container React na porta 3002
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support para React dev tools
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # CORS headers se necessário
        add_header Access-Control-Allow-Origin "$http_origin" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # Health check endpoint customizado
    location /health {
        access_log off;
        return 200 "DigiUrban React App - HTTPS - Container Port 3002";
        add_header Content-Type text/plain;
    }
    
    # Proxy para assets estáticos do React
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs específicos
    access_log /var/log/nginx/digiurban-react.access.log;
    error_log /var/log/nginx/digiurban-react.error.log;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/digiurban.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/digiurban.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.digiurban.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = digiurban.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name digiurban.com.br www.digiurban.com.br;
    return 404; # managed by Certbot
}
EOF

# Testar configuração
echo "🔍 Testando configuração NGINX..."
if nginx -t; then
    echo "✅ Configuração NGINX válida"
    
    # Recarregar NGINX
    echo "🔄 Recarregando NGINX..."
    systemctl reload nginx
    
    echo "✅ NGINX atualizado com sucesso!"
    echo "🌐 Agora https://digiurban.com.br faz proxy para o container React na porta 3002"
else
    echo "❌ Erro na configuração NGINX!"
    echo "🔄 Restaurando backup..."
    cp /etc/nginx/sites-available/digiurban-com-br.backup /etc/nginx/sites-available/digiurban-com-br
    systemctl reload nginx
    echo "🔙 Configuração anterior restaurada"
    exit 1
fi

# Verificar se container está rodando
echo "🔍 Verificando se container React está rodando na porta 3002..."
if curl -f -s http://localhost:3002/ >/dev/null 2>&1; then
    echo "✅ Container React funcionando na porta 3002"
else
    echo "⚠️ Container React pode não estar rodando na porta 3002"
    echo "🔍 Verificando containers Docker..."
    docker ps | grep digiurban || echo "Nenhum container digiurban encontrado"
fi

echo "🎉 Configuração concluída!"
echo "🌐 Teste: https://digiurban.com.br"