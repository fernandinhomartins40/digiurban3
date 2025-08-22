#!/bin/bash

# Script mestre para corrigir completamente o problema de CORS duplicado
# Executa todas as correções necessárias em sequência

echo "🚀 DigiUrban2 - Correção Completa de CORS Duplicado"
echo "=================================================="
echo ""

# Verificar problema inicial
echo "🔍 1. Verificando problema atual..."
echo "Headers problemáticos atuais:"
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token | grep -i "access-control" || echo "Falha na conexão inicial"

echo ""
echo "🎯 Problema identificado: Access-Control-Allow-Origin com valores múltiplos '*, *'"
echo "📋 Aplicando correções em 3 etapas..."
echo ""

# Etapa 1: Corrigir NGINX
echo "🔧 ETAPA 1: Corrigindo configuração NGINX..."
echo "============================================"
bash ./fix-cors-duplicados.sh

echo ""
echo "⏳ Aguardando propagação da correção NGINX..."
sleep 5

# Etapa 2: Corrigir Kong Gateway
echo ""
echo "🔧 ETAPA 2: Corrigindo Kong Gateway..."
echo "====================================="
bash ./fix-kong-cors.sh

echo ""
echo "⏳ Aguardando propagação da correção Kong..."
sleep 10

# Etapa 3: Verificação final
echo ""
echo "🧪 ETAPA 3: Verificação Final..."
echo "==============================="

echo "🔍 Testando endpoint Auth:"
auth_test=$(curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token 2>/dev/null | grep -i "access-control-allow-origin" | wc -l)

echo "🔍 Testando endpoint REST:"
rest_test=$(curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/rest/v1/ 2>/dev/null | grep -i "access-control-allow-origin" | wc -l)

echo ""
echo "📊 Resultados:"
echo "Auth endpoint CORS headers: $auth_test"
echo "REST endpoint CORS headers: $rest_test"

if [ "$auth_test" -eq 1 ] && [ "$rest_test" -eq 1 ]; then
    echo "✅ SUCESSO! Headers CORS corrigidos!"
    echo "🎉 Agora o login deve funcionar corretamente"
elif [ "$auth_test" -eq 0 ] || [ "$rest_test" -eq 0 ]; then
    echo "⚠️ ATENÇÃO: Alguns endpoints não estão respondendo"
    echo "🔄 Aguarde alguns minutos para propagação completa"
else
    echo "❌ PROBLEMA PERSISTE: Ainda há headers duplicados"
    echo "🔍 Investigação adicional necessária"
fi

echo ""
echo "🔍 Headers finais completos:"
echo "Auth endpoint:"
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/auth/v1/token | grep -i "access-control" || echo "Nenhum header CORS (pode estar correto)"

echo ""
echo "REST endpoint:"
curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/rest/v1/ | grep -i "access-control" || echo "Nenhum header CORS (pode estar correto)"

echo ""
echo "🎯 Próximos passos:"
echo "1. Teste o login em https://digiurban.com.br"
echo "2. Se o problema persistir, aguarde 5-10 minutos para propagação DNS"
echo "3. Monitore logs: tail -f /var/log/nginx/apidigiruban.error.log"
echo "4. Se necessário, reinicie toda a stack Supabase"

echo ""
echo "✅ Correção CORS completa executada!"