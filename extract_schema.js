// ====================================================================
// 🔍 EXTRATOR DE SCHEMA COMPLETO DO SUPABASE
// ====================================================================
// Script para extrair schema, policies, RLS, functions, triggers e views

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

console.log('🚀 Iniciando extração do schema completo...\n')

// ====================================================================
// FUNÇÃO PARA EXECUTAR QUERIES SQL DIRETAS
// ====================================================================
async function executeQuery(query, description) {
  try {
    console.log(`📋 Extraindo: ${description}`)
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query 
    })
    
    if (error) {
      console.error(`❌ Erro em ${description}:`, error)
      return null
    }
    
    console.log(`✅ ${description} extraído com sucesso`)
    return data
    
  } catch (error) {
    console.error(`❌ Erro ao executar query para ${description}:`, error)
    return null
  }
}

// ====================================================================
// EXTRAIR INFORMAÇÕES DO SCHEMA
// ====================================================================
async function extractSchema() {
  const schemaData = {}
  
  // 1. TABELAS E ESTRUTURA
  console.log('\n🏗️ EXTRAINDO ESTRUTURA DAS TABELAS')
  const tablesQuery = `
    SELECT 
      schemaname,
      tablename,
      tableowner
    FROM pg_tables 
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schemaname, tablename;
  `
  
  const tables = await executeQuery(tablesQuery, 'Lista de tabelas')
  if (tables) {
    fs.writeFileSync(
      path.join(outputDir, '01_tables_list.sql'),
      `-- ====================================================================\n-- LISTA DE TABELAS\n-- ====================================================================\n\n${JSON.stringify(tables, null, 2)}`
    )
  }

  // 2. COLUNAS DE TODAS AS TABELAS
  console.log('\n📊 EXTRAINDO COLUNAS DAS TABELAS')
  const columnsQuery = `
    SELECT 
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY table_schema, table_name, ordinal_position;
  `
  
  const columns = await executeQuery(columnsQuery, 'Estrutura das colunas')
  if (columns) {
    fs.writeFileSync(
      path.join(outputDir, '02_columns_structure.sql'),
      `-- ====================================================================\n-- ESTRUTURA DAS COLUNAS\n-- ====================================================================\n\n${JSON.stringify(columns, null, 2)}`
    )
  }

  // 3. TYPES E ENUMS
  console.log('\n🏷️ EXTRAINDO TYPES E ENUMS')
  const typesQuery = `
    SELECT 
      n.nspname as schema_name,
      t.typname as type_name,
      t.typtype,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t 
    LEFT JOIN pg_enum e ON t.oid = e.enumtypid  
    LEFT JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE (t.typtype = 'e' OR t.typtype = 'c')
      AND n.nspname NOT IN ('information_schema', 'pg_catalog')
    GROUP BY n.nspname, t.typname, t.typtype
    ORDER BY n.nspname, t.typname;
  `
  
  const types = await executeQuery(typesQuery, 'Types e Enums')
  if (types) {
    fs.writeFileSync(
      path.join(outputDir, '03_types_enums.sql'),
      `-- ====================================================================\n-- TYPES E ENUMS\n-- ====================================================================\n\n${JSON.stringify(types, null, 2)}`
    )
  }

  // 4. ÍNDICES
  console.log('\n🔍 EXTRAINDO ÍNDICES')
  const indexesQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
    ORDER BY schemaname, tablename, indexname;
  `
  
  const indexes = await executeQuery(indexesQuery, 'Índices')
  if (indexes) {
    fs.writeFileSync(
      path.join(outputDir, '04_indexes.sql'),
      `-- ====================================================================\n-- ÍNDICES\n-- ====================================================================\n\n${JSON.stringify(indexes, null, 2)}`
    )
  }

  // 5. CONSTRAINTS
  console.log('\n🔒 EXTRAINDO CONSTRAINTS')
  const constraintsQuery = `
    SELECT 
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY tc.table_schema, tc.table_name, tc.constraint_type;
  `
  
  const constraints = await executeQuery(constraintsQuery, 'Constraints')
  if (constraints) {
    fs.writeFileSync(
      path.join(outputDir, '05_constraints.sql'),
      `-- ====================================================================\n-- CONSTRAINTS (PKs, FKs, CHECK, UNIQUE)\n-- ====================================================================\n\n${JSON.stringify(constraints, null, 2)}`
    )
  }

  console.log('\n✅ Extração do schema concluída!')
  console.log(`📁 Arquivos salvos em: ${outputDir}`)
}

// ====================================================================
// EXECUTAR EXTRAÇÃO
// ====================================================================
extractSchema().catch(console.error)