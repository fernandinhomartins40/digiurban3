// Script para comparar tabelas do frontend vs Supabase
import fs from 'fs'

console.log('🔍 COMPARANDO SCHEMAS: FRONTEND vs SUPABASE\n')

// Ler tabelas do frontend
const frontendData = JSON.parse(fs.readFileSync('tabelas_frontend_mapeadas.json', 'utf8'))
const frontendTables = new Set(frontendData.all_tables)

// Tabelas que existem no Supabase (removendo duplicatas)
const supabaseTables = new Set([
  'agricultura_ater', 'agricultura_distribuicao', 'agricultura_insumos', 
  'agricultura_produtores', 'agricultura_programas', 'anexos', 
  'assistencia_atendimentos', 'assistencia_familias', 'assistencia_unidades',
  'audit_logs', 'cultura_espacos', 'cultura_eventos', 'cultura_grupos',
  'cultura_oficinas', 'cultura_projetos', 'educacao_alunos', 'educacao_escolas',
  'educacao_matriculas', 'educacao_profissionais', 'educacao_turmas',
  'esportes_atletas', 'esportes_competicoes', 'esportes_equipes',
  'esportes_escolinhas', 'esportes_infraestrutura', 'gabinete_agenda',
  'gabinete_atendimentos', 'gabinete_audiencias', 'gabinete_indicadores',
  'gabinete_projetos_estrategicos', 'habitacao_familias', 'habitacao_programas',
  'habitacao_regularizacao', 'habitacao_selecao', 'habitacao_unidades',
  'meio_ambiente_areas_protegidas', 'meio_ambiente_denuncias', 
  'meio_ambiente_educacao', 'meio_ambiente_licenciamento', 
  'meio_ambiente_monitoramento', 'notificacoes', 'obras_acompanhamento',
  'obras_projetos', 'planejamento_alvaras', 'planejamento_consultas_publicas',
  'planejamento_projetos', 'planejamento_vistorias', 'planejamento_zoneamento',
  'protocolos', 'protocolos_historico', 'saude_agendamentos', 'saude_campanhas',
  'saude_medicamentos', 'saude_pacientes', 'saude_profissionais', 'saude_unidades',
  'secretarias', 'seguranca_guardas', 'seguranca_ocorrencias',
  'servicos_areas_verdes', 'servicos_coleta_especial', 'servicos_iluminacao',
  'servicos_limpeza', 'servicos_problemas', 'tenants', 'turismo_estabelecimentos',
  'turismo_eventos', 'turismo_pontos', 'turismo_roteiros', 'turismo_visitantes',
  'user_activities', 'user_profiles', 'user_sessions'
])

// Filtrar apenas tabelas reais (não functions)
const frontendTablesOnly = new Set([...frontendTables].filter(table => 
  !['gerar_numero_protocolo', 'get_current_user_tenant', 'get_current_user_type', 
    'get_user_permissions', 'is_super_admin', 'log_audit_action', 'log_login_attempt'].includes(table)
))

// Comparar
const missingInSupabase = [...frontendTablesOnly].filter(table => !supabaseTables.has(table))
const existingInBoth = [...frontendTablesOnly].filter(table => supabaseTables.has(table))
const onlyInSupabase = [...supabaseTables].filter(table => !frontendTablesOnly.has(table))

console.log('📊 RESULTADO DA COMPARAÇÃO')
console.log('=' .repeat(70))

console.log(`\n✅ TABELAS EXISTENTES EM AMBOS (${existingInBoth.length})`)
console.log('-' .repeat(50))
existingInBoth.sort().forEach((table, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`)
})

console.log(`\n❌ TABELAS FALTANDO NO SUPABASE (${missingInSupabase.length})`)
console.log('-' .repeat(50))
if (missingInSupabase.length === 0) {
  console.log('   🎉 Todas as tabelas do frontend existem no Supabase!')
} else {
  missingInSupabase.sort().forEach((table, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`)
  })
}

console.log(`\n⚠️ TABELAS APENAS NO SUPABASE (${onlyInSupabase.length})`)
console.log('-' .repeat(50))
if (onlyInSupabase.length === 0) {
  console.log('   ✅ Nenhuma tabela extra no Supabase')
} else {
  onlyInSupabase.sort().forEach((table, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${table}`)
  })
}

console.log('\n' + '=' .repeat(70))
console.log(`📊 RESUMO:`)
console.log(`   Frontend: ${frontendTablesOnly.size} tabelas`)
console.log(`   Supabase: ${supabaseTables.size} tabelas`)
console.log(`   Sincronizadas: ${existingInBoth.length} tabelas`)
console.log(`   Faltando: ${missingInSupabase.length} tabelas`)
console.log('=' .repeat(70))

// Verificar functions
const frontendFunctions = ['gerar_numero_protocolo', 'get_current_user_tenant', 
  'get_current_user_type', 'get_user_permissions', 'is_super_admin', 
  'log_audit_action', 'log_login_attempt']

console.log(`\n🔧 FUNCTIONS REQUERIDAS PELO FRONTEND (${frontendFunctions.length})`)
console.log('-' .repeat(50))
frontendFunctions.forEach((func, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${func}`)
})

// Salvar resultado da comparação
const comparisonResult = {
  comparison_date: new Date().toISOString(),
  frontend_tables: frontendTablesOnly.size,
  supabase_tables: supabaseTables.size,
  synchronized: existingInBoth.length,
  missing_in_supabase: missingInSupabase.length,
  only_in_supabase: onlyInSupabase.length,
  tables: {
    existing_in_both: existingInBoth.sort(),
    missing_in_supabase: missingInSupabase.sort(),
    only_in_supabase: onlyInSupabase.sort()
  },
  required_functions: frontendFunctions,
  status: missingInSupabase.length === 0 ? 'SYNCHRONIZED' : 'NEEDS_UPDATE'
}

fs.writeFileSync('schema_comparison_result.json', JSON.stringify(comparisonResult, null, 2))
console.log('\n✅ Resultado da comparação salvo em: schema_comparison_result.json')

if (missingInSupabase.length === 0) {
  console.log('\n🎉 PARABÉNS! Todas as tabelas do frontend já existem no Supabase!')
  console.log('🔄 Próximo passo: Verificar se as colunas e RLS policies estão corretas.')
} else {
  console.log(`\n⚠️ ATENÇÃO: ${missingInSupabase.length} tabelas precisam ser criadas no Supabase.`)
  console.log('📝 Será necessário criar migrações para essas tabelas.')
}