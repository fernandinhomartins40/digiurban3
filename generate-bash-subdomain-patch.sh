#!/bin/bash

# PATCH PARA GENERATE.BASH - SUPORTE A SUBDOMÍNIOS
# Arquivo: generate-bash-subdomain-patch.sh
# Este arquivo contém as modificações necessárias para suporte a subdomínios no generate.bash

echo "🔧 ============================================"
echo "🔧 PATCH PARA GENERATE.BASH - SUBDOMÍNIOS"
echo "🔧 ============================================"

# ============================================
# 1. DETECÇÃO DE MODO DE SUBDOMÍNIO
# ============================================

# Adicionar esta seção ANTES da configuração de URLs existente

echo "🌐 Verificando modo de configuração de URLs..."

# Verificar se deve usar subdomínios
if [ -n "$MANAGER_USE_SUBDOMAIN" ] && [ "$MANAGER_USE_SUBDOMAIN" = "true" ]; then
    if [ -n "$MANAGER_SUBDOMAIN" ] && [ -n "$MANAGER_DOMAIN_SUFFIX" ]; then
        echo "🌐 Modo SUBDOMÍNIO detectado"
        echo "🌐 Subdomínio: $MANAGER_SUBDOMAIN"
        echo "🌐 Domínio: $MANAGER_DOMAIN_SUFFIX"
        export URL_MODE="subdomain"
        export SUBDOMAIN_URL="https://${MANAGER_SUBDOMAIN}.${MANAGER_DOMAIN_SUFFIX}"
    else
        echo "⚠️  Modo subdomínio solicitado mas variáveis incompletas"
        echo "⚠️  MANAGER_SUBDOMAIN: $MANAGER_SUBDOMAIN"
        echo "⚠️  MANAGER_DOMAIN_SUFFIX: $MANAGER_DOMAIN_SUFFIX"
        echo "🔄 Fallback para modo IP:porta"
        export URL_MODE="ip_port"
    fi
else
    echo "🌐 Modo IP:PORTA (padrão)"
    export URL_MODE="ip_port"
fi

# ============================================
# 2. CONFIGURAÇÃO DE URLs BASEADA NO MODO
# ============================================

# SUBSTITUIR a seção existente de configuração de URLs por esta:

echo "🔧 Configurando URLs baseado no modo: $URL_MODE"

if [ "$URL_MODE" = "subdomain" ]; then
    # ====== MODO SUBDOMÍNIO ======
    echo "🌐 Configurando URLs com subdomínio: $SUBDOMAIN_URL"
    
    export API_EXTERNAL_URL="$SUBDOMAIN_URL"
    export SUPABASE_PUBLIC_URL="$SUBDOMAIN_URL"
    
    # SITE_URL deve apontar para o manager principal (não para a instância)
    export SITE_URL="https://ultrabase.com.br"
    
    # Logs de confirmação
    echo "✅ API_EXTERNAL_URL: $API_EXTERNAL_URL"
    echo "✅ SUPABASE_PUBLIC_URL: $SUPABASE_PUBLIC_URL"
    echo "✅ SITE_URL: $SITE_URL"
    
elif [ "$URL_MODE" = "ip_port" ]; then
    # ====== MODO IP:PORTA (COMPORTAMENTO ATUAL) ======
    echo "🌐 Configurando URLs com IP:porta"
    
    if [ -n "$MANAGER_EXTERNAL_IP" ]; then
        export API_EXTERNAL_URL="http://${MANAGER_EXTERNAL_IP}:${KONG_HTTP_PORT}"
        export SITE_URL="http://${MANAGER_EXTERNAL_IP}:3000"
        export SUPABASE_PUBLIC_URL="http://${MANAGER_EXTERNAL_IP}:${KONG_HTTP_PORT}"
    else
        export API_EXTERNAL_URL="http://0.0.0.0:${KONG_HTTP_PORT}"
        export SITE_URL="http://0.0.0.0:3000"
        export SUPABASE_PUBLIC_URL="http://0.0.0.0:${KONG_HTTP_PORT}"
    fi
    
    # Logs de confirmação
    echo "✅ API_EXTERNAL_URL: $API_EXTERNAL_URL"
    echo "✅ SUPABASE_PUBLIC_URL: $SUPABASE_PUBLIC_URL"
    echo "✅ SITE_URL: $SITE_URL"
    
else
    echo "❌ Modo de URL inválido: $URL_MODE"
    exit 1
fi

# ============================================
# 3. VALIDAÇÃO DAS URLs GERADAS
# ============================================

echo "🔍 Validando URLs configuradas..."

# Verificar se as URLs estão definidas
if [ -z "$API_EXTERNAL_URL" ] || [ -z "$SUPABASE_PUBLIC_URL" ]; then
    echo "❌ Erro: URLs não foram configuradas corretamente"
    echo "❌ API_EXTERNAL_URL: $API_EXTERNAL_URL"
    echo "❌ SUPABASE_PUBLIC_URL: $SUPABASE_PUBLIC_URL"
    exit 1
fi

# Verificar formato das URLs
if [[ "$API_EXTERNAL_URL" != http* ]]; then
    echo "❌ Erro: API_EXTERNAL_URL deve começar com http: $API_EXTERNAL_URL"
    exit 1
fi

echo "✅ URLs validadas com sucesso"

# ============================================
# 4. INFORMAÇÕES DE DEBUG
# ============================================

echo "📋 ============================================"
echo "📋 CONFIGURAÇÃO FINAL DE URLs"
echo "📋 ============================================"
echo "📋 Modo: $URL_MODE"
echo "📋 Instance ID: $INSTANCE_ID"
if [ "$URL_MODE" = "subdomain" ]; then
    echo "📋 Subdomínio: $MANAGER_SUBDOMAIN"
    echo "📋 Domínio completo: $SUBDOMAIN_URL"
fi
echo "📋 API URL: $API_EXTERNAL_URL"
echo "📋 Public URL: $SUPABASE_PUBLIC_URL"
echo "📋 Site URL: $SITE_URL"
echo "📋 Kong HTTP Port: $KONG_HTTP_PORT"
echo "📋 Kong HTTPS Port: $KONG_HTTPS_PORT"
echo "📋 ============================================"

# ============================================
# 5. CONTINUAÇÃO DO SCRIPT ORIGINAL
# ============================================

echo "🔧 Continuando com criação da instância..."

# Resto do script generate.bash continua normalmente...

# ============================================
# INSTRUÇÕES DE APLICAÇÃO
# ============================================

cat << 'EOF'

🔧 INSTRUÇÕES PARA APLICAR NO GENERATE.BASH:

1. Fazer backup do generate.bash original:
   cp generate.bash generate.bash.backup

2. Localizar a seção de configuração de URLs (procurar por "API_EXTERNAL_URL")

3. SUBSTITUIR toda a seção existente por este código

4. A seção original deve estar entre as linhas:
   # Set values for required variables...
   # até...
   # export SUPABASE_PUBLIC_URL=...

5. Manter o resto do script inalterado

6. Testar com uma nova instância

7. Verificar logs detalhados para debug

EOF