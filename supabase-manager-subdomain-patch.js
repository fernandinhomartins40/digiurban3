// PATCH PARA SUPABASE MANAGER - INTEGRAÇÃO DE SUBDOMÍNIOS
// Arquivo: supabase-manager-subdomain-patch.js
// Este arquivo contém as modificações necessárias para integrar subdomínios no fluxo de criação

// ============================================
// 1. CONFIGURAÇÃO DE SUBDOMÍNIOS
// ============================================

const SUBDOMAIN_CONFIG = {
  enabled: true,                    // Habilitar subdomínios
  domain: 'ultrabase.com.br',      // Domínio base
  maxLength: 20,                    // Tamanho máximo do subdomínio
  fallbackToIP: true,               // Usar IP:porta se subdomínio falhar
  validateDNS: false                // Validar DNS antes de usar
};

// ============================================
// 2. FUNÇÃO PARA GERAR SUBDOMÍNIO
// ============================================

/**
 * Gera subdomínio único e válido baseado no instanceId
 * @param {string} instanceId - ID da instância
 * @returns {string} - Subdomínio sanitizado
 */
function generateSubdomain(instanceId) {
  if (!SUBDOMAIN_CONFIG.enabled) {
    return null;
  }
  
  // Sanitizar ID para subdomínio válido (apenas letras, números e hífen)
  let subdomain = instanceId.toLowerCase()
    .replace(/[^a-z0-9-]/g, '')    // Remove caracteres inválidos
    .substring(0, SUBDOMAIN_CONFIG.maxLength)  // Limita tamanho
    .replace(/^-+|-+$/g, '');      // Remove hífens do início/fim
  
  // Garantir que não está vazio
  if (!subdomain) {
    subdomain = 'inst-' + Date.now().toString().slice(-6);
  }
  
  console.log(`🌐 Subdomínio gerado: ${subdomain}.${SUBDOMAIN_CONFIG.domain}`);
  return subdomain;
}

// ============================================
// 3. FUNÇÃO PARA GERAR URLs COM SUBDOMÍNIO
// ============================================

/**
 * Gera URLs usando subdomínio ou fallback para IP:porta
 * @param {string} instanceId - ID da instância
 * @param {number} port - Porta da instância
 * @param {boolean} useHttps - Usar HTTPS (default: true)
 * @param {string} subdomain - Subdomínio específico (opcional)
 * @returns {string} - URL completa
 */
function generateInstanceUrlWithSubdomain(instanceId, port, useHttps = true, subdomain = null) {
  // Se subdomínios estão habilitados e temos um subdomínio
  if (SUBDOMAIN_CONFIG.enabled && subdomain) {
    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${subdomain}.${SUBDOMAIN_CONFIG.domain}`;
  }
  
  // Fallback para IP:porta (comportamento atual)
  if (SUBDOMAIN_CONFIG.fallbackToIP) {
    return `http://${EXTERNAL_IP}:${port}`;
  }
  
  // Se não pode fazer fallback, retorna erro
  throw new Error('Subdomínios desabilitados e fallback para IP não permitido');
}

// ============================================
// 4. MODIFICAÇÃO NA FUNÇÃO createInstance
// ============================================

/**
 * SUBSTITUIR a seção de criação de URLs na função createInstance
 * 
 * ANTES:
 * urls: {
 *   studio: generateInstanceUrl(instanceId, ports.kong_http),
 *   api: generateInstanceUrl(instanceId, ports.kong_http),
 *   db: `postgresql://postgres:${credentials.postgres_password}@${EXTERNAL_IP}:${ports.postgres_ext}/postgres`
 * }
 * 
 * DEPOIS:
 */
function createInstanceUrlsWithSubdomain(instanceId, ports, credentials) {
  // Gerar subdomínio para esta instância
  const subdomain = generateSubdomain(instanceId);
  
  const urls = {
    studio: generateInstanceUrlWithSubdomain(instanceId, ports.kong_http, true, subdomain),
    api: generateInstanceUrlWithSubdomain(instanceId, ports.kong_http, true, subdomain),
    db: `postgresql://postgres:${credentials.postgres_password}@${EXTERNAL_IP}:${ports.postgres_ext}/postgres`
  };
  
  console.log(`🔗 URLs geradas para instância ${instanceId}:`);
  console.log(`  Studio: ${urls.studio}`);
  console.log(`  API: ${urls.api}`);
  console.log(`  DB: ${urls.db}`);
  
  return { urls, subdomain };
}

// ============================================
// 5. MODIFICAÇÃO NA FUNÇÃO prepareScriptEnvironment
// ============================================

/**
 * ADICIONAR estas variáveis ao return da função prepareScriptEnvironment
 */
function getAdditionalScriptEnvironment(instance) {
  const additionalEnv = {};
  
  // Se a instância tem subdomínio, passar para o script
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

// ============================================
// 6. INTEGRAÇÃO NO CÓDIGO EXISTENTE
// ============================================

/*
INSTRUÇÕES PARA APLICAR NO server.js:

1. Adicionar configuração SUBDOMAIN_CONFIG após as outras configurações

2. Adicionar as funções generateSubdomain() e generateInstanceUrlWithSubdomain()

3. Na função createInstance(), SUBSTITUIR a criação de URLs:
   
   ANTES:
   const instance = {
     id: instanceId,
     // ... outros campos ...
     urls: {
       studio: generateInstanceUrl(instanceId, ports.kong_http),
       api: generateInstanceUrl(instanceId, ports.kong_http),
       db: `postgresql://...`
     }
   };
   
   DEPOIS:
   const { urls, subdomain } = createInstanceUrlsWithSubdomain(instanceId, ports, credentials);
   const instance = {
     id: instanceId,
     subdomain: subdomain,  // NOVO CAMPO
     // ... outros campos ...
     urls: urls
   };

4. Na função prepareScriptEnvironment(), ADICIONAR ao return:
   
   return {
     // ... variáveis existentes ...
     ...getAdditionalScriptEnvironment(instance)
   };

5. Testar criação de nova instância
*/

// ============================================
// 7. LOGS DE DEBUG
// ============================================

function logSubdomainImplementation() {
  console.log('🌐 =================================');
  console.log('🌐 INTEGRAÇÃO DE SUBDOMÍNIOS ATIVA');
  console.log('🌐 =================================');
  console.log(`🌐 Domínio base: ${SUBDOMAIN_CONFIG.domain}`);
  console.log(`🌐 Subdomínios habilitados: ${SUBDOMAIN_CONFIG.enabled}`);
  console.log(`🌐 Fallback para IP: ${SUBDOMAIN_CONFIG.fallbackToIP}`);
  console.log('🌐 =================================');
}

module.exports = {
  SUBDOMAIN_CONFIG,
  generateSubdomain,
  generateInstanceUrlWithSubdomain,
  createInstanceUrlsWithSubdomain,
  getAdditionalScriptEnvironment,
  logSubdomainImplementation
};