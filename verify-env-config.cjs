#!/usr/bin/env node

/**
 * =====================================================
 * VERIFICADOR DE CONFIGURAÇÃO DE AMBIENTE
 * =====================================================
 * Verifica se todas as variáveis de ambiente críticas
 * estão configuradas corretamente para o deploy.
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
    red: '\\033[0;31m',
    green: '\\033[0;32m',
    yellow: '\\033[1;33m',
    blue: '\\033[0;34m',
    nc: '\\033[0m'
};

function printStatus(message) {
    console.log(`${colors.blue}[INFO]${colors.nc} ${message}`);
}

function printSuccess(message) {
    console.log(`${colors.green}[SUCCESS]${colors.nc} ${message}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}[WARNING]${colors.nc} ${message}`);
}

function printError(message) {
    console.log(`${colors.red}[ERROR]${colors.nc} ${message}`);
}

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};
    
    content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return env;
}

function validateJWT(token, name) {
    if (!token) {
        printError(`${name} está vazio`);
        return false;
    }
    
    if (!token.startsWith('eyJ')) {
        printError(`${name} não parece ser um JWT válido (deve começar com 'eyJ')`);
        return false;
    }
    
    // Basic JWT structure check (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
        printError(`${name} não tem a estrutura JWT correta (deve ter 3 partes separadas por pontos)`);
        return false;
    }
    
    try {
        // Try to decode the header
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        if (!header.alg || !header.typ) {
            printError(`${name} não tem header JWT válido`);
            return false;
        }
        
        // Try to decode the payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (!payload.role) {
            printError(`${name} não contém role no payload`);
            return false;
        }
        
        printSuccess(`${name} é um JWT válido (role: ${payload.role})`);
        return true;
    } catch (error) {
        printError(`${name} não é um JWT válido: ${error.message}`);
        return false;
    }
}

function validateUrl(url, name) {
    if (!url) {
        printError(`${name} está vazio`);
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        if (!urlObj.protocol.startsWith('http')) {
            printError(`${name} deve usar protocolo HTTP/HTTPS`);
            return false;
        }
        
        printSuccess(`${name} é uma URL válida: ${url}`);
        return true;
    } catch (error) {
        printError(`${name} não é uma URL válida: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('\n🔍 Verificador de Configuração de Ambiente - DigiUrban2\n');
    
    // Check if required files exist
    const envFiles = ['.env', '.env.production'];
    const foundFiles = [];
    
    printStatus('Verificando arquivos de ambiente...');
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            foundFiles.push(file);
            printSuccess(`Encontrado: ${file}`);
        } else {
            printWarning(`Não encontrado: ${file}`);
        }
    });
    
    if (foundFiles.length === 0) {
        printError('Nenhum arquivo de ambiente encontrado!');
        printWarning('Crie pelo menos um arquivo .env ou .env.production');
        process.exit(1);
    }
    
    // Load and validate each found environment file
    let allValid = true;
    
    foundFiles.forEach(file => {
        console.log(`\n📋 Validando ${file}...`);
        const env = loadEnvFile(file);
        
        if (!env) {
            printError(`Não foi possível carregar ${file}`);
            allValid = false;
            return;
        }
        
        const requiredVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ];
        
        const missingVars = [];
        
        // Check required variables
        requiredVars.forEach(varName => {
            if (!env[varName]) {
                missingVars.push(varName);
            }
        });
        
        if (missingVars.length > 0) {
            printError(`Variáveis obrigatórias faltando em ${file}:`);
            missingVars.forEach(varName => {
                printError(`  - ${varName}`);
            });
            allValid = false;
        } else {
            printSuccess(`Todas as variáveis obrigatórias encontradas em ${file}`);
        }
        
        // Validate URLs
        if (env.VITE_SUPABASE_URL) {
            if (!validateUrl(env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')) {
                allValid = false;
            }
        }
        
        if (env.NEXT_PUBLIC_SUPABASE_URL) {
            if (!validateUrl(env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')) {
                allValid = false;
            }
        }
        
        // Validate JWT tokens
        if (env.VITE_SUPABASE_ANON_KEY) {
            if (!validateJWT(env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')) {
                allValid = false;
            }
        }
        
        if (env.SUPABASE_SERVICE_ROLE_KEY) {
            if (!validateJWT(env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')) {
                allValid = false;
            }
        }
        
        if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            if (!validateJWT(env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
                allValid = false;
            }
        }
        
        // Check for consistency between VITE_ and NEXT_PUBLIC_ variables
        if (env.VITE_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL) {
            if (env.VITE_SUPABASE_URL !== env.NEXT_PUBLIC_SUPABASE_URL) {
                printWarning('VITE_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_URL são diferentes');
                printWarning(`VITE: ${env.VITE_SUPABASE_URL}`);
                printWarning(`NEXT: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
            } else {
                printSuccess('URLs Supabase são consistentes');
            }
        }
        
        if (env.VITE_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            if (env.VITE_SUPABASE_ANON_KEY !== env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                printWarning('VITE_SUPABASE_ANON_KEY e NEXT_PUBLIC_SUPABASE_ANON_KEY são diferentes');
            } else {
                printSuccess('Chaves anônimas são consistentes');
            }
        }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (allValid) {
        printSuccess('✅ Todas as configurações estão válidas!');
        printSuccess('Você pode prosseguir com o deploy usando ./deploy-with-env.sh');
        process.exit(0);
    } else {
        printError('❌ Foram encontrados problemas na configuração');
        printWarning('Corrija os problemas acima antes de fazer o deploy');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { loadEnvFile, validateJWT, validateUrl };