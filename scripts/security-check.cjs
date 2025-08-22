#!/usr/bin/env node

// =====================================================
// SCRIPT DE VERIFICAÇÃO DE SEGURANÇA - DIGIURBAN2
// =====================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cores para output do console
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

console.log(`${colors.cyan}
=====================================================
🔐 DIGIURBAN2 - VERIFICAÇÃO DE SEGURANÇA
=====================================================${colors.reset}`);

let securityIssues = [];
let warnings = [];
let passed = [];

// =====================================================
// VERIFICAÇÕES DE SEGURANÇA
// =====================================================

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    passed.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    securityIssues.push(`❌ ${description}: ${filePath} não encontrado`);
    return false;
  }
}

function checkFileContainsSecrets(filePath, description) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Padrões que indicam segredos expostos
    const secretPatterns = [
      /eyJ[A-Za-z0-9_-]{10,}/, // JWT tokens
      /sk_[a-zA-Z0-9]{24,}/, // Stripe keys
      /pk_[a-zA-Z0-9]{24,}/, // Public keys
      /AKIA[0-9A-Z]{16}/, // AWS Access Keys
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, // UUIDs (potenciais chaves)
      /postgres:\/\/[^@]+:[^@]+@/, // Database URLs with credentials
      /mysql:\/\/[^@]+:[^@]+@/, // MySQL URLs with credentials
      /"password"\s*:\s*"[^"]{8,}"/, // Passwords in JSON
      /"secret"\s*:\s*"[^"]{10,}"/, // Secrets in JSON
    ];

    const lines = content.split('\n');
    let foundSecrets = false;

    lines.forEach((line, index) => {
      secretPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          securityIssues.push(`🚨 SEGREDO EXPOSTO em ${description} (linha ${index + 1}): ${line.substring(0, 50)}...`);
          foundSecrets = true;
        }
      });
    });

    if (!foundSecrets) {
      passed.push(`✅ ${description}: Nenhum segredo exposto detectado`);
    }

    return foundSecrets;
  } catch (error) {
    warnings.push(`⚠️ Erro ao verificar ${description}: ${error.message}`);
    return false;
  }
}

function checkGitignorePatterns() {
  const gitignorePath = '.gitignore';
  if (!fs.existsSync(gitignorePath)) {
    securityIssues.push('❌ .gitignore não encontrado');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = [
    '.env',
    '.env.local',
    '.env.production',
    '*.key',
    '*.pem',
    'credentials.json',
    'secrets/',
    'private/'
  ];

  requiredPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      passed.push(`✅ .gitignore inclui: ${pattern}`);
    } else {
      warnings.push(`⚠️ .gitignore deveria incluir: ${pattern}`);
    }
  });
}

function checkEnvironmentVariables() {
  const envExamplePath = '.env.example';
  const envPath = '.env';
  
  if (fs.existsSync(envPath)) {
    securityIssues.push('🚨 Arquivo .env encontrado no repositório - DEVE ser removido!');
    checkFileContainsSecrets(envPath, 'Arquivo .env');
  } else {
    passed.push('✅ Arquivo .env não está no repositório');
  }

  if (fs.existsSync(envExamplePath)) {
    if (checkFileContainsSecrets(envExamplePath, 'Arquivo .env.example')) {
      securityIssues.push('🚨 .env.example contém segredos reais!');
    } else {
      passed.push('✅ .env.example existe e não contém segredos');
    }
  } else {
    warnings.push('⚠️ .env.example não encontrado');
  }
}

function checkSourceCodeSecurity() {
  const srcFiles = [
    'src/integrations/supabase/client.ts',
    'src/lib/supabaseAdmin.ts',
    'src/lib/auth.ts',
    'src/hooks/useAuthV2.tsx'
  ];

  srcFiles.forEach(file => {
    if (fs.existsSync(file)) {
      checkFileContainsSecrets(file, `Código fonte: ${file}`);
    }
  });
}

function checkPackageJsonSecurity() {
  const packageJsonPath = 'package.json';
  if (!fs.existsSync(packageJsonPath)) {
    warnings.push('⚠️ package.json não encontrado');
    return;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Verificar dependências conhecidas por vulnerabilidades
    const vulnerableDeps = [
      'lodash', // Versões antigas têm vulnerabilidades
      'moment', // Descontinuado, usar date-fns
      'request' // Descontinuado
    ];

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    vulnerableDeps.forEach(dep => {
      if (allDeps[dep]) {
        warnings.push(`⚠️ Dependência potencialmente vulnerável: ${dep}`);
      }
    });

    // Verificar se há scripts suspeitos
    if (packageJson.scripts) {
      Object.entries(packageJson.scripts).forEach(([name, script]) => {
        if (typeof script === 'string' && (script.includes('curl') || script.includes('wget'))) {
          warnings.push(`⚠️ Script suspeito em package.json: ${name}`);
        }
      });
    }

    passed.push('✅ package.json verificado');
  } catch (error) {
    warnings.push(`⚠️ Erro ao verificar package.json: ${error.message}`);
  }
}

function generateSecurityReport() {
  const timestamp = new Date().toISOString();
  const reportPath = `security-report-${Date.now()}.json`;
  
  const report = {
    timestamp,
    summary: {
      critical_issues: securityIssues.length,
      warnings: warnings.length,
      passed_checks: passed.length,
      total_checks: securityIssues.length + warnings.length + passed.length
    },
    critical_issues: securityIssues,
    warnings,
    passed_checks: passed,
    recommendations: [
      'Remover arquivo .env do repositório se presente',
      'Regenerar todas as chaves de API expostas',
      'Implementar rotação automática de tokens',
      'Configurar rate limiting no backend',
      'Implementar monitoramento de segurança',
      'Executar audit npm/yarn regularmente'
    ]
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.blue}📄 Relatório salvo em: ${reportPath}${colors.reset}`);
  
  return report;
}

// =====================================================
// EXECUTAR VERIFICAÇÕES
// =====================================================

console.log(`${colors.yellow}🔍 Iniciando verificações de segurança...${colors.reset}\n`);

// Verificar arquivos críticos
checkFileExists('.gitignore', 'Arquivo .gitignore');
checkFileExists('src/integrations/supabase/client.ts', 'Cliente Supabase');
checkFileExists('src/lib/supabaseAdmin.ts', 'Cliente Admin Supabase');

// Verificar configurações
checkGitignorePatterns();
checkEnvironmentVariables();
checkSourceCodeSecurity();
checkPackageJsonSecurity();

// Gerar relatório
const report = generateSecurityReport();

// =====================================================
// EXIBIR RESULTADOS
// =====================================================

console.log(`${colors.red}
🚨 PROBLEMAS CRÍTICOS (${securityIssues.length}):
${'='.repeat(50)}${colors.reset}`);
securityIssues.forEach(issue => console.log(`${colors.red}${issue}${colors.reset}`));

console.log(`${colors.yellow}
⚠️  AVISOS (${warnings.length}):
${'='.repeat(50)}${colors.reset}`);
warnings.forEach(warning => console.log(`${colors.yellow}${warning}${colors.reset}`));

console.log(`${colors.green}
✅ VERIFICAÇÕES APROVADAS (${passed.length}):
${'='.repeat(50)}${colors.reset}`);
passed.forEach(check => console.log(`${colors.green}${check}${colors.reset}`));

// =====================================================
// RESULTADO FINAL
// =====================================================

console.log(`${colors.cyan}
=====================================================
📊 RESUMO DA AUDITORIA DE SEGURANÇA
=====================================================${colors.reset}`);

const score = (passed.length / (securityIssues.length + warnings.length + passed.length)) * 100;

console.log(`Score de Segurança: ${score.toFixed(1)}%`);
console.log(`Problemas Críticos: ${securityIssues.length}`);
console.log(`Avisos: ${warnings.length}`);
console.log(`Verificações Aprovadas: ${passed.length}`);

if (securityIssues.length === 0) {
  console.log(`${colors.green}
🎉 PARABÉNS! Nenhum problema crítico encontrado.
Continue executando verificações regulares.${colors.reset}`);
  process.exit(0);
} else {
  console.log(`${colors.red}
🚨 AÇÃO REQUERIDA! Foram encontrados ${securityIssues.length} problemas críticos.
Corrija imediatamente antes de fazer deploy em produção.${colors.reset}`);
  process.exit(1);
}