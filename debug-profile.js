// Script de debug para testar carregamento de perfil
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://apidigiruban.com.br';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWluc3RhbmNlLW1hbmFnZXIiLCJpYXQiOjE3NTU2NDQ1NzAsImV4cCI6MTc4NzE4MDU3MH0._yAg0U_wQQthjB6G-_2h461SNj0WjuOvBo6JukLYmDA';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUserId = 'b5e765f5-b0f0-49c8-b1e0-b205c452d956';

async function debugProfile() {
  console.log('🔍 Testando carregamento de perfil para:', testUserId);
  console.log('📍 URL Supabase:', supabaseUrl);
  
  // Teste 1: Verificar se consegue conectar
  console.log('\n1️⃣ Testando conexão...');
  try {
    const { data: health } = await supabase.from('user_profiles').select('count').limit(1);
    console.log('✅ Conexão OK');
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return;
  }
  
  // Teste 2: Query simples sem autenticação
  console.log('\n2️⃣ Testando query básica...');
  try {
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });
      
    console.log('📊 Total de perfis:', count);
    if (error) {
      console.error('❌ Erro na query básica:', error);
    } else {
      console.log('✅ Query básica OK');
    }
  } catch (error) {
    console.error('❌ Erro na query básica:', error);
  }
  
  // Teste 3: Query específica pelo ID
  console.log('\n3️⃣ Testando query específica por ID...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id, email, nome_completo, tipo_usuario, status, tenant_id,
        secretaria_id, setor_id, cargo, cpf, telefone,
        avatar_url, primeiro_acesso, ultimo_login, created_at, updated_at
      `)
      .eq('id', testUserId)
      .maybeSingle();
      
    if (error) {
      console.error('❌ Erro na query por ID:', error);
    } else if (data) {
      console.log('✅ Perfil encontrado:', data);
    } else {
      console.log('⚠️ Perfil não encontrado (data = null)');
    }
  } catch (error) {
    console.error('❌ Erro na query por ID:', error);
  }
  
  // Teste 4: Tentar fazer login primeiro
  console.log('\n4️⃣ Testando com login...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'fernandinhomartins040@gmail.com',
      password: '123456' // Substitua pela senha correta
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
    } else {
      console.log('✅ Login OK, usuário:', authData.user?.id);
      
      // Agora testar a query com usuário autenticado
      console.log('\n5️⃣ Testando query com usuário autenticado...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          id, email, nome_completo, tipo_usuario, status, tenant_id,
          secretaria_id, setor_id, cargo, cpf, telefone,
          avatar_url, primeiro_acesso, ultimo_login, created_at, updated_at
        `)
        .eq('id', authData.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('❌ Erro na query com auth:', profileError);
      } else if (profileData) {
        console.log('✅ Perfil encontrado com auth:', profileData);
      } else {
        console.log('⚠️ Perfil não encontrado com auth (data = null)');
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste com login:', error);
  }
  
  // Teste 6: Verificar RLS policies
  console.log('\n6️⃣ Verificando RLS policies...');
  try {
    const { data, error } = await supabase.rpc('check_rls_policies', {
      table_name: 'user_profiles'
    });
    
    if (error) {
      console.log('⚠️ Não foi possível verificar RLS policies (função não existe)');
    } else {
      console.log('📋 RLS Policies:', data);
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar RLS policies:', error.message);
  }
}

debugProfile().catch(console.error);