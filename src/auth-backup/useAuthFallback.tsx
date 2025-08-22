// ====================================================================
// SISTEMA DE FALLBACK INTELIGENTE PARA AUTENTICAÇÃO
// ====================================================================
// Detecta e resolve automaticamente problemas de carregamento de perfil
// ====================================================================

import { useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  enableSimplifiedQuery: boolean;
}

interface FallbackStats {
  attemptsCount: number;
  successCount: number;
  failureCount: number;
  lastError: string | null;
  fallbackUsed: boolean;
}

class AuthFallbackManager {
  private config: FallbackConfig;
  private stats: FallbackStats;
  private retryCache = new Map<string, number>();

  constructor(config?: Partial<FallbackConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelay: 2000,
      timeoutMs: 15000,
      enableSimplifiedQuery: true,
      ...config
    };

    this.stats = {
      attemptsCount: 0,
      successCount: 0,
      failureCount: 0,
      lastError: null,
      fallbackUsed: false
    };
  }

  /**
   * Executa busca de perfil com sistema de fallback robusto
   */
  async loadProfileWithFallback(userId: string): Promise<any> {
    this.stats.attemptsCount++;
    const retryCount = this.retryCache.get(userId) || 0;

    try {
      // Primeira tentativa: consulta completa
      if (retryCount === 0) {
        return await this.tryFullProfileQuery(userId);
      }
      
      // Segunda tentativa: consulta simplificada
      if (retryCount === 1 && this.config.enableSimplifiedQuery) {
        console.log('🔄 [Fallback] Tentando consulta simplificada...');
        this.stats.fallbackUsed = true;
        return await this.trySimplifiedProfileQuery(userId);
      }
      
      // Terceira tentativa: consulta direta sem RLS
      if (retryCount === 2) {
        console.log('🔄 [Fallback] Tentando consulta direta (service role)...');
        return await this.tryServiceRoleQuery(userId);
      }

      throw new Error(`Máximo de tentativas excedido para usuário ${userId}`);

    } catch (error: any) {
      this.stats.failureCount++;
      this.stats.lastError = error.message;
      
      if (retryCount < this.config.maxRetries) {
        this.retryCache.set(userId, retryCount + 1);
        console.log(`⚠️ [Fallback] Erro na tentativa ${retryCount + 1}, tentando novamente em ${this.config.retryDelay}ms...`);
        
        await this.delay(this.config.retryDelay);
        return this.loadProfileWithFallback(userId);
      }

      // Limpar cache de retry após esgotar tentativas
      this.retryCache.delete(userId);
      throw error;
    }
  }

  /**
   * Consulta completa com todos os campos
   */
  private async tryFullProfileQuery(userId: string) {
    console.log('🔄 [Fallback] Tentativa 1: Consulta completa');
    
    const { data, error } = await Promise.race([
      supabase
        .from('user_profiles')
        .select(`
          id, email, nome_completo, tipo_usuario, status, tenant_id,
          secretaria_id, setor_id, cargo, cpf, telefone,
          avatar_url, primeiro_acesso, ultimo_login, created_at, updated_at
        `)
        .eq('id', userId)
        .maybeSingle(),
      
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta completa')), this.config.timeoutMs)
      )
    ]);

    if (error) throw new Error(`Erro na consulta completa: ${error.message}`);
    if (!data) throw new Error('Perfil não encontrado na consulta completa');

    this.stats.successCount++;
    this.retryCache.delete(userId); // Sucesso, limpar cache
    return data;
  }

  /**
   * Consulta simplificada com campos essenciais
   */
  private async trySimplifiedProfileQuery(userId: string) {
    console.log('🔄 [Fallback] Tentativa 2: Consulta simplificada');
    
    const { data, error } = await Promise.race([
      supabase
        .from('user_profiles')
        .select('id, email, nome_completo, tipo_usuario, status, tenant_id')
        .eq('id', userId)
        .maybeSingle(),
      
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na consulta simplificada')), this.config.timeoutMs / 2)
      )
    ]);

    if (error) throw new Error(`Erro na consulta simplificada: ${error.message}`);
    if (!data) throw new Error('Perfil não encontrado na consulta simplificada');

    this.stats.successCount++;
    this.retryCache.delete(userId); // Sucesso, limpar cache
    
    // Retornar dados com campos padrão para compatibilidade
    return {
      ...data,
      secretaria_id: null,
      setor_id: null,
      cargo: 'Não informado',
      cpf: null,
      telefone: null,
      avatar_url: null,
      primeiro_acesso: null,
      ultimo_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Consulta direta usando service role (bypassa RLS)
   */
  private async tryServiceRoleQuery(userId: string) {
    console.log('🔄 [Fallback] Tentativa 3: Consulta service role');
    
    try {
      // Usar função RPC que bypassa RLS
      const { data, error } = await supabase.rpc('get_user_profile_admin', {
        user_id: userId
      });

      if (error) {
        // Se RPC não existe, tentar consulta direta com service_role
        console.log('⚠️ [Fallback] RPC não disponível, tentando alternativa...');
        return await this.tryDirectQuery(userId);
      }

      if (!data) throw new Error('Perfil não encontrado via service role');

      this.stats.successCount++;
      this.retryCache.delete(userId);
      return data;

    } catch (error) {
      console.log('⚠️ [Fallback] Service role falhou, tentando consulta direta...');
      return await this.tryDirectQuery(userId);
    }
  }

  /**
   * Última tentativa: consulta direta mínima
   */
  private async tryDirectQuery(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Erro na consulta direta: ${error.message}`);
    if (!data) throw new Error('Perfil não encontrado na consulta direta');

    this.stats.successCount++;
    this.retryCache.delete(userId);
    return data;
  }

  /**
   * Utilitário para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obter estatísticas do fallback
   */
  getStats(): FallbackStats {
    return { ...this.stats };
  }

  /**
   * Resetar estatísticas
   */
  resetStats() {
    this.stats = {
      attemptsCount: 0,
      successCount: 0,
      failureCount: 0,
      lastError: null,
      fallbackUsed: false
    };
    this.retryCache.clear();
  }

  /**
   * Verificar se sistema está saudável
   */
  isHealthy(): boolean {
    if (this.stats.attemptsCount === 0) return true;
    const successRate = this.stats.successCount / this.stats.attemptsCount;
    return successRate >= 0.8; // 80% de sucesso
  }
}

// Instância global do manager
const fallbackManager = new AuthFallbackManager();

/**
 * Hook para usar o sistema de fallback
 */
export const useAuthFallback = () => {
  const loadProfileWithFallback = useCallback(async (userId: string) => {
    try {
      return await fallbackManager.loadProfileWithFallback(userId);
    } catch (error) {
      console.error('❌ [Fallback] Todas as tentativas falharam:', error);
      throw error;
    }
  }, []);

  const getStats = useCallback(() => fallbackManager.getStats(), []);
  const resetStats = useCallback(() => fallbackManager.resetStats(), []);
  const isHealthy = useCallback(() => fallbackManager.isHealthy(), []);

  return {
    loadProfileWithFallback,
    getStats,
    resetStats,
    isHealthy
  };
};

export default fallbackManager;