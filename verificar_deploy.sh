#!/bin/bash

# =====================================================
# DIGIURBAN2 - VERIFICAÇÃO DE DEPLOY
# =====================================================
# Script para verificar se o deploy foi bem-sucedido
# Execute na VPS após o deploy
# =====================================================

VPS_IP="72.60.10.108"
DOMAIN="digiurban.com.br"

echo "====================================================="
echo "DIGIURBAN2 - VERIFICAÇÃO DE DEPLOY"
echo "====================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar serviços
check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✓${NC} $1 está rodando"
    else
        echo -e "${RED}✗${NC} $1 não está rodando"
        return 1
    fi
}

# Função para verificar portas
check_port() {
    if netstat -tulpn | grep -q ":$1 "; then
        echo -e "${GREEN}✓${NC} Porta $1 está aberta"
    else
        echo -e "${RED}✗${NC} Porta $1 não está aberta"
        return 1
    fi
}

# Função para verificar URL
check_url() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓${NC} $1 está respondendo"
    else
        echo -e "${RED}✗${NC} $1 não está respondendo"
        return 1
    fi
}

echo ""
echo "1. VERIFICANDO SERVIÇOS BÁSICOS..."
check_service docker
check_service nginx

echo ""
echo "2. VERIFICANDO DOCKER CONTAINERS..."
if docker ps | grep -q "digiurban2-app"; then
    echo -e "${GREEN}✓${NC} Container DigiUrban2 está rodando"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep digiurban2
else
    echo -e "${RED}✗${NC} Container DigiUrban2 não está rodando"
fi

echo ""
echo "3. VERIFICANDO PORTAS..."
check_port 80
check_port 443
check_port 3002

echo ""
echo "4. VERIFICANDO CONECTIVIDADE..."
check_url "http://localhost:3002"
check_url "http://$VPS_IP"

if command -v dig &> /dev/null; then
    echo ""
    echo "5. VERIFICANDO DNS..."
    DNS_IP=$(dig +short $DOMAIN | tail -1)
    if [ "$DNS_IP" = "$VPS_IP" ]; then
        echo -e "${GREEN}✓${NC} DNS aponta para $VPS_IP"
    else
        echo -e "${YELLOW}!${NC} DNS aponta para $DNS_IP (esperado: $VPS_IP)"
    fi
fi

echo ""
echo "6. VERIFICANDO SSL..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo -e "${GREEN}✓${NC} Certificados SSL encontrados"
    echo "Validade do certificado:"
    openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null || echo "Erro ao ler certificado"
else
    echo -e "${YELLOW}!${NC} Certificados SSL não encontrados - execute: sudo certbot --nginx -d $DOMAIN"
fi

echo ""
echo "7. VERIFICANDO LOGS..."
echo "Últimas 5 linhas do log do container:"
docker-compose logs --tail=5 2>/dev/null || echo "Docker Compose não encontrado"

echo ""
echo "8. VERIFICANDO RECURSOS DO SISTEMA..."
echo "CPU e Memória:"
free -h | head -2
echo ""
echo "Espaço em disco:"
df -h / | tail -1

echo ""
echo "====================================================="
echo "RESUMO DA VERIFICAÇÃO"
echo "====================================================="

# Teste final
echo "Testando conectividade direta na porta 3002..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002" | grep -q "200\|301\|302"; then
    echo "✅ Aplicação respondendo na porta 3002"
fi

if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ DEPLOY FUNCIONANDO!${NC}"
    echo "Acesse: https://$DOMAIN"
else
    echo -e "${RED}✗ PROBLEMAS DETECTADOS${NC}"
    echo "Verifique os itens marcados com ✗ acima"
fi

echo ""
echo "Comandos úteis:"
echo "- Ver logs completos: docker-compose logs -f"
echo "- Reiniciar aplicação: docker-compose restart"
echo "- Ver status Nginx: sudo systemctl status nginx"
echo "- Configurar SSL: sudo certbot --nginx -d $DOMAIN"
echo "====================================================="