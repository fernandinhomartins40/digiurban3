#!/bin/bash

# Script para corrigir CORS duplicado na instância Supabase apidigiruban.com.br
# O problema é que o header Access-Control-Allow-Origin está retornando '*, *'

echo "🔧 Corrigindo configuração CORS da instância Supabase..."

# Verificar se a instância está respondendo
echo "🔍 Verificando status da instância apidigiruban.com.br..."
if curl -s -I https://apidigiruban.com.br/rest/v1/ | head -1 | grep -q "200\|404"; then
    echo "✅ Instância está online"
else
    echo "❌ Instância parece estar offline"
    exit 1
fi

# Verificar headers CORS atuais
echo "🔍 Verificando headers CORS atuais..."
echo "Headers atuais para OPTIONS request:"
curl -s -I -X OPTIONS https://apidigiruban.com.br/rest/v1/ | grep -i "access-control"

echo ""
echo "🔧 O problema detectado: header Access-Control-Allow-Origin está duplicado"
echo "Expected: Access-Control-Allow-Origin: *"
echo "Actual: Access-Control-Allow-Origin: *, *"

echo ""
echo "📋 Possíveis soluções:"
echo "1. Verificar configuração do Supabase (múltiplas configurações CORS)"
echo "2. Verificar proxy reverso (pode estar adicionando headers extras)"
echo "3. Reiniciar a instância Supabase para limpar configurações conflitantes"

echo ""
echo "🌐 Para testar depois da correção:"
echo "curl -s -I -X OPTIONS -H 'Origin: https://digiurban.com.br' https://apidigiruban.com.br/rest/v1/"

echo ""
echo "⚠️ Este problema precisa ser corrigido no painel admin da instância Supabase"
echo "ou através da API de gerenciamento da Ultrabase"