// ====================================================================
// 🔍 EXTRATOR DE SCHEMA USANDO API REST
// ====================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuração do Supabase
const supabaseUrl = 'https://warbeochfoabfptvvtpu.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcmJlb2NoZm9hYmZwdHZ2dHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUzMzk5MSwiZXhwIjoyMDcxMTA5OTkxfQ.EfuTEme81CQGXxhSFVFMBkvU4HkwlQ8le24AHUh8Jho'

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Diretório de saída
const outputDir = 'supabase/sql_dump'

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🚀 Iniciando extração do schema via API REST...\n')

async function extractTables() {
  try {
    console.log('📋 Extraindo lista de tabelas...')
    
    // Tentar usar a API REST para obter metadados
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const apiInfo = await response.text()
    console.log('✅ Conexão estabelecida com a API')
    
    // Vamos extrair informações das tabelas que sabemos que existem
    const knownTables = [
      'tenants',
      'user_profiles', 
      'secretarias',
      'protocolos'
    ]
    
    const schemaInfo = {
      extraction_date: new Date().toISOString(),
      database_url: supabaseUrl,
      tables: {}
    }
    
    for (const tableName of knownTables) {
      try {
        console.log(`📊 Extraindo estrutura da tabela: ${tableName}`)
        
        // Tentar obter dados da tabela (limitado) para ver estrutura
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`⚠️ Erro ao acessar ${tableName}:`, error.message)
          schemaInfo.tables[tableName] = {
            error: error.message,
            accessible: false
          }
        } else {
          console.log(`✅ Tabela ${tableName} acessível`)
          schemaInfo.tables[tableName] = {
            accessible: true,
            sample_data: data,
            columns: data && data.length > 0 ? Object.keys(data[0]) : []
          }
        }
        
      } catch (err) {
        console.log(`❌ Erro na tabela ${tableName}:`, err.message)
        schemaInfo.tables[tableName] = {
          error: err.message,
          accessible: false
        }
      }
    }
    
    // Salvar informações coletadas
    fs.writeFileSync(
      path.join(outputDir, '01_schema_info.json'),
      JSON.stringify(schemaInfo, null, 2)
    )
    
    console.log('\n✅ Informações do schema extraídas!')
    return schemaInfo
    
  } catch (error) {
    console.error('❌ Erro na extração:', error)
    return null
  }
}

async function extractFromMigrations() {
  try {
    console.log('\n📁 Lendo arquivos de migração locais...')
    
    const migrationsDir = 'supabase/migrations'
    const schemaCompleto = {}
    
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
      
      for (const file of files) {
        if (file.endsWith('.sql')) {
          console.log(`📄 Lendo: ${file}`)
          const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
          
          // Copiar para sql_dump
          fs.writeFileSync(
            path.join(outputDir, `migration_${file}`),
            content
          )
          
          schemaCompleto[file] = {
            size: content.length,
            lines: content.split('\n').length,
            content: content.substring(0, 1000) + '...' // Primeiro KB
          }
        }
      }
    }
    
    fs.writeFileSync(
      path.join(outputDir, '02_migrations_summary.json'),
      JSON.stringify(schemaCompleto, null, 2)
    )
    
    console.log('✅ Migrações processadas!')
    
  } catch (error) {
    console.error('❌ Erro ao processar migrações:', error)
  }
}

async function createConsolidatedSchema() {
  try {
    console.log('\n📋 Criando schema consolidado...')
    
    const schemaContent = `-- ====================================================================
-- SCHEMA COMPLETO DO DIGIURBAN2 - BACKUP EXTRAÍDO
-- ====================================================================
-- Data de extração: ${new Date().toISOString()}
-- Projeto: warbeochfoabfptvvtpu
-- URL: ${supabaseUrl}
-- ====================================================================

-- Este arquivo foi gerado automaticamente através da extração do banco
-- Contém a estrutura principal conhecida do sistema DigiUrban2

-- EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- TIPOS ENUM CONHECIDOS
CREATE TYPE status_base_enum AS ENUM ('ativo', 'inativo', 'pendente', 'suspenso');
CREATE TYPE status_tenant_enum AS ENUM ('ativo', 'suspenso', 'cancelado', 'trial');
CREATE TYPE status_processo_enum AS ENUM ('aberto', 'em_andamento', 'aguardando_documentos', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'concluido', 'cancelado', 'suspenso', 'em_revisao');
CREATE TYPE status_agendamento_enum AS ENUM ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu', 'reagendado');
CREATE TYPE prioridade_enum AS ENUM ('baixa', 'media', 'alta', 'urgente', 'critica');
CREATE TYPE user_tipo_enum AS ENUM ('super_admin', 'admin', 'secretario', 'diretor', 'coordenador', 'supervisor', 'operador', 'cidadao');
CREATE TYPE tenant_plano_enum AS ENUM ('starter', 'professional', 'enterprise');

-- TABELAS PRINCIPAIS
-- (As definições completas estão nos arquivos de migração)

-- NOTA: Para o schema completo e detalhado, consulte os arquivos:
-- - migration_*.sql (definições completas das tabelas)
-- - *_info.json (metadados extraídos)

-- ====================================================================
-- FIM DO SCHEMA CONSOLIDADO
-- ====================================================================
`
    
    fs.writeFileSync(
      path.join(outputDir, 'schema_completo_consolidado.sql'),
      schemaContent
    )
    
    console.log('✅ Schema consolidado criado!')
    
  } catch (error) {
    console.error('❌ Erro ao criar schema consolidado:', error)
  }
}

// ====================================================================
// EXECUTAR EXTRAÇÃO COMPLETA
// ====================================================================
async function runExtraction() {
  console.log('🚀 Iniciando extração completa do schema DigiUrban2\n')
  
  // 1. Extrair via API
  await extractTables()
  
  // 2. Processar migrações locais
  await extractFromMigrations()
  
  // 3. Criar schema consolidado
  await createConsolidatedSchema()
  
  console.log('\n🎉 Extração completa finalizada!')
  console.log(`📁 Todos os arquivos salvos em: ${outputDir}/`)
  console.log('\n📋 Arquivos gerados:')
  console.log('   - 01_schema_info.json (metadados das tabelas)')
  console.log('   - 02_migrations_summary.json (resumo das migrações)')
  console.log('   - migration_*.sql (arquivos de migração copiados)')
  console.log('   - schema_completo_consolidado.sql (schema principal)')
}

runExtraction().catch(console.error)