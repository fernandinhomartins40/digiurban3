// Script para extrair todas as tabelas definidas no frontend
import fs from 'fs'

console.log('📋 Extraindo todas as tabelas definidas no frontend...\n')

// Ler o arquivo types.ts
const typesContent = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8')

// Extrair nomes das tabelas usando regex
const tableMatches = typesContent.match(/^\s+([a-z_]+): \{$/gm)

if (tableMatches) {
  const tables = tableMatches
    .map(match => match.trim().replace(': {', ''))
    .filter(name => 
      !['public', '__InternalSupabase', 'Tables', 'Views', 'Functions', 'Enums', 'CompositeTypes'].includes(name) &&
      !name.includes('gtrgm') && // Remover funções pg_trgm
      !name.includes('unaccent') &&
      name !== 'set_limit' &&
      name !== 'show_limit' &&
      name !== 'show_trgm'
    )

  // Organizar por módulos
  const modulesTables = {
    'Sistema Core': [],
    'Agricultura': [],
    'Assistência Social': [],
    'Cultura': [],
    'Educação': [],
    'Esportes': [],
    'Gabinete': [],
    'Habitação': [],
    'Meio Ambiente': [],
    'Obras': [],
    'Planejamento': [],
    'Saúde': [],
    'Segurança': [],
    'Serviços Urbanos': [],
    'Turismo': [],
    'Functions': []
  }

  tables.forEach(table => {
    if (table.startsWith('agricultura_')) {
      modulesTables['Agricultura'].push(table)
    } else if (table.startsWith('assistencia_')) {
      modulesTables['Assistência Social'].push(table)
    } else if (table.startsWith('cultura_')) {
      modulesTables['Cultura'].push(table)
    } else if (table.startsWith('educacao_')) {
      modulesTables['Educação'].push(table)
    } else if (table.startsWith('esportes_')) {
      modulesTables['Esportes'].push(table)
    } else if (table.startsWith('gabinete_')) {
      modulesTables['Gabinete'].push(table)
    } else if (table.startsWith('habitacao_')) {
      modulesTables['Habitação'].push(table)
    } else if (table.startsWith('meio_ambiente_')) {
      modulesTables['Meio Ambiente'].push(table)
    } else if (table.startsWith('obras_')) {
      modulesTables['Obras'].push(table)
    } else if (table.startsWith('planejamento_')) {
      modulesTables['Planejamento'].push(table)
    } else if (table.startsWith('saude_')) {
      modulesTables['Saúde'].push(table)
    } else if (table.startsWith('seguranca_')) {
      modulesTables['Segurança'].push(table)
    } else if (table.startsWith('servicos_')) {
      modulesTables['Serviços Urbanos'].push(table)
    } else if (table.startsWith('turismo_')) {
      modulesTables['Turismo'].push(table)
    } else if (table.includes('_') && !['tenants', 'user_profiles', 'protocolos', 'secretarias', 'anexos', 'notificacoes', 'audit_logs', 'user_sessions', 'protocolos_historico', 'user_activities'].includes(table)) {
      modulesTables['Functions'].push(table)
    } else {
      modulesTables['Sistema Core'].push(table)
    }
  })

  console.log('🎯 MAPEAMENTO COMPLETO DAS TABELAS DEFINIDAS NO FRONTEND\n')
  console.log('=' .repeat(70))

  let totalTables = 0
  for (const [module, tables] of Object.entries(modulesTables)) {
    if (tables.length > 0) {
      console.log(`\n📁 ${module.toUpperCase()} (${tables.length} tabelas)`)
      console.log('-' .repeat(50))
      tables.forEach((table, index) => {
        console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`)
      })
      totalTables += tables.length
    }
  }

  console.log('\n' + '=' .repeat(70))
  console.log(`🎯 TOTAL: ${totalTables} TABELAS MAPEADAS`)
  console.log('=' .repeat(70))

  // Salvar resultado
  const result = {
    total_tables: totalTables,
    extraction_date: new Date().toISOString(),
    modules: modulesTables,
    all_tables: tables.sort()
  }

  fs.writeFileSync('tabelas_frontend_mapeadas.json', JSON.stringify(result, null, 2))
  console.log('\n✅ Resultado salvo em: tabelas_frontend_mapeadas.json')

} else {
  console.log('❌ Não foi possível extrair as tabelas')
}