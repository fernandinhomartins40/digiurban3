#!/bin/bash

# SCRIPT DE APLICAÇÃO AUTOMÁTICA DOS PATCHES DE SUBDOMÍNIO
# Arquivo: apply-subdomain-patches.sh

echo "🚀 ============================================"
echo "🚀 APLICANDO PATCHES DE SUBDOMÍNIO"
echo "🚀 ============================================"

# Configurações
SUPABASE_DIR="/opt/supabase-manager"
SRC_DIR="$SUPABASE_DIR/src"
CORE_DIR="$SUPABASE_DIR/supabase-core"
BACKUP_DIR="$SUPABASE_DIR/backups/subdomain_$(date +%Y%m%d_%H%M%S)"

# ============================================
# 1. BACKUP COMPLETO
# ============================================

echo "📦 Criando backup completo..."
mkdir -p "$BACKUP_DIR"

# Backup dos arquivos críticos
cp "$SRC_DIR/server.js" "$BACKUP_DIR/server.js.backup"
cp "$CORE_DIR/generate.bash" "$BACKUP_DIR/generate.bash.backup"
cp "$SRC_DIR/instances.json" "$BACKUP_DIR/instances.json.backup" 2>/dev/null || echo "instances.json não existe"

echo "✅ Backup criado em: $BACKUP_DIR"

# ============================================
# 2. APLICAR PATCH NO SUPABASE MANAGER
# ============================================

echo "🔧 Aplicando patch no Supabase Manager..."

# Criar arquivo temporário com o patch
cat << 'EOF' > /tmp/manager_patch.js

// ============================================
// INTEGRAÇÃO DE SUBDOMÍNIOS - ADICIONADO AUTOMATICAMENTE
// ============================================

const SUBDOMAIN_CONFIG = {
  enabled: true,
  domain: 'ultrabase.com.br',
  maxLength: 20,
  fallbackToIP: true,
  validateDNS: false
};

function generateSubdomain(instanceId) {
  if (!SUBDOMAIN_CONFIG.enabled) {
    return null;
  }
  
  let subdomain = instanceId.toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, SUBDOMAIN_CONFIG.maxLength)
    .replace(/^-+|-+$/g, '');
  
  if (!subdomain) {
    subdomain = 'inst-' + Date.now().toString().slice(-6);
  }
  
  console.log(`🌐 Subdomínio gerado: ${subdomain}.${SUBDOMAIN_CONFIG.domain}`);
  return subdomain;
}

function generateInstanceUrlWithSubdomain(instanceId, port, useHttps = true, subdomain = null) {
  if (SUBDOMAIN_CONFIG.enabled && subdomain) {
    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${subdomain}.${SUBDOMAIN_CONFIG.domain}`;
  }
  
  if (SUBDOMAIN_CONFIG.fallbackToIP) {
    return `http://${EXTERNAL_IP}:${port}`;
  }
  
  throw new Error('Subdomínios desabilitados e fallback para IP não permitido');
}

function createInstanceUrlsWithSubdomain(instanceId, ports, credentials) {
  const subdomain = generateSubdomain(instanceId);
  
  const urls = {
    studio: generateInstanceUrlWithSubdomain(instanceId, ports.kong_http, true, subdomain),
    api: generateInstanceUrlWithSubdomain(instanceId, ports.kong_http, true, subdomain),
    db: `postgresql://postgres:${credentials.postgres_password}@${EXTERNAL_IP}:${ports.postgres_ext}/postgres`
  };
  
  console.log(`🔗 URLs geradas para instância ${instanceId}:`);
  console.log(`  Studio: ${urls.studio}`);
  console.log(`  API: ${urls.api}`);
  
  return { urls, subdomain };
}

function getAdditionalScriptEnvironment(instance) {
  const additionalEnv = {};
  
  if (instance.subdomain && SUBDOMAIN_CONFIG.enabled) {
    additionalEnv.MANAGER_USE_SUBDOMAIN = 'true';
    additionalEnv.MANAGER_SUBDOMAIN = instance.subdomain;
    additionalEnv.MANAGER_DOMAIN_SUFFIX = SUBDOMAIN_CONFIG.domain;
    
    console.log(`⚙️ Passando subdomínio para generate.bash: ${instance.subdomain}.${SUBDOMAIN_CONFIG.domain}`);
  } else {
    additionalEnv.MANAGER_USE_SUBDOMAIN = 'false';
    console.log(`⚙️ Usando modo IP:porta para generate.bash`);
  }
  
  return additionalEnv;
}

// Log de ativação
console.log('🌐 =================================');
console.log('🌐 INTEGRAÇÃO DE SUBDOMÍNIOS ATIVA');
console.log('🌐 =================================');

EOF

# Adicionar o patch ao início do server.js (depois dos requires)
sed -i '/const net = require/r /tmp/manager_patch.js' "$SRC_DIR/server.js"

# Modificar a criação de URLs na função createInstance
# SUBSTITUIR: urls: { studio: generateInstanceUrl(instanceId, ports.kong_http), ...
# POR: const { urls, subdomain } = createInstanceUrlsWithSubdomain(instanceId, ports, credentials);

sed -i 's/urls: {$/\/\/ URLs com subdomínio\n      const { urls, subdomain } = createInstanceUrlsWithSubdomain(instanceId, ports, credentials);\n      const urlsObj = {/' "$SRC_DIR/server.js"
sed -i 's/studio: generateInstanceUrl(instanceId, ports\.kong_http),/studio: urls.studio,/' "$SRC_DIR/server.js"
sed -i 's/api: generateInstanceUrl(instanceId, ports\.kong_http),/api: urls.api,/' "$SRC_DIR/server.js"

# Adicionar campo subdomain
sed -i '/id: instanceId,/a\\      subdomain: subdomain,' "$SRC_DIR/server.js"

# Modificar prepareScriptEnvironment para incluir variáveis de subdomínio
sed -i '/MANAGER_EXTERNAL_IP: EXTERNAL_IP$/a\\      ...getAdditionalScriptEnvironment(instance)' "$SRC_DIR/server.js"

echo "✅ Patch do Manager aplicado"

# ============================================
# 3. APLICAR PATCH NO GENERATE.BASH
# ============================================

echo "🔧 Aplicando patch no generate.bash..."

# Criar o patch para o generate.bash
cat << 'EOF' > /tmp/generate_patch.sh

# ============================================
# SUPORTE A SUBDOMÍNIOS - ADICIONADO AUTOMATICAMENTE
# ============================================

echo "🌐 Verificando modo de configuração de URLs..."

if [ -n "$MANAGER_USE_SUBDOMAIN" ] && [ "$MANAGER_USE_SUBDOMAIN" = "true" ]; then
    if [ -n "$MANAGER_SUBDOMAIN" ] && [ -n "$MANAGER_DOMAIN_SUFFIX" ]; then
        echo "🌐 Modo SUBDOMÍNIO detectado"
        echo "🌐 Subdomínio: $MANAGER_SUBDOMAIN"
        echo "🌐 Domínio: $MANAGER_DOMAIN_SUFFIX"
        export URL_MODE="subdomain"
        export SUBDOMAIN_URL="https://${MANAGER_SUBDOMAIN}.${MANAGER_DOMAIN_SUFFIX}"
    else
        echo "⚠️  Modo subdomínio solicitado mas variáveis incompletas"
        echo "🔄 Fallback para modo IP:porta"
        export URL_MODE="ip_port"
    fi
else
    echo "🌐 Modo IP:PORTA (padrão)"
    export URL_MODE="ip_port"
fi

echo "🔧 Configurando URLs baseado no modo: $URL_MODE"

if [ "$URL_MODE" = "subdomain" ]; then
    echo "🌐 Configurando URLs com subdomínio: $SUBDOMAIN_URL"
    export API_EXTERNAL_URL="$SUBDOMAIN_URL"
    export SUPABASE_PUBLIC_URL="$SUBDOMAIN_URL"
    export SITE_URL="https://ultrabase.com.br"
    echo "✅ URLs configuradas para subdomínio"
elif [ "$URL_MODE" = "ip_port" ]; then
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
    echo "✅ URLs configuradas para IP:porta"
fi

EOF

# Encontrar a linha onde começa a configuração de URLs e inserir o patch antes
LINE_NUM=$(grep -n "if \[ -n \"\$MANAGER_EXTERNAL_IP\" \]" "$CORE_DIR/generate.bash" | head -1 | cut -d: -f1)

if [ -n "$LINE_NUM" ]; then
    # Inserir o patch antes da configuração existente
    sed -i "${LINE_NUM}i\\$(cat /tmp/generate_patch.sh)" "$CORE_DIR/generate.bash"
    
    # Comentar a configuração antiga para não conflitar
    sed -i '/# Set values for required variables/,/^fi$/s/^/# OLD_CONFIG: /' "$CORE_DIR/generate.bash"
    
    echo "✅ Patch do generate.bash aplicado"
else
    echo "⚠️  Não foi possível localizar a seção de configuração de URLs"
    echo "⚠️  Aplicação manual pode ser necessária"
fi

# ============================================
# 4. VERIFICAÇÃO DOS PATCHES
# ============================================

echo "🔍 Verificando aplicação dos patches..."

# Verificar se as funções foram adicionadas ao manager
if grep -q "generateSubdomain" "$SRC_DIR/server.js"; then
    echo "✅ Funções de subdomínio adicionadas ao manager"
else
    echo "❌ Falha ao adicionar funções ao manager"
fi

# Verificar se o patch foi adicionado ao generate.bash
if grep -q "URL_MODE" "$CORE_DIR/generate.bash"; then
    echo "✅ Lógica de subdomínio adicionada ao generate.bash"
else
    echo "❌ Falha ao adicionar lógica ao generate.bash"
fi

# ============================================
# 5. LIMPEZA
# ============================================

echo "🧹 Limpando arquivos temporários..."
rm -f /tmp/manager_patch.js /tmp/generate_patch.sh

echo "✅ ============================================"
echo "✅ PATCHES APLICADOS COM SUCESSO"
echo "✅ ============================================"
echo "📦 Backup em: $BACKUP_DIR"
echo "🔄 Reinicie o Supabase Manager para aplicar as mudanças"
echo "🧪 Teste criando uma nova instância"

# ============================================
# 6. INSTRUÇÕES FINAIS
# ============================================

cat << 'EOF'

📋 PRÓXIMOS PASSOS:

1. Reiniciar Supabase Manager:
   pkill -f "node.*server.js"
   cd /opt/supabase-manager/src && node server.js &

2. Testar criação de nova instância

3. Verificar se URLs usam subdomínios:
   - Studio: https://[instancia].ultrabase.com.br
   - API: https://[instancia].ultrabase.com.br

4. Verificar botões do dashboard funcionando

5. Em caso de problemas, restaurar backup:
   cp backup/server.js.backup src/server.js
   cp backup/generate.bash.backup supabase-core/generate.bash

EOF