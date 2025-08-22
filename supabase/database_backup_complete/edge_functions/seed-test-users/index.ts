import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando criação de usuários de teste...');
    
    // Criar cliente Supabase com Service Role para bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Buscar primeiro tenant ativo para associar usuários (exceto super_admin)
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, nome')
      .eq('ativo', true)
      .limit(1)
      .single();

    console.log('📋 Tenant encontrado:', tenant?.nome || 'Nenhum tenant ativo');

    const testUsers = [
      {
        email: 'superadmin@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Super Administrador',
        tipo_usuario: 'super_admin',
        tenant_id: null, // Super admin não tem tenant
        cargo: 'Super Administrador do Sistema'
      },
      {
        email: 'admin@digiurban.com.br', 
        password: 'password123',
        nome_completo: 'Admin Municipal',
        tipo_usuario: 'admin',
        tenant_id: tenant?.id,
        cargo: 'Administrador Municipal'
      },
      {
        email: 'secretario@digiurban.com.br',
        password: 'password123', 
        nome_completo: 'Secretário Municipal',
        tipo_usuario: 'secretario',
        tenant_id: tenant?.id,
        cargo: 'Secretário'
      },
      {
        email: 'diretor@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Diretor Departamental', 
        tipo_usuario: 'diretor',
        tenant_id: tenant?.id,
        cargo: 'Diretor'
      },
      {
        email: 'coordenador@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Coordenador Setorial',
        tipo_usuario: 'coordenador', 
        tenant_id: tenant?.id,
        cargo: 'Coordenador'
      },
      {
        email: 'funcionario@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Funcionário Público',
        tipo_usuario: 'funcionario',
        tenant_id: tenant?.id,
        cargo: 'Funcionário'
      },
      {
        email: 'atendente@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Atendente Municipal',
        tipo_usuario: 'atendente',
        tenant_id: tenant?.id,
        cargo: 'Atendente'
      },
      {
        email: 'cidadao@digiurban.com.br',
        password: 'password123',
        nome_completo: 'Cidadão Teste',
        tipo_usuario: 'cidadao',
        tenant_id: tenant?.id,
        cargo: null
      }
    ];

    const results = [];
    
    for (const userData of testUsers) {
      try {
        console.log(`👤 Criando usuário: ${userData.email} (${userData.tipo_usuario})`);
        
        // 1. Verificar se usuário já existe
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.some(u => u.email === userData.email);
        
        if (userExists) {
          console.log(`⚠️ Usuário ${userData.email} já existe`);
          results.push({
            email: userData.email,
            status: 'exists',
            message: 'Usuário já existe'
          });
          continue;
        }

        // 2. Criar usuário no Auth com auto-confirmação
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirmar email
          user_metadata: {
            nome_completo: userData.nome_completo,
            tipo_usuario: userData.tipo_usuario,
            tenant_id: userData.tenant_id,
            cargo: userData.cargo,
            status: 'ativo'
          }
        });

        if (authError) {
          console.error(`❌ Erro ao criar auth user para ${userData.email}:`, authError);
          results.push({
            email: userData.email,
            status: 'error',
            message: authError.message
          });
          continue;
        }

        console.log(`✅ Usuário ${userData.email} criado com sucesso!`);
        results.push({
          email: userData.email,
          status: 'created',
          message: 'Usuário criado e auto-confirmado',
          user_id: authUser.user?.id
        });

      } catch (error) {
        console.error(`❌ Erro geral ao criar usuário ${userData.email}:`, error);
        results.push({
          email: userData.email,
          status: 'error',
          message: error.message || 'Erro desconhecido'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'created').length;
    const existsCount = results.filter(r => r.status === 'exists').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`🎉 Processo concluído:`);
    console.log(`✅ Criados: ${successCount}`);
    console.log(`⚠️ Já existiam: ${existsCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        created: successCount,
        exists: existsCount,
        errors: errorCount,
        total: results.length
      },
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro geral na função:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});