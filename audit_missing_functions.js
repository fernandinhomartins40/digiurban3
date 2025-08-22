// Auditoria de functions faltantes no Supabase
import fs from 'fs'

console.log('🔍 AUDITORIA DE FUNCTIONS POSTGRESQL E EDGE FUNCTIONS\n')

// Functions PostgreSQL usadas no frontend
const rpcFunctions = [
  'is_password_expired',
  'confirm_password_change', 
  'create_user_with_temp_password',
  'get_creatable_user_types',
  'can_create_user_type',
  'force_password_change',
  'pontos_proximos',
  'get_monthly_revenue_metrics',
  'increment_beneficiarios',
  'gerar_numero_protocolo',
  'get_user_permissions',
  'log_audit_action',
  'log_login_attempt',
  'incrementar_participantes_consulta',
  'run_sql_query',
  'test_rls_policies_v2'
]

// Edge functions usadas no frontend
const edgeFunctions = [
  'export-schema',
  'seed-test-users'
]

// Functions que existem no Supabase (baseado no schema)
const existingFunctions = [
  'gerar_numero_protocolo',
  'get_current_user_tenant',
  'get_current_user_type', 
  'get_user_permissions',
  'is_super_admin',
  'log_audit_action',
  'log_login_attempt',
  'handle_new_user',
  'update_updated_at_column',
  'audit_table_changes',
  'generate_protocolo_number_trigger'
]

// Edge functions que existem
const existingEdgeFunctions = [
  'export-schema',
  'seed-test-users'
]

console.log('📊 FUNCTIONS POSTGRESQL REQUERIDAS')
console.log('=' .repeat(60))

const missingRpcFunctions = rpcFunctions.filter(func => !existingFunctions.includes(func))
const existingRpcFunctions = rpcFunctions.filter(func => existingFunctions.includes(func))

console.log(`\n✅ FUNCTIONS EXISTENTES (${existingRpcFunctions.length})`)
console.log('-' .repeat(40))
existingRpcFunctions.forEach((func, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${func}`)
})

console.log(`\n❌ FUNCTIONS FALTANDO (${missingRpcFunctions.length})`)
console.log('-' .repeat(40))
missingRpcFunctions.forEach((func, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${func}`)
})

console.log('\n📊 EDGE FUNCTIONS')
console.log('=' .repeat(60))

const missingEdgeFunctions = edgeFunctions.filter(func => !existingEdgeFunctions.includes(func))
const existingEdgeOk = edgeFunctions.filter(func => existingEdgeFunctions.includes(func))

console.log(`\n✅ EDGE FUNCTIONS EXISTENTES (${existingEdgeOk.length})`)
console.log('-' .repeat(40))
existingEdgeOk.forEach((func, index) => {
  console.log(`   ${(index + 1).toString().padStart(2)}. ${func}`)
})

console.log(`\n❌ EDGE FUNCTIONS FALTANDO (${missingEdgeFunctions.length})`)
console.log('-' .repeat(40))
if (missingEdgeFunctions.length === 0) {
  console.log('   🎉 Todas as edge functions existem!')
} else {
  missingEdgeFunctions.forEach((func, index) => {
    console.log(`   ${(index + 1).toString().padStart(2)}. ${func}`)
  })
}

console.log('\n' + '=' .repeat(60))
console.log('📋 RESUMO DA AUDITORIA')
console.log('=' .repeat(60))
console.log(`RPC Functions: ${existingRpcFunctions.length}/${rpcFunctions.length} existentes`)
console.log(`Edge Functions: ${existingEdgeOk.length}/${edgeFunctions.length} existentes`)
console.log(`Total Functions Faltando: ${missingRpcFunctions.length + missingEdgeFunctions.length}`)

if (missingRpcFunctions.length > 0) {
  console.log(`\n⚠️ É necessário criar ${missingRpcFunctions.length} functions PostgreSQL`)
}

if (missingEdgeFunctions.length > 0) {
  console.log(`\n⚠️ É necessário criar ${missingEdgeFunctions.length} edge functions`)
}

if (missingRpcFunctions.length === 0 && missingEdgeFunctions.length === 0) {
  console.log('\n🎉 TODAS AS FUNCTIONS ESTÃO IMPLEMENTADAS!')
}

// Salvar resultado
const auditResult = {
  audit_date: new Date().toISOString(),
  rpc_functions: {
    total: rpcFunctions.length,
    existing: existingRpcFunctions.length,
    missing: missingRpcFunctions.length,
    existing_list: existingRpcFunctions,
    missing_list: missingRpcFunctions
  },
  edge_functions: {
    total: edgeFunctions.length,
    existing: existingEdgeOk.length,
    missing: missingEdgeFunctions.length,
    existing_list: existingEdgeOk,
    missing_list: missingEdgeFunctions
  },
  total_missing: missingRpcFunctions.length + missingEdgeFunctions.length,
  status: (missingRpcFunctions.length + missingEdgeFunctions.length) === 0 ? 'COMPLETE' : 'NEEDS_FUNCTIONS'
}

fs.writeFileSync('functions_audit_result.json', JSON.stringify(auditResult, null, 2))
console.log('\n✅ Resultado salvo em: functions_audit_result.json')