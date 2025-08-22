#!/usr/bin/env node

// =====================================================
// SCRIPT DE TESTE DE CONEXÃO SUPABASE - DIGIURBAN2
// =====================================================

const https = require('https');
const http = require('http');

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
🔗 TESTE DE CONEXÃO SUPABASE - DIGIURBAN2
=====================================================${colors.reset}`);

// Configurações da instância
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
        'User-Agent': 'DigiUrban-Test/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers CORS:`);
      
      // Verificar headers CORS
      const corsHeaders = {};
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('cors')) {
          corsHeaders[key] = res.headers[key];
          console.log(`     ${key}: ${res.headers[key]}`);
        }
      });

      // Verificar se há múltiplos valores no Access-Control-Allow-Origin
      const allowOrigin = res.headers['access-control-allow-origin'];
      if (allowOrigin && allowOrigin.includes(',')) {
        console.log(`${colors.red}   ❌ PROBLEMA: Múltiplos valores em Access-Control-Allow-Origin: ${allowOrigin}${colors.reset}`);
      } else if (allowOrigin) {
        console.log(`${colors.green}   ✅ Access-Control-Allow-Origin OK: ${allowOrigin}${colors.reset}`);
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          corsHeaders,
          data: data.substring(0, 200),
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
        'Origin': 'http://localhost:8082',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'apikey,authorization,content-type'
      }
    };

    const req = https.request(url, options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers CORS Preflight:`);
      
      Object.keys(res.headers).forEach(key => {
        if (key.toLowerCase().includes('access-control')) {
          console.log(`     ${key}: ${res.headers[key]}`);
        }
      });

      resolve({
        status: res.statusCode,
        headers: res.headers,
        success: res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      console.log(`${colors.red}   ❌ Erro: ${err.message}${colors.reset}`);
      resolve({ status: 0, error: err.message, success: false });
    });

    req.end();
  });
}

async function runTests() {
  console.log(`${colors.yellow}🧪 Iniciando testes de conexão...${colors.reset}\n`);

  // Testes básicos
  const tests = [
    { path: '/', description: 'Página principal' },
    { path: '/rest/v1/', description: 'API REST' },
    { path: '/auth/v1/', description: 'API Auth' },
    { path: '/rest/v1/tenants?select=id&limit=1', description: 'Consulta simples' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.description);
    results.push({ ...test, result });
    console.log('');
  }

  // Teste CORS Preflight
  console.log(`${colors.blue}🔄 Testando CORS Preflight...${colors.reset}`);
  const corsResult = await testCORSPreflight('/auth/v1/token');
  console.log('');

  // Resumo
  console.log(`${colors.cyan}📊 RESUMO DOS TESTES:${colors.reset}`);
  console.log('='.repeat(50));
  
  let successCount = 0;
  results.forEach(test => {
    const status = test.result.success ? '✅' : '❌';
    const statusCode = test.result.status || 'ERR';
    console.log(`${status} ${test.description}: ${statusCode}`);
    if (test.result.success) successCount++;
  });

  console.log(`\n${colors.cyan}🎯 DIAGNÓSTICO:${colors.reset}`);
  
  if (successCount === 0) {
    console.log(`${colors.red}❌ Servidor inacessível - Verifique URL e conectividade${colors.reset}`);
  } else if (successCount < results.length) {
    console.log(`${colors.yellow}⚠️ Alguns endpoints com problemas - Verifique configurações${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Todos os endpoints básicos funcionando${colors.reset}`);
  }

  // Verificar problema CORS específico
  const hasCorsIssues = results.some(test => 
    test.result.headers && 
    test.result.headers['access-control-allow-origin'] && 
    test.result.headers['access-control-allow-origin'].includes(',')
  );

  if (hasCorsIssues) {
    console.log(`${colors.red}🚨 PROBLEMA CORS DETECTADO: Headers duplicados${colors.reset}`);
    console.log(`${colors.yellow}💡 SOLUÇÕES RECOMENDADAS:${colors.reset}`);
    console.log(`   1. Verificar configuração do servidor Supabase`);
    console.log(`   2. Remover configurações CORS duplicadas`);
    console.log(`   3. Contactar administrador da instância`);
  }

  console.log(`\n${colors.cyan}📋 PRÓXIMOS PASSOS:${colors.reset}`);
  console.log(`   1. Se houver erro CORS, contacte o admin da instância Supabase`);
  console.log(`   2. Verifique se a URL ${SUPABASE_URL} está correta`);
  console.log(`   3. Confirme se as chaves de API estão válidas`);
  
  return {
    successCount,
    totalTests: results.length,
    hasCorsIssues,
    results
  };
}

// Executar testes
runTests().then(summary => {
  console.log(`\n${colors.cyan}🏁 TESTE CONCLUÍDO${colors.reset}`);
  process.exit(summary.hasCorsIssues ? 1 : 0);
}).catch(error => {
  console.error(`${colors.red}💥 Erro no script: ${error.message}${colors.reset}`);
  process.exit(1);
});