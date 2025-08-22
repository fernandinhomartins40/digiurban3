#!/bin/bash

# Script para corrigir configuração CORS no Kong Gateway
# Problema: Kong pode estar adicionando headers CORS extras

echo "🔧 Verificando e corrigindo configuração CORS do Kong Gateway..."

# Verificar containers Supabase
echo "🔍 Verificando containers Supabase..."
docker ps | grep supabase | grep -E "(kong|rest|auth)" || echo "Containers não encontrados"

echo ""
echo "🔍 Verificando configuração atual do Kong..."

# Verificar se Kong tem plugins CORS ativos
echo "Plugins CORS no Kong:"
docker exec supabase-kong-a7c18a88 kong config | grep -i cors || echo "Nenhuma configuração CORS encontrada no Kong"

# Verificar logs do Kong para CORS
echo ""
echo "🔍 Verificando logs do Kong para CORS..."
docker logs supabase-kong-a7c18a88 2>&1 | grep -i cors | tail -5 || echo "Nenhum log CORS recente"

# Verificar configuração do Kong via API Admin
echo ""
echo "🔍 Verificando plugins via API Admin do Kong..."
docker exec supabase-kong-a7c18a88 curl -s http://localhost:8001/plugins | jq '.data[] | select(.name == "cors")' 2>/dev/null || echo "Não foi possível verificar plugins via API"

# Tentar resetar configuração CORS do Kong
echo ""
echo "🔧 Tentando resetar configuração CORS do Kong..."

# Reiniciar Kong para aplicar configuração limpa
echo "🔄 Reiniciando Kong Gateway..."
docker restart supabase-kong-a7c18a88

# Aguardar Kong ficar saudável
echo "⏳ Aguardando Kong ficar saudável..."
for i in {1..30}; do
    if docker exec supabase-kong-a7c18a88 curl -f -s http://localhost:8000/ >/dev/null 2>&1; then
        echo "✅ Kong está funcionando (tentativa $i)"
        break
    fi
    echo "⏳ Aguardando Kong... ($i/30)"
    sleep 2
done

# Verificar se outros containers dependentes estão OK
echo ""
echo "🔍 Verificando containers dependentes..."
docker ps | grep supabase | grep -E "(auth|rest|storage)" | while read line; do
    container_name=$(echo $line | awk '{print $NF}')
    echo "Verificando $container_name..."
    docker exec $container_name curl -f -s http://localhost:3000/ >/dev/null 2>&1 && echo "✅ $container_name OK" || echo "⚠️ $container_name pode precisar de restart"
done

# Testar CORS após reinicialização
echo ""
echo "🧪 Testando CORS após reinicialização do Kong..."
sleep 5

echo "Headers atuais (pós-restart):"
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token | grep -i "access-control" || echo "Aguardando propagação..."

echo ""
echo "🔍 Testando endpoint REST também..."
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/rest/v1/ | grep -i "access-control" || echo "Aguardando propagação..."

echo ""
echo "✅ Configuração Kong concluída!"
echo "📝 Se o problema persistir:"
echo "   1. Verifique se há múltiplas configurações CORS no .env da instância Supabase"
echo "   2. Considere recriar a instância Supabase com configuração limpa"
echo "   3. Monitore: docker logs -f supabase-kong-a7c18a88"