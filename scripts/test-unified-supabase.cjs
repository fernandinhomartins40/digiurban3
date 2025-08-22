#!/usr/bin/env node

/**
 * TESTE DA CONFIGURAÇÃO UNIFICADA SUPABASE - DIGIURBAN2
 * 
 * Este script testa se a nova configuração unificada está funcionando
 * corretamente em diferentes contextos.
 */

const https = require('https');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

console.log(`${colors.cyan}
=====================================================
🧪 TESTE CONFIGURAÇÃO UNIFICADA SUPABASE - DIGIURBAN2
=====================================================${colors.reset}`);

// Configuração da nova instância
const SUPABASE_URL = 'https://apidigiruban.com.br';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWluc3RhbmNlLW1hbmFnZXIiLCJpYXQiOjE3NTU2NDQ1NzAsImV4cCI6MTc4NzE4MDU3MH0._yAg0U_wQQthjB6G-_2h461SNj0WjuOvBo6JukLYmDA';

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = new URL(path, SUPABASE_URL);
    console.log(`${colors.blue}🔍 Testando: ${description}${colors.reset}`);
    console.log(`   URL: ${url.href}`);

    const options = {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DigiUrban-Unified-Test/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      console.log(`   Status: ${res.statusCode}`);
      
      // Verificar headers CORS
      const corsHeaders = {};
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('cors')) {
          corsHeaders[key] = res.headers[key];
        }
      });
      
      if (Object.keys(corsHeaders).length > 0) {
        console.log('   Headers CORS encontrados:');
        Object.entries(corsHeaders).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }

      // Verificar se há múltiplos valores no Access-Control-Allow-Origin
      const allowOrigin = res.headers['access-control-allow-origin'];
      if (allowOrigin) {
        if (allowOrigin.includes(',') || allowOrigin.includes('*,') || allowOrigin.includes(', *')) {
          console.log(`${colors.red}   ❌ PROBLEMA: Headers CORS duplicados detectados: ${allowOrigin}${colors.reset}`);
        } else {
          console.log(`${colors.green}   ✅ Headers CORS únicos: ${allowOrigin}${colors.reset}`);
        }
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          corsHeaders,
          hasData: data.length > 0,
          success: res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      console.log(`${colors.red}   ❌ Erro: ${err.message}${colors.reset}`);
      resolve({
        status: 0,
        error: err.message,
        success: false
      });
    });

    req.setTimeout(10000, () => {
      console.log(`${colors.yellow}   ⏰ Timeout${colors.reset}`);
      req.destroy();
      resolve({
        status: 0,
        error: 'Timeout',
        success: false
      });
    });

    req.end();
  });
}

async function testCORSPreflight(path) {
  return new Promise((resolve) => {
    const url = new URL(path, SUPABASE_URL);
    console.log(`${colors.blue}🔍 Testando CORS Preflight: ${path}${colors.reset}`);

    const options = {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://digiurban.com.br',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'apikey,authorization,content-type'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers CORS Preflight:`);
      
      let corsValid = true;
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          const value = res.headers[key];
          console.log(`     ${key}: ${value}`);
          
          // Verificar duplicação em preflight
          if (key.toLowerCase() === 'access-control-allow-origin' && 
              (value.includes(',') || value.includes('*,'))) {
            corsValid = false;
          }
        }
      });

      if (corsValid) {
        console.log(`${colors.green}   ✅ CORS Preflight OK${colors.reset}`);
      } else {
        console.log(`${colors.red}   ❌ CORS Preflight com problemas${colors.reset}`);
      }

      resolve({
        status: res.statusCode,
        headers: res.headers,
        corsValid,
        success: res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      console.log(`${colors.red}   ❌ Erro: ${err.message}${colors.reset}`);
      resolve({ status: 0, error: err.message, success: false, corsValid: false });
    });

    req.end();
  });
}

async function runTests() {
  console.log(`${colors.yellow}🧪 Iniciando testes da configuração unificada...${colors.reset}\n`);

  // Testes de endpoints básicos
  const tests = [
    { path: '/', description: 'Página principal Supabase' },
    { path: '/rest/v1/', description: 'API REST' },
    { path: '/auth/v1/', description: 'API Auth' },
    { path: '/health', description: 'Health Check' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    results.push({ ...test, result });
    console.log('');
  }

  // Teste CORS Preflight
  console.log(`${colors.blue}🔄 Testando CORS Preflight...${colors.reset}`);
  const corsResult = await testCORSPreflight('/rest/v1/');
  console.log('');

  // Resumo
  console.log(`${colors.cyan}📊 RESUMO DOS TESTES:${colors.reset}`);
  console.log('='.repeat(50));
  
  let successCount = 0;
  let corsIssues = 0;
  
  results.forEach(test => {
    const status = test.result.success ? '✅' : '❌';
    const statusCode = test.result.status || 'ERR';
    console.log(`${status} ${test.description}: ${statusCode}`);
    
    if (test.result.success) successCount++;
    
    // Verificar problemas CORS
    const origin = test.result.headers?.['access-control-allow-origin'];
    if (origin && (origin.includes(',') || origin.includes('*,'))) {
      corsIssues++;
    }
  });

  console.log(`\n${colors.cyan}🎯 DIAGNÓSTICO FINAL:${colors.reset}`);
  
  if (corsIssues > 0) {
    console.log(`${colors.red}🚨 CORS: ${corsIssues} endpoints com headers duplicados${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ CORS: Todos os headers únicos - problema resolvido!${colors.reset}`);
  }
  
  if (successCount === 0) {
    console.log(`${colors.red}❌ CONECTIVIDADE: Servidor inacessível${colors.reset}`);
  } else if (successCount < results.length) {
    console.log(`${colors.yellow}⚠️ CONECTIVIDADE: ${successCount}/${results.length} endpoints OK${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ CONECTIVIDADE: Todos os endpoints básicos funcionando${colors.reset}`);
  }

  // Status da configuração unificada
  console.log(`\n${colors.cyan}🔧 STATUS CONFIGURAÇÃO UNIFICADA:${colors.reset}`);
  
  if (corsIssues === 0 && successCount > 0) {
    console.log(`${colors.green}✅ Configuração unificada funcionando corretamente${colors.reset}`);
    console.log(`${colors.green}✅ Headers CORS únicos (problema original resolvido)${colors.reset}`);
    console.log(`${colors.green}✅ Nova instância Supabase operacional${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️ Configuração unificada implementada, mas há problemas residuais${colors.reset}`);
  }

  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS:${colors.reset}`);
  console.log(`   1. Testar aplicação completa no navegador`);
  console.log(`   2. Verificar logs no console do browser`);
  console.log(`   3. Monitorar performance da nova configuração`);
  console.log(`   4. Considerar depreciação dos arquivos antigos`);
  
  return {
    successCount,
    totalTests: results.length,
    corsIssues,
    results,
    unifiedConfigWorking: corsIssues === 0 && successCount > 0
  };
}

// Executar testes
runTests().then(summary => {
  console.log(`\n${colors.cyan}🏁 TESTE CONCLUÍDO${colors.reset}`);
  
  if (summary.unifiedConfigWorking) {
    console.log(`${colors.green}🎉 SUCESSO: Configuração unificada Supabase funcionando!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️ ATENÇÃO: Configuração implementada mas requer ajustes${colors.reset}`);
    process.exit(1);
  }
}).catch(error => {
  console.error(`${colors.red}💥 Erro no script: ${error.message}${colors.reset}`);
  process.exit(1);
});