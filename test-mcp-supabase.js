// Teste do MCP Supabase
// Este script testa a conectividade e funcionalidades básicas

import { createClient } from '@supabase/supabase-js';

// Configuração usando as variáveis do .env.local
const supabaseUrl = 'https://ultrabase.com.br/instancia0135103';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWluc3RhbmNlLW1hbmFnZXIiLCJpYXQiOjE3NTU1MjIxOTEsImV4cCI6MTc4NzA1ODE5MX0.uCya7QeSL9f8dIkLjqfpyed8xgGFNROzT48FuRwSPWM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarMCPSupabase() {
  console.log('🚀 Iniciando teste do MCP Supabase...\n');
  
  try {
    // Teste 1: Conectividade básica
    console.log('📡 Teste 1: Conectividade básica');
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Erro na conectividade:', error.message);
    } else {
      console.log(`✅ Conectividade OK (${responseTime}ms)`);
      console.log(`📊 Registros na tabela user_profiles: ${data || 'N/A'}`);
    }
    
    // Teste 2: Verificar configuração de auth
    console.log('\n🔐 Teste 2: Configuração de autenticação');
    const { data: sessionData } = await supabase.auth.getSession();
    console.log(`✅ Configuração auth carregada`);
    console.log(`📋 Sessão ativa: ${sessionData.session ? 'Sim' : 'Não'}`);
    
    // Teste 3: Listar algumas tabelas principais
    console.log('\n📋 Teste 3: Verificação de tabelas principais');
    const tabelas = ['user_profiles', 'secretarias', 'perfis_acesso'];
    
    for (const tabela of tabelas) {
      try {
        const { data, error, count } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Tabela '${tabela}': ${error.message}`);
        } else {
          console.log(`✅ Tabela '${tabela}': ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ Tabela '${tabela}': Erro - ${err.message}`);
      }
    }
    
    // Teste 4: Verificar usuários existentes
    console.log('\n👥 Teste 4: Verificação de usuários');
    try {
      const { data: usuarios, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, nome_completo, tipo_usuario, status')
        .limit(5);
      
      if (userError) {
        console.log('❌ Erro ao buscar usuários:', userError.message);
      } else {
        console.log(`✅ Encontrados ${usuarios?.length || 0} usuários:`);
        usuarios?.forEach(user => {
          console.log(`  - ${user.email} (${user.tipo_usuario}) - ${user.status}`);
        });
      }
    } catch (err) {
      console.log('❌ Erro na verificação de usuários:', err.message);
    }
    
    console.log('\n🎉 Teste do MCP Supabase concluído!');
    
  } catch (error) {
    console.error('💥 Erro fatal no teste:', error);
  }
}

// Executar o teste
testarMCPSupabase();