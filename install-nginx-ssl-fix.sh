#!/bin/bash
# ====================================================================
# SCRIPT PARA APLICAR CORREÇÃO SSL NO NGINX - DIGIURBAN.COM.BR
# Data: 20/08/2025
# Uso: bash install-nginx-ssl-fix.sh
# ====================================================================

set -e

echo "🔧 Iniciando correção SSL para digiurban.com.br..."

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script deve ser executado como root (sudo)"
    exit 1
fi

# Verificar se nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não encontrado. Instale o nginx primeiro."
    exit 1
fi

# Fazer backup da configuração atual
echo "📦 Fazendo backup da configuração atual..."
BACKUP_DIR="/etc/nginx/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Procurar arquivo de configuração existente
NGINX_SITE=""
if [ -f "/etc/nginx/sites-available/digiurban.com.br" ]; then
    NGINX_SITE="/etc/nginx/sites-available/digiurban.com.br"
elif [ -f "/etc/nginx/sites-available/default" ]; then
    NGINX_SITE="/etc/nginx/sites-available/default"
elif [ -f "/etc/nginx/conf.d/digiurban.com.br.conf" ]; then
    NGINX_SITE="/etc/nginx/conf.d/digiurban.com.br.conf"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    NGINX_SITE="/etc/nginx/conf.d/default.conf"
else
    echo "⚠️ Arquivo de configuração não encontrado, criando novo..."
    NGINX_SITE="/etc/nginx/sites-available/digiurban.com.br"
fi

# Fazer backup se arquivo existe
if [ -f "$NGINX_SITE" ]; then
    cp "$NGINX_SITE" "$BACKUP_DIR/"
    echo "✅ Backup salvo em: $BACKUP_DIR/"
fi

# Detectar caminho dos certificados Let's Encrypt
CERT_PATH="/etc/letsencrypt/live/digiurban.com.br"
if [ ! -d "$CERT_PATH" ]; then
    echo "⚠️ Certificados Let's Encrypt não encontrados em $CERT_PATH"
    echo "📝 Procurando certificados..."
    
    # Procurar em outros locais comuns
    for dir in /etc/ssl/certs /etc/nginx/ssl /opt/ssl; do
        if [ -d "$dir" ]; then
            echo "🔍 Verificar certificados em: $dir"
        fi
    done
    
    echo "❌ Configure os caminhos dos certificados manualmente na configuração"
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Criar nova configuração
echo "📝 Aplicando nova configuração SSL..."

cat > "$NGINX_SITE" << 'EOF'
# ====================================================================
# CONFIGURAÇÃO NGINX PARA CORREÇÃO SSL - DIGIURBAN.COM.BR
# Data: 20/08/2025
# Objetivo: Corrigir problemas de segurança e SSL warnings
# ====================================================================

server {
    listen 80;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # Redirecionamento forçado para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # ====================================================================
    # CONFIGURAÇÃO SSL SEGURA
    # ====================================================================
    
    # Certificados SSL (ajustar caminhos conforme Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/digiurban.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/digiurban.com.br/privkey.pem;
    
    # Protocolos SSL seguros
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Configurações adicionais SSL
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/digiurban.com.br/chain.pem;
    
    # ====================================================================
    # HEADERS DE SEGURANÇA OBRIGATÓRIOS
    # ====================================================================
    
    # HSTS - Força HTTPS por 1 ano
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # Previne ataques MIME-type sniffing
    add_header X-Content-Type-Options "nosniff" always;
    
    # Proteção contra clickjacking
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Proteção XSS
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Política de referrer
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Content Security Policy básica
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; media-src 'self' https:; object-src 'none'; frame-src 'self' https:;" always;
    
    # Remove header que revela versão do servidor
    server_tokens off;
    
    # ====================================================================
    # CONFIGURAÇÃO DO SITE
    # ====================================================================
    
    # Root directory (ajustar conforme sua estrutura)
    root /var/www/html;
    index index.html index.htm index.php;
    
    # Configuração de compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Configuração de cache para recursos estáticos
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Configuração principal
    location / {
        try_files $uri $uri/ /index.html;
        
        # Headers específicos para páginas HTML
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(htaccess|htpasswd|ini|log|sh|sql|conf)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Log files
    access_log /var/log/nginx/digiurban.com.br.access.log;
    error_log /var/log/nginx/digiurban.com.br.error.log;
}
EOF

# Habilitar site (se usando sites-available/sites-enabled)
if [ -d "/etc/nginx/sites-enabled" ]; then
    ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/"
    echo "✅ Site habilitado em sites-enabled"
fi

# Testar configuração
echo "🧪 Testando configuração do nginx..."
if nginx -t; then
    echo "✅ Configuração válida!"
else
    echo "❌ Erro na configuração. Restaurando backup..."
    if [ -f "$BACKUP_DIR/$(basename $NGINX_SITE)" ]; then
        cp "$BACKUP_DIR/$(basename $NGINX_SITE)" "$NGINX_SITE"
    fi
    exit 1
fi

# Recarregar nginx
echo "🔄 Recarregando nginx..."
systemctl reload nginx

# Verificar status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx recarregado com sucesso!"
else
    echo "❌ Erro ao recarregar nginx"
    systemctl status nginx
    exit 1
fi

echo ""
echo "🎉 CORREÇÃO SSL APLICADA COM SUCESSO!"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste o site: https://digiurban.com.br"
echo "2. Verifique no navegador se o aviso 'inseguro' desapareceu"
echo "3. Teste ferramentas online:"
echo "   - https://www.ssllabs.com/ssltest/"
echo "   - https://securityheaders.com/"
echo ""
echo "📁 Backup da configuração anterior: $BACKUP_DIR"
echo ""
echo "🔧 Se houver problemas, execute:"
echo "   sudo cp $BACKUP_DIR/$(basename $NGINX_SITE) $NGINX_SITE"
echo "   sudo systemctl reload nginx"