#!/bin/bash

# =====================================================
# DIGIURBAN2 - DEPLOY RÁPIDO NA VPS 72.60.10.108
# =====================================================
# Execute este script diretamente na VPS para deploy completo
# =====================================================

set -e  # Parar em caso de erro

VPS_IP="72.60.10.108"
DOMAIN="digiurban.com.br"
REPO_URL="https://github.com/fernandinhomartins40/digiurban2.git"
BRANCH="feature/complete-crud-implementation"

echo "====================================================="
echo "🚀 DIGIURBAN2 - DEPLOY AUTOMÁTICO"
echo "====================================================="
echo "VPS: $VPS_IP"
echo "Domínio: $DOMAIN"
echo "Branch: $BRANCH"
echo "====================================================="

# Verificar se está rodando na VPS correta
CURRENT_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
if [ "$CURRENT_IP" != "$VPS_IP" ]; then
    echo "⚠️  ATENÇÃO: Este script deve ser executado na VPS $VPS_IP"
    echo "   IP atual detectado: $CURRENT_IP"
    read -p "Deseja continuar mesmo assim? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Deploy cancelado."
        exit 1
    fi
fi

echo ""
echo "[1/8] 📥 Clonando repositório..."
cd /opt
if [ -d "digiurban2" ]; then
    echo "Diretório já existe, atualizando..."
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
echo "[2/8] 🔧 Configurando VPS (Docker, Nginx, etc.)..."
chmod +x deploy_nova_vps.sh
./deploy_nova_vps.sh

echo ""
echo "[3/8] 📋 Verificando arquivo .env..."
if [ ! -f ".env" ]; then
    echo "Copiando configurações de environment..."
    cp .env.nova_vps .env
else
    echo "Arquivo .env já existe"
fi

echo ""
echo "[4/8] 🐳 Construindo e subindo containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo ""
echo "[5/8] ⏳ Aguardando aplicação inicializar..."
sleep 10

echo ""
echo "[6/8] 🔍 Verificando se aplicação está rodando..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|301\|302"; then
    echo "✅ Aplicação está respondendo na porta 3002"
else
    echo "❌ Aplicação não está respondendo. Verificando logs..."
    docker-compose logs --tail=20
    echo ""
    echo "Continue com os próximos passos e verifique os logs se necessário."
fi

echo ""
echo "[7/8] 🌐 Verificando DNS do domínio..."
DNS_IP=$(dig +short $DOMAIN | tail -1 2>/dev/null || echo "")
if [ "$DNS_IP" = "$VPS_IP" ]; then
    echo "✅ DNS está correto: $DOMAIN → $VPS_IP"
    
    echo ""
    echo "[8/8] 🔒 Configurando SSL..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo "⚠️  Erro no SSL. Pode ser configurado manualmente depois com:"
        echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
    echo "⚠️  DNS ainda não aponta para esta VPS:"
    echo "   Esperado: $VPS_IP"
    echo "   Atual: $DNS_IP"
    echo ""
    echo "Configure o DNS primeiro, depois execute:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo "====================================================="
echo "🎉 DEPLOY CONCLUÍDO!"
echo "====================================================="

echo ""
echo "🔍 Executando verificações finais..."
./verificar_deploy.sh

echo ""
echo "📱 URLs para testar:"
if [ "$DNS_IP" = "$VPS_IP" ]; then
    echo "   🌐 https://$DOMAIN"
    echo "   🌐 http://$DOMAIN (redirecionará para HTTPS)"
else
    echo "   🌐 http://$VPS_IP:3002 (acesso direto)"
    echo "   ⏳ http://$DOMAIN (aguardar propagação DNS)"
fi

echo ""
echo "📋 Comandos úteis:"
echo "   📊 Ver logs: docker-compose logs -f"
echo "   🔄 Reiniciar: docker-compose restart"
echo "   🛠️  Status: docker-compose ps"
echo "   🔒 SSL manual: sudo certbot --nginx -d $DOMAIN"

echo ""
echo "====================================================="