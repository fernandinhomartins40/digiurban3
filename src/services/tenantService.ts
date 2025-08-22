import { supabase } from '../lib/supabase';
import { supabaseAdmin, logSystemActivity } from '../lib/supabaseAdmin';
import { TenantPadrao, PlanoTenant, StatusTenant, EnderecoPadrao } from '../types/common';

// ====================================================================
// INTERFACES - USANDO TIPOS PADRONIZADOS
// ====================================================================

export interface CreateTenantData {
  nome: string;
  cidade: string;
  estado: string;
  populacao: number;
  cnpj: string;
  endereco?: string;
  cep?: string;
  plano: PlanoTenant;
  // Dados de contato (NÃO criam usuário, apenas informações)
  responsavel_nome?: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
}

export interface UpdateTenantData {
  nome?: string;
  cidade?: string;
  estado?: string;
  populacao?: number;
  endereco?: EnderecoPadrao;
  plano?: PlanoTenant;
  responsavel?: {
    nome?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
  };
}

// ====================================================================
// SERVIÇO DE TENANT - APENAS OPERAÇÕES ORGANIZACIONAIS
// ====================================================================

export class TenantService {
  
  /**
   * Criar apenas tenant (organização) - SEM usuário
   */
  static async createTenant(tenantData: CreateTenantData): Promise<TenantPadrao> {
    try {
      console.log('🏛️ Criando tenant (apenas organização):', tenantData.nome);
      
      // 1. Gerar código único para o tenant
      const tenantCode = await TenantService.generateUniqueTenantCode(tenantData.nome);
      console.log('🏷️ Código do tenant gerado:', tenantCode);
      
      // 2. Validar CNPJ único
      const cnpjExists = await TenantService.checkCnpjExists(tenantData.cnpj);
      if (cnpjExists) {
        throw new Error('CNPJ já está sendo usado por outro tenant');
      }
      
      // 3. Criar tenant usando RPC segura
      const { data: result, error: tenantError } = await supabase.rpc('create_tenant_safe', {
        tenant_data: {
          nome: tenantData.nome,
          cidade: tenantData.cidade,
          estado: tenantData.estado,
          populacao: tenantData.populacao,
          cnpj: tenantData.cnpj,
          endereco: tenantData.endereco,
          plano: tenantData.plano,
          responsavel_nome: tenantData.responsavel_nome,
          responsavel_email: tenantData.responsavel_email,
          responsavel_telefone: tenantData.responsavel_telefone
        }
      });
      
      if (tenantError || !result?.success) {
        console.error('❌ Erro ao criar tenant:', tenantError || result?.error);
        throw new Error(`Erro ao criar tenant: ${tenantError?.message || result?.error}`);
      }
      
      // Buscar tenant criado para retornar
      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', result.tenant_id)
        .single();
        
      if (fetchError) {
        console.error('❌ Erro ao buscar tenant criado:', fetchError);
        throw new Error(`Tenant criado mas erro ao buscar: ${fetchError.message}`);
      }
      
      console.log('✅ Tenant criado com sucesso:', tenant.id);
      
      // 4. Registrar atividade de criação
      await logSystemActivity({
        user_id: null, // Criado pelo super admin
        tenant_id: tenant.id,
        acao: 'Tenant criado',
        detalhes: `Tenant ${tenant.nome} (${tenant.tenant_code}) criado na cidade ${tenant.cidade}/${tenant.estado}`,
        categoria: 'tenants',
        metadata: {
          tenant_id: tenant.id,
          tenant_code: tenant.tenant_code,
          tenant_name: tenant.nome,
          plano: tenant.plano,
          created_by: 'super_admin'
        }
      });
      
      return tenant;
      
    } catch (error) {
      console.error('❌ Erro ao criar tenant:', error);
      throw error;
    }
  }
  
  /**
   * Atualizar tenant existente
   */
  static async updateTenant(tenantId: string, updates: UpdateTenantData): Promise<TenantPadrao> {
    try {
      console.log('🏛️ Atualizando tenant:', tenantId);
      
      // 1. Verificar se tenant existe
      const existingTenant = await TenantService.getTenantById(tenantId);
      if (!existingTenant) {
        throw new Error('Tenant não encontrado');
      }
      
      // 2. Atualizar tenant
      const { data: tenant, error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Erro ao atualizar tenant:', updateError);
        throw new Error(`Erro ao atualizar tenant: ${updateError.message}`);
      }
      
      console.log('✅ Tenant atualizado com sucesso:', tenant.id);
      
      // 3. Registrar atividade
      await logSystemActivity({
        user_id: null,
        tenant_id: tenant.id,
        acao: 'Tenant atualizado',
        detalhes: `Tenant ${tenant.nome} foi atualizado`,
        categoria: 'tenants',
        metadata: {
          tenant_id: tenant.id,
          updates: updates,
          updated_by: 'super_admin'
        }
      });
      
      return tenant;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar tenant:', error);
      throw error;
    }
  }
  
  /**
   * Excluir tenant (soft delete)
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    try {
      console.log('🗑️ Excluindo tenant:', tenantId);
      
      // 1. Verificar se tenant existe
      const existingTenant = await TenantService.getTenantById(tenantId);
      if (!existingTenant) {
        throw new Error('Tenant não encontrado');
      }
      
      // 2. Verificar se tem usuários ativos
      const { data: users, error: usersError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('status', 'ativo');
      
      if (usersError) {
        throw new Error(`Erro ao verificar usuários: ${usersError.message}`);
      }
      
      if (users && users.length > 0) {
        throw new Error('Não é possível excluir tenant com usuários ativos. Desative os usuários primeiro.');
      }
      
      // 3. Marcar como suspenso (soft delete)
      const { error: deleteError } = await supabaseAdmin
        .from('tenants')
        .update({
          status: 'suspenso',
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);
      
      if (deleteError) {
        console.error('❌ Erro ao excluir tenant:', deleteError);
        throw new Error(`Erro ao excluir tenant: ${deleteError.message}`);
      }
      
      console.log('✅ Tenant excluído com sucesso:', tenantId);
      
      // 4. Registrar atividade
      await logSystemActivity({
        user_id: null,
        tenant_id: tenantId,
        acao: 'Tenant excluído',
        detalhes: `Tenant ${existingTenant.nome} foi marcado como inativo`,
        categoria: 'tenants',
        metadata: {
          tenant_id: tenantId,
          tenant_name: existingTenant.nome,
          deleted_by: 'super_admin'
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao excluir tenant:', error);
      throw error;
    }
  }
  
  /**
   * Buscar tenant por ID
   */
  static async getTenantById(tenantId: string): Promise<TenantPadrao | null> {
    try {
      const { data: tenant, error } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .neq('status', 'suspenso')
        .neq('status', 'cancelado')
        .single();
      
      if (error || !tenant) {
        return null;
      }
      
      return tenant;
    } catch (error) {
      console.error('❌ Erro ao buscar tenant:', error);
      return null;
    }
  }
  
  /**
   * Listar todos os tenants usando RPC segura
   */
  static async getAllTenants(): Promise<TenantPadrao[]> {
    try {
      console.log('🔄 Buscando tenants via RPC segura...');
      
      const { data: tenants, error } = await supabase.rpc('get_tenants_for_user');
      
      if (error) {
        console.error('❌ Erro ao buscar tenants via RPC:', error);
        throw new Error(`Erro ao buscar tenants: ${error.message}`);
      }
      
      console.log('✅ Tenants carregados via RPC:', tenants?.length || 0);
      return tenants || [];
    } catch (error) {
      console.error('❌ Erro ao listar tenants:', error);
      throw error;
    }
  }
  
  /**
   * Verificar se CNPJ já existe usando RPC segura
   */
  static async checkCnpjExists(cnpj: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_cnpj_available', { cnpj_input: cnpj });
      
      if (error) {
        console.error('❌ Erro ao verificar CNPJ:', error);
        return false;
      }
      
      return !data?.available; // Se não está disponível, então existe
    } catch {
      return false;
    }
  }
  
  /**
   * Marcar tenant como tendo admin
   */
  static async markTenantAsHavingAdmin(tenantId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('tenants')
        .update({
          has_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);
      
      if (error) {
        throw new Error(`Erro ao marcar tenant com admin: ${error.message}`);
      }
      
      console.log('✅ Tenant marcado como tendo admin:', tenantId);
    } catch (error) {
      console.error('❌ Erro ao marcar tenant com admin:', error);
      throw error;
    }
  }
  
  /**
   * Gerar código único para o tenant
   */
  private static async generateUniqueTenantCode(nome: string): Promise<string> {
    // Criar código baseado no nome (primeiras 3 letras + 3 dígitos)
    const baseCode = nome
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3)
      .padEnd(3, 'A');
    
    // Tentar códigos sequenciais até encontrar um único
    for (let i = 1; i <= 999; i++) {
      const code = `${baseCode}${i.toString().padStart(3, '0')}`;
      
      const { data, error } = await supabaseAdmin
        .from('tenants')
        .select('tenant_code')
        .eq('tenant_code', code)
        .maybeSingle();
      
      if (!data) {
        return code;
      }
    }
    
    // Fallback: usar timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `TEN${timestamp}`;
  }
}

// ====================================================================
// HOOK PARA USO EM COMPONENTES REACT
// ====================================================================

export const useTenantService = () => {
  const createTenant = async (tenantData: CreateTenantData) => {
    return await TenantService.createTenant(tenantData);
  };
  
  const updateTenant = async (tenantId: string, updates: UpdateTenantData) => {
    return await TenantService.updateTenant(tenantId, updates);
  };
  
  const deleteTenant = async (tenantId: string) => {
    return await TenantService.deleteTenant(tenantId);
  };
  
  const getTenantById = async (tenantId: string) => {
    return await TenantService.getTenantById(tenantId);
  };
  
  const getAllTenants = async () => {
    return await TenantService.getAllTenants();
  };
  
  return {
    createTenant,
    updateTenant,
    deleteTenant,
    getTenantById,
    getAllTenants,
    checkCnpjExists: TenantService.checkCnpjExists,
    markTenantAsHavingAdmin: TenantService.markTenantAsHavingAdmin
  };
};

export default TenantService;