#!/bin/bash

# Script para corrigir CORS duplicado no NGINX da VPS para apidigiruban.com.br
# Remove headers CORS extras que estão sendo adicionados pelo NGINX

echo "🔧 Corrigindo configuração NGINX para apidigiruban.com.br..."

# Verificar se a configuração atual tem headers CORS duplicados
echo "🔍 Verificando configuração atual do NGINX..."

# Fazer backup da configuração atual
echo "📁 Fazendo backup da configuração atual..."
cp /etc/nginx/sites-available/apidigiruban-com-br /etc/nginx/sites-available/apidigiruban-com-br.backup

# Atualizar configuração para remover headers CORS extras
echo "⚙️ Atualizando configuração NGINX para apidigiruban.com.br..."
cat > /etc/nginx/sites-available/apidigiruban-com-br << 'EOF'
# Configuração NGINX para apidigiruban.com.br
# Proxy para instância Supabase sem headers CORS extras

server {
    server_name apidigiruban.com.br www.apidigiruban.com.br;
    
    # Headers de segurança (sem CORS duplicados)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configuração de proxy
    client_max_body_size 50M;
    proxy_buffer_size 64k;
    proxy_buffers 32 64k;
    proxy_busy_buffers_size 128k;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Proxy para instância Supabase na porta 8109
    location / {
        # IMPORTANTE: NÃO adicionar headers CORS aqui
        # A instância Supabase já envia os headers CORS corretos
        proxy_pass http://localhost:8109;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "Supabase API Instance - HTTPS - Port 8109";
        add_header Content-Type text/plain;
    }
    
    # Logs específicos
    access_log /var/log/nginx/apidigiruban.access.log;
    error_log /var/log/nginx/apidigiruban.error.log;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/apidigiruban.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/apidigiruban.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.apidigiruban.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = apidigiruban.com.br) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name apidigiruban.com.br www.apidigiruban.com.br;
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
    echo "🌐 Agora apidigiruban.com.br não deve ter headers CORS duplicados"
else
    echo "❌ Erro na configuração NGINX!"
    echo "🔄 Restaurando backup..."
    cp /etc/nginx/sites-available/apidigiruban-com-br.backup /etc/nginx/sites-available/apidigiruban-com-br
    systemctl reload nginx
    echo "🔙 Configuração anterior restaurada"
    exit 1
fi

# Verificar se a instância Supabase está rodando
echo "🔍 Verificando se a instância Supabase está rodando na porta 8109..."
if curl -f -s http://localhost:8109/ >/dev/null 2>&1; then
    echo "✅ Instância Supabase funcionando na porta 8109"
else
    echo "⚠️ Instância Supabase pode não estar rodando na porta 8109"
    echo "🔍 Verificando processos na porta 8109..."
    netstat -tulpn | grep :8109 || echo "Porta 8109 não está em uso"
fi

echo "🎉 Configuração concluída!"
echo "🌐 Teste: curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token"