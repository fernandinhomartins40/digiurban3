// ====================================================================
// 🔐 SCRIPT PARA CRIAR USUÁRIOS DE TESTE NO SUPABASE
// ====================================================================
// Este script usa o service_role key para criar usuários de teste
// para todos os perfis do sistema DigiUrban2

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase (suas credenciais)
const supabaseUrl = 'https://warbeochfoabfptvvtpu.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcmJlb2NoZm9hYmZwdHZ2dHB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUzMzk5MSwiZXhwIjoyMDcxMTA5OTkxfQ.EfuTEme81CQGXxhSFVFMBkvU4HkwlQ8le24AHUh8Jho'

// Criar cliente com service role (admin)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ====================================================================
// USUÁRIOS DE TESTE PARA CADA PERFIL
// ====================================================================

const testUsers = [
  {
    email: 'superadmin@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Super Administrador',
      tipo_usuario: 'super_admin',
      cargo: 'Super Administrador do Sistema',
      cpf: '11111111111',
      telefone: '(11) 99999-1111'
    }
  },
  {
    email: 'admin@digiurban.com', 
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'João Admin Municipal',
      tipo_usuario: 'admin',
      cargo: 'Administrador Municipal',
      cpf: '22222222222',
      telefone: '(11) 99999-2222'
    }
  },
  {
    email: 'secretario@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Maria Secretária da Saúde',
      tipo_usuario: 'secretario',
      cargo: 'Secretária de Saúde',
      cpf: '33333333333',
      telefone: '(11) 99999-3333'
    }
  },
  {
    email: 'diretor@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Carlos Diretor de Unidade',
      tipo_usuario: 'diretor',
      cargo: 'Diretor de Unidade Básica',
      cpf: '44444444444',
      telefone: '(11) 99999-4444'
    }
  },
  {
    email: 'coordenador@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Ana Coordenadora',
      tipo_usuario: 'coordenador',
      cargo: 'Coordenadora de Programas',
      cpf: '55555555555',
      telefone: '(11) 99999-5555'
    }
  },
  {
    email: 'funcionario@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Pedro Funcionário',
      tipo_usuario: 'operador',
      cargo: 'Técnico Administrativo',
      cpf: '66666666666',
      telefone: '(11) 99999-6666'
    }
  },
  {
    email: 'atendente@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'Julia Atendente',
      tipo_usuario: 'operador',
      cargo: 'Atendente de Balcão',
      cpf: '77777777777',
      telefone: '(11) 99999-7777'
    }
  },
  {
    email: 'cidadao@digiurban.com',
    password: 'DigiUrban2025!',
    profile: {
      nome_completo: 'José Cidadão Silva',
      tipo_usuario: 'cidadao',
      cargo: 'Cidadão',
      cpf: '88888888888',
      telefone: '(11) 99999-8888'
    }
  }
]

// ====================================================================
// FUNÇÃO PRINCIPAL
// ====================================================================

async function createTestUsers() {
  console.log('🚀 Iniciando criação de usuários de teste...\n')

  // Primeiro, vamos verificar se existe um tenant padrão
  let defaultTenant
  
  try {
    console.log('📋 Verificando tenants existentes...')
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)

    if (tenantError) {
      console.error('❌ Erro ao buscar tenants:', tenantError)
      return
    }

    if (!tenants || tenants.length === 0) {
      console.log('🏢 Criando tenant padrão para testes...')
      
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          tenant_code: 'TESTE001',
          nome: 'Município de Teste',
          slug: 'teste',
          cidade: 'Cidade Teste',
          estado: 'SP',
          email: 'contato@cidadeteste.gov.br',
          status: 'ativo',
          plano: 'professional'
        })
        .select()
        .single()

      if (createTenantError) {
        console.error('❌ Erro ao criar tenant:', createTenantError)
        return
      }

      defaultTenant = newTenant
      console.log('✅ Tenant criado:', defaultTenant.nome)
    } else {
      defaultTenant = tenants[0]
      console.log('✅ Usando tenant existente:', defaultTenant.nome)
    }

  } catch (error) {
    console.error('❌ Erro na verificação/criação do tenant:', error)
    return
  }

  // Agora criar os usuários
  console.log('\n👥 Criando usuários de teste...\n')

  for (const user of testUsers) {
    try {
      console.log(`📝 Criando usuário: ${user.email}`)

      // 1. Criar usuário no auth.users com auto-confirmação
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          nome_completo: user.profile.nome_completo,
          tipo_usuario: user.profile.tipo_usuario
        }
      })

      if (authError) {
        console.error(`❌ Erro ao criar usuário ${user.email}:`, authError)
        continue
      }

      console.log(`✅ Usuário criado no auth: ${authUser.user.id}`)

      // 2. Criar perfil na tabela user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.user.id,
          tenant_id: defaultTenant.id,
          nome_completo: user.profile.nome_completo,
          email: user.email,
          tipo_usuario: user.profile.tipo_usuario,
          cargo: user.profile.cargo,
          cpf: user.profile.cpf,
          telefone: user.profile.telefone,
          status: 'ativo',
          primeiro_acesso: false, // Já configurado para testes
          permissoes: getDefaultPermissions(user.profile.tipo_usuario)
        })

      if (profileError) {
        console.error(`❌ Erro ao criar perfil ${user.email}:`, profileError)
        continue
      }

      console.log(`✅ Perfil criado para: ${user.profile.nome_completo}`)
      console.log(`   Tipo: ${user.profile.tipo_usuario}`)
      console.log(`   Cargo: ${user.profile.cargo}\n`)

    } catch (error) {
      console.error(`❌ Erro geral ao criar usuário ${user.email}:`, error)
    }
  }

  console.log('🎉 Criação de usuários concluída!')
  console.log('\n📋 CREDENCIAIS PARA TESTE:')
  console.log('========================================')
  testUsers.forEach(user => {
    console.log(`${user.profile.tipo_usuario.toUpperCase()}: ${user.email} | ${user.password}`)
  })
  console.log('========================================')
}

// ====================================================================
// FUNÇÃO PARA DEFINIR PERMISSÕES PADRÃO
// ====================================================================

function getDefaultPermissions(tipoUsuario) {
  const permissionsMap = {
    'super_admin': ['*'], // Acesso total
    'admin': [
      'admin.all', 'usuarios.read', 'usuarios.write', 'protocolos.read', 
      'protocolos.write', 'relatorios.read', 'configuracoes.write'
    ],
    'secretario': [
      'protocolos.read', 'protocolos.write', 'relatorios.read',
      'saude.all', 'educacao.all', 'assistencia_social.all'
    ],
    'diretor': [
      'protocolos.read', 'protocolos.write', 'saude.read', 'saude.write'
    ],
    'coordenador': [
      'protocolos.read', 'protocolos.write', 'saude.read'
    ],
    'operador': [
      'protocolos.read', 'protocolos.write'
    ],
    'cidadao': [
      'protocolos.read', 'servicos.read'
    ]
  }

  return permissionsMap[tipoUsuario] || ['protocolos.read']
}

// ====================================================================
// EXECUTAR SCRIPT
// ====================================================================

createTestUsers().catch(console.error)