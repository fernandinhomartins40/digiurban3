#!/bin/bash

# =====================================================
# DIGIURBAN2 - SCRIPT DE UPLOAD PARA NOVA VPS
# =====================================================
# Script para fazer upload da aplicação para a nova VPS
# Execute este script na máquina local
# =====================================================

VPS_IP="72.60.10.112"
VPS_USER="root"  # Altere para seu usuário
APP_DIR="/opt/digiurban2"

echo "====================================================="
echo "DIGIURBAN2 - UPLOAD PARA VPS $VPS_IP"
echo "====================================================="

# Verificar se rsync está instalado
if ! command -v rsync &> /dev/null; then
    echo "ERRO: rsync não encontrado. Instale com: sudo apt install rsync"
    exit 1
fi

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo "ERRO: $1"
        exit 1
    fi
}

echo "[1/5] Fazendo build da aplicação..."
npm run build
check_error "Falha no build da aplicação"

echo "[2/5] Criando diretório remoto..."
ssh $VPS_USER@$VPS_IP "sudo mkdir -p $APP_DIR && sudo chown -R $VPS_USER:$VPS_USER $APP_DIR"
check_error "Falha ao criar diretório remoto"

echo "[3/5] Fazendo upload dos arquivos da aplicação..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    --exclude 'super-admin/.env.local' \
    --exclude 'database-setup' \
    --exclude '*.log' \
    ./ $VPS_USER@$VPS_IP:$APP_DIR/
check_error "Falha no upload dos arquivos"

echo "[4/5] Copiando arquivo de environment para VPS..."
scp .env.nova_vps $VPS_USER@$VPS_IP:$APP_DIR/.env
check_error "Falha ao copiar arquivo .env"

echo "[5/5] Configurando permissões..."
ssh $VPS_USER@$VPS_IP "chmod +x $APP_DIR/deploy_nova_vps.sh"

echo ""
echo "====================================================="
echo "UPLOAD CONCLUÍDO!"
echo "====================================================="
echo ""
echo "Próximos passos:"
echo "1. Conectar na VPS: ssh $VPS_USER@$VPS_IP"
echo "2. Ir para o diretório: cd $APP_DIR"
echo "3. Executar setup: ./deploy_nova_vps.sh"
echo "4. Fazer build e subir: docker-compose up -d --build"
echo "5. Configurar SSL: sudo certbot --nginx -d digiurban.com.br"
echo ""
echo "Comandos úteis na VPS:"
echo "- Ver logs: docker-compose logs -f"
echo "- Parar: docker-compose down"
echo "- Reiniciar: docker-compose restart"
echo "====================================================="