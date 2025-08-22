#!/bin/bash

# =====================================================
# DIGIURBAN2 - DEPLOY PARA NOVA VPS 72.60.10.112
# =====================================================
# Script automatizado para deploy na nova VPS
# Execute este script na VPS de destino
# =====================================================

VPS_IP="72.60.10.112"
APP_NAME="digiurban2"
DOCKER_IMAGE="digiurban2:latest"
DOMAIN="digiurban.com.br"

echo "====================================================="
echo "DIGIURBAN2 - DEPLOY NA NOVA VPS $VPS_IP"
echo "====================================================="

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo "ERRO: $1"
        exit 1
    fi
}

# 1. Atualizar sistema
echo "[1/10] Atualizando sistema..."
sudo apt update && sudo apt upgrade -y
check_error "Falha ao atualizar sistema"

# 2. Instalar Docker
echo "[2/10] Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl start docker
    sudo systemctl enable docker
    check_error "Falha ao instalar Docker"
else
    echo "Docker já instalado"
fi

# 3. Instalar Docker Compose
echo "[3/10] Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    check_error "Falha ao instalar Docker Compose"
else
    echo "Docker Compose já instalado"
fi

# 4. Instalar Nginx
echo "[4/10] Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
    check_error "Falha ao instalar Nginx"
else
    echo "Nginx já instalado"
fi

# 5. Instalar Certbot para SSL
echo "[5/10] Instalando Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot python3-certbot-nginx -y
    check_error "Falha ao instalar Certbot"
else
    echo "Certbot já instalado"
fi

# 6. Configurar firewall
echo "[6/10] Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 7. Criar diretório da aplicação
echo "[7/10] Criando estrutura de diretórios..."
sudo mkdir -p /opt/$APP_NAME
sudo chown -R $USER:$USER /opt/$APP_NAME
cd /opt/$APP_NAME

# 8. Criar docker-compose.yml
echo "[8/10] Criando docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  digiurban2:
    build: .
    container_name: digiurban2-app
    restart: unless-stopped
    ports:
      - "3010:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - digiurban-network

networks:
  digiurban-network:
    driver: bridge
EOF

# 9. Configurar Nginx como proxy reverso
echo "[9/10] Configurando Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name digiurban.com.br www.digiurban.com.br;
    
    # SSL Configuration (será configurado pelo Certbot)
    # ssl_certificate /etc/letsencrypt/live/digiurban.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/digiurban.com.br/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy para container Docker DigiUrban2
    location / {
        proxy_pass http://127.0.0.1:3010;
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

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t
check_error "Erro na configuração do Nginx"
sudo systemctl reload nginx

echo "[10/10] Configuração inicial concluída!"
echo ""
echo "====================================================="
echo "PRÓXIMOS PASSOS MANUAIS:"
echo "====================================================="
echo "1. Fazer upload dos arquivos da aplicação para /opt/$APP_NAME"
echo "2. Configurar variáveis de ambiente (.env)"
echo "3. Executar: docker-compose up -d --build"
echo "4. Configurar SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "5. Verificar se o domínio está apontando para $VPS_IP"
echo ""
echo "Comandos úteis:"
echo "- Ver logs: docker-compose logs -f"
echo "- Rebuild: docker-compose down && docker-compose up -d --build"
echo "- Status: docker-compose ps"
echo "====================================================="