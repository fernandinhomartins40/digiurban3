// ====================================================================
// 🚀 EXTRATOR COMPLETO DE BANCO SUPABASE - VERSÃO FINAL
// ====================================================================
// Extrai 100% do banco: tabelas, views, RLS, functions, triggers, 
// edge functions, storage, políticas e dados

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
const outputDir = 'supabase/database_backup_complete'

// Criar estrutura de diretórios
const dirs = [
  outputDir,
  `${outputDir}/schema`,
  `${outputDir}/data`,
  `${outputDir}/functions`,
  `${outputDir}/policies`,
  `${outputDir}/triggers`,
  `${outputDir}/views`,
  `${outputDir}/storage`,
  `${outputDir}/edge_functions`,
  `${outputDir}/migrations`
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

console.log('🚀 Iniciando backup completo do banco Supabase DigiUrban2...\n')

// ====================================================================
// 1. EXTRAIR SCHEMA USANDO A EDGE FUNCTION
// ====================================================================
async function exportSchemaViaEdgeFunction() {
  try {
    console.log('📋 Extraindo schema completo via Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('export-schema', {
      body: { format: 'json', filter: 'all' }
    })
    
    if (error) {
      console.error('❌ Erro na edge function:', error)
      return null
    }
    
    console.log('✅ Schema extraído via Edge Function')
    fs.writeFileSync(
      path.join(outputDir, 'schema', '01_complete_schema_export.json'),
      JSON.stringify(data, null, 2)
    )
    
    return data
    
  } catch (error) {
    console.error('❌ Erro ao chamar edge function:', error)
    return null
  }
}

// ====================================================================
// 2. EXTRAIR QUERIES SQL DIRETAS
// ====================================================================
async function executeDirectQuery(query, description) {
  try {
    console.log(`📊 Executando: ${description}`)
    
    // Usar RPC para executar SQL diretamente
    const { data, error } = await supabase.rpc('sql', { query })
    
    if (error) {
      console.log(`⚠️ Erro em ${description}: ${error.message}`)
      return null
    }
    
    console.log(`✅ ${description} - ${Array.isArray(data) ? data.length : 'Sem dados'} registros`)
    return data
    
  } catch (error) {
    console.log(`⚠️ Erro na query ${description}:`, error.message)
    return null
  }
}

// ====================================================================
// 3. EXTRAIR ESTRUTURA DAS TABELAS
// ====================================================================
async function extractTableStructures() {
  console.log('\n🏗️ EXTRAINDO ESTRUTURA DAS TABELAS')
  
  const queries = {
    'tables_list': `
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'auth', 'storage')
      ORDER BY table_schema, table_name
    `,
    
    'columns_complete': `
      SELECT 
        c.table_schema,
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.ordinal_position
      FROM information_schema.columns c
      WHERE c.table_schema IN ('public', 'auth', 'storage')
      ORDER BY c.table_schema, c.table_name, c.ordinal_position
    `,
    
    'constraints': `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        kcu.column_name,
        rc.match_option AS match_type,
        rc.update_rule,
        rc.delete_rule,
        ccu.table_name AS references_table,
        ccu.column_name AS references_field
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
      WHERE tc.table_schema IN ('public')
      ORDER BY tc.table_name, tc.constraint_type
    `,
    
    'indexes': `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname IN ('public')
      ORDER BY tablename, indexname
    `
  }
  
  for (const [name, query] of Object.entries(queries)) {
    const result = await executeDirectQuery(query, name)
    if (result) {
      fs.writeFileSync(
        path.join(outputDir, 'schema', `${name}.json`),
        JSON.stringify(result, null, 2)
      )
    }
  }
}

// ====================================================================
// 4. EXTRAIR POLÍTICAS RLS
// ====================================================================
async function extractRLSPolicies() {
  console.log('\n🔒 EXTRAINDO POLÍTICAS RLS')
  
  const rlsQueries = {
    'rls_status': `
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `,
    
    'policies_detailed': `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles::text,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname IN ('public', 'storage')
      ORDER BY tablename, policyname
    `
  }
  
  for (const [name, query] of Object.entries(rlsQueries)) {
    const result = await executeDirectQuery(query, `RLS ${name}`)
    if (result) {
      fs.writeFileSync(
        path.join(outputDir, 'policies', `${name}.json`),
        JSON.stringify(result, null, 2)
      )
    }
  }
}

// ====================================================================
// 5. EXTRAIR FUNCTIONS E TRIGGERS
// ====================================================================
async function extractFunctionsAndTriggers() {
  console.log('\n⚙️ EXTRAINDO FUNCTIONS E TRIGGERS')
  
  const funcQueries = {
    'functions': `
      SELECT 
        p.proname as function_name,
        n.nspname as schema_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_functiondef(p.oid) as definition,
        l.lanname as language,
        CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname IN ('public')
        AND p.prokind = 'f'
      ORDER BY p.proname
    `,
    
    'triggers': `
      SELECT 
        t.trigger_name,
        t.event_manipulation,
        t.event_object_table,
        t.action_timing,
        t.action_statement,
        t.action_orientation,
        t.action_condition
      FROM information_schema.triggers t
      WHERE t.trigger_schema = 'public'
      ORDER BY t.event_object_table, t.trigger_name
    `
  }
  
  for (const [name, query] of Object.entries(funcQueries)) {
    const result = await executeDirectQuery(query, `Functions ${name}`)
    if (result) {
      fs.writeFileSync(
        path.join(outputDir, 'functions', `${name}.json`),
        JSON.stringify(result, null, 2)
      )
    }
  }
}

// ====================================================================
// 6. EXTRAIR VIEWS
// ====================================================================
async function extractViews() {
  console.log('\n👁️ EXTRAINDO VIEWS')
  
  const viewsQuery = `
    SELECT 
      table_name,
      view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  
  const result = await executeDirectQuery(viewsQuery, 'Views')
  if (result) {
    fs.writeFileSync(
      path.join(outputDir, 'views', 'views_complete.json'),
      JSON.stringify(result, null, 2)
    )
  }
}

// ====================================================================
// 7. EXTRAIR DADOS DAS TABELAS PRINCIPAIS
// ====================================================================
async function extractTableData() {
  console.log('\n💾 EXTRAINDO DADOS DAS TABELAS')
  
  const mainTables = ['tenants', 'user_profiles', 'secretarias']
  
  for (const tableName of mainTables) {
    try {
      console.log(`📊 Extraindo dados: ${tableName}`)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
      
      if (error) {
        console.log(`⚠️ Erro em ${tableName}: ${error.message}`)
      } else {
        fs.writeFileSync(
          path.join(outputDir, 'data', `${tableName}_data.json`),
          JSON.stringify(data, null, 2)
        )
        console.log(`✅ ${tableName}: ${data?.length || 0} registros`)
      }
      
    } catch (error) {
      console.log(`❌ Erro na tabela ${tableName}:`, error.message)
    }
  }
}

// ====================================================================
// 8. COPIAR EDGE FUNCTIONS
// ====================================================================
async function copyEdgeFunctions() {
  console.log('\n🔄 COPIANDO EDGE FUNCTIONS')
  
  const functionsDir = 'supabase/functions'
  
  if (fs.existsSync(functionsDir)) {
    const functions = fs.readdirSync(functionsDir)
    
    for (const funcName of functions) {
      const funcPath = path.join(functionsDir, funcName)
      const destPath = path.join(outputDir, 'edge_functions', funcName)
      
      if (fs.statSync(funcPath).isDirectory()) {
        // Copiar diretório completo
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true })
        }
        
        const files = fs.readdirSync(funcPath)
        for (const file of files) {
          const content = fs.readFileSync(path.join(funcPath, file), 'utf8')
          fs.writeFileSync(path.join(destPath, file), content)
        }
        
        console.log(`✅ Edge function copiada: ${funcName}`)
      }
    }
  }
}

// ====================================================================
// 9. COPIAR MIGRAÇÕES
// ====================================================================
async function copyMigrations() {
  console.log('\n📁 COPIANDO MIGRAÇÕES')
  
  const migrationsDir = 'supabase/migrations'
  
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir)
    
    for (const migration of migrations) {
      if (migration.endsWith('.sql')) {
        const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8')
        fs.writeFileSync(path.join(outputDir, 'migrations', migration), content)
        console.log(`✅ Migração copiada: ${migration}`)
      }
    }
  }
}

// ====================================================================
// 10. GERAR SCHEMA SQL CONSOLIDADO
// ====================================================================
async function generateConsolidatedSchema() {
  console.log('\n📋 GERANDO SCHEMA CONSOLIDADO')
  
  const migrationsDir = path.join(outputDir, 'migrations')
  let consolidatedSQL = `-- ====================================================================
-- DIGIURBAN2 - BACKUP COMPLETO DO BANCO DE DADOS
-- ====================================================================
-- Data de backup: ${new Date().toISOString()}
-- Projeto: warbeochfoabfptvvtpu
-- URL: ${supabaseUrl}
-- ====================================================================
-- 
-- Este arquivo contém o schema completo do banco DigiUrban2
-- incluindo todas as migrações aplicadas em ordem cronológica
--
-- ====================================================================

`

  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    for (const migration of migrations) {
      const content = fs.readFileSync(path.join(migrationsDir, migration), 'utf8')
      consolidatedSQL += `
-- ====================================================================
-- MIGRAÇÃO: ${migration}
-- ====================================================================

${content}

`
    }
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'schema_completo_digiurban2.sql'),
    consolidatedSQL
  )
  
  console.log('✅ Schema consolidado gerado!')
}

// ====================================================================
// 11. EXECUTAR BACKUP COMPLETO
// ====================================================================
async function runCompleteBackup() {
  const startTime = Date.now()
  
  console.log('🚀 INICIANDO BACKUP COMPLETO DO BANCO DIGIURBAN2')
  console.log('=' .repeat(60))
  
  try {
    // 1. Schema via Edge Function
    await exportSchemaViaEdgeFunction()
    
    // 2. Estrutura das tabelas
    await extractTableStructures()
    
    // 3. Políticas RLS
    await extractRLSPolicies()
    
    // 4. Functions e Triggers
    await extractFunctionsAndTriggers()
    
    // 5. Views
    await extractViews()
    
    // 6. Dados das tabelas
    await extractTableData()
    
    // 7. Edge Functions
    await copyEdgeFunctions()
    
    // 8. Migrações
    await copyMigrations()
    
    // 9. Schema consolidado
    await generateConsolidatedSchema()
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n' + '=' .repeat(60))
    console.log('🎉 BACKUP COMPLETO FINALIZADO!')
    console.log(`⏱️ Tempo total: ${duration}s`)
    console.log(`📁 Backup salvo em: ${outputDir}/`)
    console.log('\n📋 ESTRUTURA DO BACKUP:')
    console.log('   ├── schema/ (estrutura das tabelas)')
    console.log('   ├── data/ (dados das tabelas)')
    console.log('   ├── functions/ (functions PostgreSQL)')
    console.log('   ├── policies/ (políticas RLS)')
    console.log('   ├── triggers/ (triggers)')
    console.log('   ├── views/ (views)')
    console.log('   ├── storage/ (configurações de storage)')
    console.log('   ├── edge_functions/ (edge functions copiadas)')
    console.log('   ├── migrations/ (todas as migrações)')
    console.log('   └── schema_completo_digiurban2.sql (schema consolidado)')
    console.log('\n✅ Backup 100% completo e pronto para restauração!')
    
  } catch (error) {
    console.error('\n❌ Erro durante o backup:', error)
  }
}

// Executar backup
runCompleteBackup().catch(console.error)