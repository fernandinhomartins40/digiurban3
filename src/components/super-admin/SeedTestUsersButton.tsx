import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { supabase } from '../../integrations/supabase/client';
import { Users, Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SeedResult {
  email: string;
  status: 'created' | 'exists' | 'error';
  message: string;
  user_id?: string;
}

interface SeedResponse {
  success: boolean;
  summary: {
    created: number;
    exists: number;
    errors: number;
    total: number;
  };
  results: SeedResult[];
  error?: string;
}

export function SeedTestUsersButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SeedResponse | null>(null);

  const handleSeedUsers = async () => {
    try {
      setIsLoading(true);
      setResults(null);
      
      console.log('🚀 Iniciando criação de usuários de teste...');
      
      const { data, error } = await supabase.functions.invoke('seed-test-users', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResults(data as SeedResponse);
      console.log('✅ Usuários criados com sucesso:', data);
      
    } catch (error) {
      console.error('❌ Erro ao criar usuários:', error);
      setResults({
        success: false,
        error: error.message || 'Erro desconhecido',
        summary: { created: 0, exists: 0, errors: 1, total: 0 },
        results: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'exists':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuários de Teste
        </CardTitle>
        <CardDescription>
          Criar usuários de teste para todos os perfis do sistema (auto-confirmados)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Esta função irá criar os seguintes usuários com senha <code className="bg-muted px-1 rounded">password123</code>:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• <strong>superadmin@digiurban.com.br</strong> - Super Administrador</li>
            <li>• <strong>admin@digiurban.com.br</strong> - Administrador Municipal</li>
            <li>• <strong>secretario@digiurban.com.br</strong> - Secretário</li>
            <li>• <strong>diretor@digiurban.com.br</strong> - Diretor</li>
            <li>• <strong>coordenador@digiurban.com.br</strong> - Coordenador</li>
            <li>• <strong>funcionario@digiurban.com.br</strong> - Funcionário</li>
            <li>• <strong>atendente@digiurban.com.br</strong> - Atendente</li>
            <li>• <strong>cidadao@digiurban.com.br</strong> - Cidadão</li>
          </ul>
        </div>

        <Button 
          onClick={handleSeedUsers} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando usuários...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Criar Usuários de Teste
            </>
          )}
        </Button>

        {results && (
          <div className="space-y-3">
            {results.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Processo concluído!</strong><br />
                  Criados: {results.summary.created} | 
                  Já existiam: {results.summary.exists} | 
                  Erros: {results.summary.errors}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro:</strong> {results.error}
                </AlertDescription>
              </Alert>
            )}

            {results.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Detalhes:</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(result.status)}
                      <span className="font-mono">{result.email}</span>
                      <span className="text-muted-foreground">- {result.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}