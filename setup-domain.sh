#!/bin/bash
# Script para configurar domínio digiurban.com.br na VPS
# Execute na VPS: chmod +x setup-domain.sh && sudo ./setup-domain.sh

echo "🌐 Configurando domínio digiurban.com.br para DigiUrban2"

# 1. Instalar nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
    echo "📦 Instalando nginx..."
    apt update
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
else
    echo "✅ Nginx já está instalado"
fi

# 2. Instalar certbot para SSL gratuito
if ! command -v certbot &> /dev/null; then
    echo "🔐 Instalando certbot (Let's Encrypt)..."
    apt install -y certbot python3-certbot-nginx
else
    echo "✅ Certbot já está instalado"
fi

# 3. Criar configuração nginx temporária (sem SSL)
echo "⚙️ Criando configuração nginx temporária..."
cat > /etc/nginx/sites-available/digiurban.com.br << 'EOF'
server {
    listen 80;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy para container Docker DigiUrban2
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
    }
    
    # Logs
    access_log /var/log/nginx/digiurban.com.br.access.log;
    error_log /var/log/nginx/digiurban.com.br.error.log;
}
EOF

# 4. Ativar configuração
echo "🔗 Ativando configuração..."
ln -sf /etc/nginx/sites-available/digiurban.com.br /etc/nginx/sites-enabled/
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✅ Nginx recarregado com sucesso"
else
    echo "❌ Erro na configuração nginx!"
    exit 1
fi

# 5. Obter certificado SSL (Let's Encrypt)
echo "🔐 Obtendo certificado SSL gratuito..."
certbot --nginx -d digiurban.com.br -d www.digiurban.com.br --non-interactive --agree-tos --email admin@digiurban.com.br

if [ $? -eq 0 ]; then
    echo "🎉 SSL configurado com sucesso!"
else
    echo "⚠️ SSL não pôde ser configurado automaticamente"
    echo "Execute manualmente: certbot --nginx -d digiurban.com.br -d www.digiurban.com.br"
fi

# 6. Configurar renovação automática
echo "⏰ Configurando renovação automática do SSL..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 7. Teste final
echo "🧪 Testando configuração..."
nginx -t
systemctl status nginx --no-pager -l

echo ""
echo "🎯 CONFIGURAÇÃO CONCLUÍDA!"
echo "🌐 Domínio: https://digiurban.com.br"
echo "🐳 Container: 127.0.0.1:3002"
echo "🔐 SSL: Let's Encrypt (renovação automática)"
echo ""
echo "Teste o acesso: curl -I https://digiurban.com.br"