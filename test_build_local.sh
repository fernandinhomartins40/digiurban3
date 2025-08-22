#!/bin/bash

# =====================================================
# DIGIURBAN2 - TESTE DE BUILD LOCAL
# =====================================================
# Script para testar o build Docker localmente
# =====================================================

echo "====================================================="
echo "🧪 TESTANDO BUILD DOCKER LOCALMENTE"
echo "====================================================="

# Limpar containers e imagens antigas
echo "[1/4] 🧹 Limpando containers antigos..."
docker-compose down 2>/dev/null || true
docker rmi digiurban2:latest 2>/dev/null || true

echo "[2/4] 🔨 Fazendo build da imagem..."
if docker build -t digiurban2:latest .; then
    echo "✅ Build concluído com sucesso!"
else
    echo "❌ Falha no build!"
    exit 1
fi

echo "[3/4] 🚀 Testando container..."
if docker run -d --name test-digiurban2 -p 3002:80 digiurban2:latest; then
    echo "✅ Container iniciado!"
    
    # Aguardar alguns segundos
    echo "⏳ Aguardando aplicação inicializar..."
    sleep 5
    
    # Testar conectividade
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|301\|302"; then
        echo "✅ Aplicação respondendo em http://localhost:3002"
    else
        echo "⚠️  Aplicação não está respondendo"
        echo "Logs do container:"
        docker logs test-digiurban2
    fi
else
    echo "❌ Falha ao iniciar container!"
    exit 1
fi

echo "[4/4] 🧹 Limpando teste..."
docker stop test-digiurban2 2>/dev/null || true
docker rm test-digiurban2 2>/dev/null || true

echo ""
echo "====================================================="
echo "✅ TESTE CONCLUÍDO!"
echo "====================================================="
echo ""
echo "🚀 Para fazer deploy na VPS agora:"
echo "ssh root@72.60.10.108"
echo "curl -sSL https://raw.githubusercontent.com/fernandinhomartins40/digiurban2/main/deploy_rapido.sh | bash"