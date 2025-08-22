#!/bin/bash

# =====================================================
# DIGIURBAN2 - DEPLOY EM VPS COM ULTRABASE EXISTENTE
# =====================================================
# Deploy que coexiste com ultrabase.com.br na mesma VPS
# =====================================================

VPS_IP="72.60.10.108"
DOMAIN="digiurban.com.br"
REPO_URL="https://github.com/fernandinhomartins40/digiurban2.git"
BRANCH="main"

echo "====================================================="
echo "🚀 DIGIURBAN2 - DEPLOY EM VPS COM ULTRABASE"
echo "====================================================="
echo "VPS: $VPS_IP"
echo "Domínio: $DOMAIN (coexiste com ultrabase.com.br)"
echo "Porta: 3002 (evita conflito com ultrabase)"
echo "====================================================="

echo ""
echo "[1/6] 📥 Clonando/atualizando repositório..."
cd /opt
if [ -d "digiurban2" ]; then
    echo "Atualizando repositório existente..."
    cd digiurban2
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git clone $REPO_URL
    cd digiurban2
    git checkout $BRANCH
fi

echo ""
echo "[2/6] 📋 Configurando environment..."
if [ ! -f ".env" ]; then
    echo "Copiando configurações de environment..."
    cp .env.nova_vps .env
fi

echo ""
echo "[3/6] 🐳 Parando containers antigos e reconstruindo..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo ""
echo "[4/6] ⏳ Aguardando aplicação inicializar..."
sleep 15

echo ""
echo "[5/6] 🌐 Configurando nginx para digiurban.com.br..."

# Verificar se nginx está rodando
if ! systemctl is-active --quiet nginx; then
    echo "Iniciando nginx..."
    systemctl start nginx
fi

# Criar configuração para digiurban.com.br
echo "Criando configuração nginx para $DOMAIN..."
cat > /etc/nginx/sites-available/digiurban.com.br << 'NGINX_CONFIG'
# Configuração para digiurban.com.br (coexiste com ultrabase.com.br)
server {
    listen 80;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy para DigiUrban2 na porta 3002
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
    
    # Logs específicos para digiurban
    access_log /var/log/nginx/digiurban.com.br.access.log;
    error_log /var/log/nginx/digiurban.com.br.error.log;
}
NGINX_CONFIG

# Habilitar site
ln -sf /etc/nginx/sites-available/digiurban.com.br /etc/nginx/sites-enabled/

# Testar configuração nginx
if nginx -t; then
    echo "✅ Configuração nginx válida"
    systemctl reload nginx
else
    echo "❌ Erro na configuração nginx"
    exit 1
fi

echo ""
echo "[6/6] 🔒 Configurando SSL para digiurban.com.br..."

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "Instalando certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Configurar SSL
echo "Configurando SSL para $DOMAIN..."
if certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN; then
    echo "✅ SSL configurado com sucesso!"
else
    echo "⚠️  SSL não configurado automaticamente. Configure manualmente:"
    echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo "====================================================="
echo "🎉 DEPLOY CONCLUÍDO!"
echo "====================================================="

# Verificações finais
echo ""
echo "🔍 Verificações finais..."

# Verificar container
if docker ps | grep -q "digiurban2-app"; then
    echo "✅ Container DigiUrban2 rodando"
else
    echo "❌ Container não está rodando"
fi

# Verificar conectividade
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|301\|302"; then
    echo "✅ Aplicação respondendo na porta 3002"
else
    echo "❌ Aplicação não responde na porta 3002"
fi

# Verificar nginx
if nginx -t >/dev/null 2>&1; then
    echo "✅ Configuração nginx válida"
else
    echo "❌ Problema na configuração nginx"
fi

echo ""
echo "📱 URLs para testar:"
echo "   🌐 https://$DOMAIN"
echo "   🌐 http://$DOMAIN (redirecionará para HTTPS)"
echo "   🔧 http://$VPS_IP:3002 (acesso direto)"

echo ""
echo "📋 Comandos úteis:"
echo "   📊 Ver logs: docker-compose logs -f"
echo "   🔄 Reiniciar: docker-compose restart"
echo "   🛠️  Status: docker-compose ps"
echo "   🌐 Nginx status: systemctl status nginx"

echo ""
echo "🏗️  Aplicações na VPS:"
echo "   📘 Ultrabase: ultrabase.com.br (porta existente)"
echo "   📗 DigiUrban2: digiurban.com.br (porta 3002)"
echo "====================================================="