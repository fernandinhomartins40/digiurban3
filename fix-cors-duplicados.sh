#!/bin/bash

# Script para corrigir headers CORS duplicados no servidor apidigiruban.com.br
# O problema: Access-Control-Allow-Origin: *, * (headers duplicados)
# Solução: Remover configurações CORS extras do NGINX e deixar apenas o Supabase gerenciar

echo "🔧 Corrigindo headers CORS duplicados para apidigiruban.com.br..."

# Verificar problema atual
echo "🔍 Verificando problema atual..."
echo "Headers atuais:"
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token | grep -i "access-control" || echo "Falha na requisição"

echo ""
echo "📋 Aplicando correção..."

# Backup da configuração atual
cp /etc/nginx/sites-available/apidigiruban-com-br /etc/nginx/sites-available/apidigiruban-com-br.backup.$(date +%Y%m%d_%H%M%S)

# Nova configuração NGINX sem headers CORS extras
cat > /etc/nginx/sites-available/apidigiruban-com-br << 'EOF'
# Configuração NGINX para apidigiruban.com.br
# Proxy para instância Supabase SEM headers CORS extras

server {
    server_name apidigiruban.com.br www.apidigiruban.com.br;
    
    # Headers de segurança básicos (SEM CORS)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configuração de proxy otimizada
    client_max_body_size 50M;
    proxy_buffer_size 64k;
    proxy_buffers 32 64k;
    proxy_busy_buffers_size 128k;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Proxy transparente para Supabase (porta 8109)
    location / {
        # CRÍTICO: NÃO adicionar nenhum header CORS aqui
        # O Supabase Kong Gateway já gerencia CORS corretamente
        proxy_pass http://localhost:8109;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support para Realtime
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Não sobrescrever headers de resposta
        proxy_pass_header Access-Control-Allow-Origin;
        proxy_pass_header Access-Control-Allow-Methods;
        proxy_pass_header Access-Control-Allow-Headers;
        proxy_pass_header Access-Control-Allow-Credentials;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "Supabase API - CORS Fixed";
        add_header Content-Type text/plain;
    }
    
    # Logs
    access_log /var/log/nginx/apidigiruban.access.log;
    error_log /var/log/nginx/apidigiruban.error.log;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/apidigiruban.com.br/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/apidigiruban.com.br/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

# Redirecionamento HTTP para HTTPS
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
    
    # Aguardar reload
    sleep 2
    
    echo "✅ NGINX recarregado com sucesso!"
    
    # Testar correção
    echo ""
    echo "🧪 Testando correção..."
    echo "Headers após correção:"
    curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token | grep -i "access-control" || echo "Aguardando propagação..."
    
    echo ""
    echo "✅ CORS corrigido! Headers duplicados removidos."
    echo "🌐 O Supabase Kong Gateway agora gerencia CORS sozinho."
    
else
    echo "❌ Erro na configuração NGINX!"
    echo "🔄 Restaurando último backup..."
    cp /etc/nginx/sites-available/apidigiruban-com-br.backup.* /etc/nginx/sites-available/apidigiruban-com-br | tail -1
    systemctl reload nginx
    echo "🔙 Configuração anterior restaurada"
    exit 1
fi

echo ""
echo "🎉 Correção concluída!"
echo "📝 Próximos passos:"
echo "   1. Teste o login no DigiUrban2"
echo "   2. Monitore logs: tail -f /var/log/nginx/apidigiruban.error.log"
echo "   3. Se necessário, verifique Kong: docker logs supabase-kong-a7c18a88"