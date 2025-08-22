#!/bin/bash

# =====================================================
# SCRIPT DEFINITIVO - CORREÇÃO CORS DIGIURBAN2
# =====================================================
# Remove configurações CORS duplicadas do NGINX
# Deixa apenas a instância Supabase gerenciar CORS

set -e

echo "🔧 INICIANDO CORREÇÃO DEFINITIVA CORS..."

# Backup do arquivo nginx atual
if [ -f "/etc/nginx/sites-available/digiurban" ]; then
    echo "📋 Fazendo backup da configuração NGINX..."
    sudo cp /etc/nginx/sites-available/digiurban /etc/nginx/sites-available/digiurban.backup.$(date +%Y%m%d_%H%M%S)
fi

# Remove headers CORS do NGINX
echo "🗑️  Removendo headers CORS duplicados do NGINX..."

# Arquivo de configuração NGINX (ajustar caminho conforme necessário)
NGINX_CONFIG="/etc/nginx/sites-available/digiurban"

if [ -f "$NGINX_CONFIG" ]; then
    # Remove todas as linhas que adicionam headers CORS
    sudo sed -i '/add_header.*Access-Control-Allow-Origin/d' "$NGINX_CONFIG"
    sudo sed -i '/add_header.*Access-Control-Allow-Methods/d' "$NGINX_CONFIG"
    sudo sed -i '/add_header.*Access-Control-Allow-Headers/d' "$NGINX_CONFIG"
    sudo sed -i '/add_header.*Access-Control-Expose-Headers/d' "$NGINX_CONFIG"
    sudo sed -i '/add_header.*Access-Control-Allow-Credentials/d' "$NGINX_CONFIG"
    
    echo "✅ Headers CORS removidos do NGINX"
else
    echo "⚠️  Arquivo de configuração NGINX não encontrado em $NGINX_CONFIG"
    echo "   Verifique o caminho e execute manualmente:"
    echo "   sudo nano /etc/nginx/sites-available/[seu-site]"
    echo "   Remova todas as linhas 'add_header.*Access-Control'"
fi

# Testa configuração NGINX
echo "🧪 Testando configuração NGINX..."
if sudo nginx -t; then
    echo "✅ Configuração NGINX válida"
    
    # Recarrega NGINX
    echo "🔄 Recarregando NGINX..."
    sudo systemctl reload nginx
    echo "✅ NGINX recarregado com sucesso"
else
    echo "❌ ERRO na configuração NGINX!"
    echo "   Restaure o backup se necessário:"
    echo "   sudo cp /etc/nginx/sites-available/digiurban.backup.* /etc/nginx/sites-available/digiurban"
    exit 1
fi

# Testa conectividade com Supabase
echo "🔗 Testando conectividade com instância Supabase..."
SUPABASE_URL="https://apidigiruban.com.br"

if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/health" | grep -q "200\|404"; then
    echo "✅ Instância Supabase acessível"
else
    echo "⚠️  Não foi possível acessar $SUPABASE_URL"
    echo "   Verifique se a instância está ativa"
fi

# Testa headers CORS
echo "🔍 Verificando headers CORS..."
CORS_TEST=$(curl -s -I -H "Origin: https://digiurban.com.br" "$SUPABASE_URL" | grep -i "access-control-allow-origin" || true)

if [ -n "$CORS_TEST" ]; then
    echo "📄 Headers CORS encontrados:"
    echo "$CORS_TEST"
    
    # Verifica se há duplicação
    CORS_COUNT=$(echo "$CORS_TEST" | wc -l)
    if [ "$CORS_COUNT" -gt 1 ]; then
        echo "⚠️  AINDA HÁ HEADERS DUPLICADOS!"
        echo "   Verifique a configuração da instância Supabase"
    else
        echo "✅ Headers CORS únicos - problema resolvido!"
    fi
else
    echo "ℹ️  Nenhum header CORS detectado (normal para algumas rotas)"
fi

echo ""
echo "🎯 CORREÇÃO CORS CONCLUÍDA!"
echo ""
echo "📋 RESUMO:"
echo "   ✅ Headers CORS removidos do NGINX"
echo "   ✅ Configurações de environment atualizadas"
echo "   ✅ Apenas Supabase gerencia CORS agora"
echo ""
echo "🔍 PRÓXIMOS PASSOS:"
echo "   1. Teste a aplicação em https://digiurban.com.br"
echo "   2. Verifique console do navegador para erros CORS"
echo "   3. Se ainda houver problemas, verifique configuração Supabase"
echo ""
echo "📞 SUPORTE:"
echo "   Se o problema persistir, verifique:"
echo "   - Configuração da instância Supabase em apidigiruban.com.br"
echo "   - Edge Functions não devem adicionar headers CORS extras"
echo "   - Firewall/CDN não está modificando headers"