import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  Check,
  AlertCircle,
  Loader2,
  Key,
  Send,
  CheckCircle2,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useTenantUserService } from '../../services/tenantUserService';

// ====================================================================
// INTERFACES E TIPOS
// ====================================================================

interface CreateTenantAdminForm {
  tenant_id: string; // Tenant já existe
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  tipo_usuario: 'admin' | 'usuario';
}

export interface Tenant {
  id: string;
  nome: string;
  tenant_code: string;
  cidade: string;
  estado: string;
  has_admin?: boolean;
}

interface UserCredentials {
  email: string;
  password: string;
  user_id: string;
}

interface CreateTenantAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: CreateTenantAdminForm, credentials: UserCredentials) => void;
  tenant: Tenant | null; // Tenant já selecionado
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================

const CreateTenantAdminModal: React.FC<CreateTenantAdminModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tenant
}) => {
  const { createAdminForTenant, createUserForTenant, checkEmailExists } = useTenantUserService();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userCredentials, setUserCredentials] = useState<UserCredentials | null>(null);
  const [formData, setFormData] = useState<CreateTenantAdminForm>({
    tenant_id: tenant?.id || '',
    nome: '',
    email: '',
    telefone: '',
    cargo: 'Prefeito',
    tipo_usuario: 'admin'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ====================================================================
  // FUNÇÕES DE VALIDAÇÃO
  // ====================================================================

  const validateStep1 = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    
    // Validação de email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Verificar se email já existe
    if (formData.email && !newErrors.email) {
      try {
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
          newErrors.email = 'Este email já está cadastrado no sistema';
        }
      } catch (error) {
        console.warn('Erro ao verificar email:', error);
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ====================================================================
  // HANDLERS
  // ====================================================================

  const handleInputChange = (field: keyof CreateTenantAdminForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 1 && await validateStep1()) {
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('👤 Criando usuário para tenant existente:', tenant?.nome);
      
      // Verificar se tenant existe
      if (!tenant) {
        throw new Error('Nenhum tenant selecionado');
      }
      
      // Criar usuário usando TenantUserService
      const userResult = formData.tipo_usuario === 'admin' 
        ? await createAdminForTenant(tenant.id, {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cargo: formData.cargo,
            send_email: true
          })
        : await createUserForTenant(tenant.id, {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cargo: formData.cargo,
            send_email: true
          });

      // Salvar credenciais para exibir
      const credentials: UserCredentials = {
        email: userResult.email,
        password: userResult.temporary_password,
        user_id: userResult.user_id
      };
      
      setUserCredentials(credentials);

      console.log('✅ Usuário criado com sucesso!');
      
      // Chamar callback do componente pai
      onSubmit(formData, credentials);
      
      // Ir para step final
      setStep(3);
      
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      alert(`Erro ao criar usuário: ${error.message}\n\nPor favor, tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setUserCredentials(null);
    setFormData({
      tenant_id: tenant?.id || '',
      nome: '',
      email: '',
      telefone: '',
      cargo: 'Prefeito',
      tipo_usuario: 'admin'
    });
    setErrors({});
    onClose();
  };

  // ====================================================================
  // RENDER DOS STEPS
  // ====================================================================

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600">
        <User className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Dados do Usuário</h3>
      </div>
      
      {/* Informações do Tenant */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-blue-900">
            <Building2 className="h-4 w-4" />
            Tenant Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nome:</strong> {tenant?.nome}</div>
            <div><strong>Código:</strong> {tenant?.tenant_code}</div>
            <div><strong>Localização:</strong> {tenant?.cidade}, {tenant?.estado}</div>
            <div><strong>Status:</strong> {tenant?.has_admin ? '✅ Com admin' : '⏳ Sem admin'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome Completo *</label>
          <Input
            placeholder="Ex: João Silva"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cargo</label>
          <select
            value={formData.cargo}
            onChange={(e) => handleInputChange('cargo', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="Prefeito">Prefeito</option>
            <option value="Vice-Prefeito">Vice-Prefeito</option>
            <option value="Secretário">Secretário</option>
            <option value="Diretor de TI">Diretor de TI</option>
            <option value="Administrador">Administrador</option>
            <option value="Gerente">Gerente</option>
            <option value="Coordenador">Coordenador</option>
            <option value="Analista">Analista</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email *</label>
          <Input
            type="email"
            placeholder="email@prefeitura.gov.br"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone *</label>
          <Input
            placeholder="(11) 99999-9999"
            value={formData.telefone}
            onChange={(e) => handleInputChange('telefone', e.target.value)}
            className={errors.telefone ? 'border-red-500' : ''}
          />
          {errors.telefone && <p className="text-xs text-red-500">{errors.telefone}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Usuário</label>
        <select
          value={formData.tipo_usuario}
          onChange={(e) => handleInputChange('tipo_usuario', e.target.value as 'admin' | 'usuario')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="admin">Administrador (acesso total)</option>
          <option value="usuario">Usuário (acesso limitado)</option>
        </select>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900">Informações Importantes</h4>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Uma senha temporária será gerada automaticamente</li>
              <li>• As credenciais serão enviadas por email</li>
              <li>• O usuário deve alterar a senha no primeiro acesso</li>
              <li>• Administradores têm acesso total ao sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600">
        <Check className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Confirmação</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        Revise os dados antes de criar o usuário. As informações podem ser editadas posteriormente.
      </p>

      <div className="grid grid-cols-1 gap-6">
        {/* Dados do Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {tenant?.nome}</div>
            <div><strong>Código:</strong> {tenant?.tenant_code}</div>
            <div><strong>Localização:</strong> {tenant?.cidade}, {tenant?.estado}</div>
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Usuário a ser Criado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {formData.nome}</div>
            <div><strong>Email:</strong> {formData.email}</div>
            <div><strong>Telefone:</strong> {formData.telefone}</div>
            <div><strong>Cargo:</strong> {formData.cargo}</div>
            <div><strong>Tipo:</strong> {formData.tipo_usuario === 'admin' ? 'Administrador' : 'Usuário'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-green-900">Usuário Criado com Sucesso!</h3>
          <p className="text-sm text-gray-600 mt-2">
            O usuário foi criado e as credenciais foram enviadas por email.
          </p>
        </div>
      </div>

      {userCredentials && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Key className="h-5 w-5" />
              Credenciais de Acesso
            </CardTitle>
            <CardDescription className="text-green-700">
              Credenciais temporárias para o usuário criado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Email de Acesso
                </label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm">{userCredentials.email}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(userCredentials.email)}
                    className="text-green-600 border-green-200"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Senha Temporária
                </label>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm font-bold">{userCredentials.password}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(userCredentials.password)}
                    className="text-green-600 border-green-200"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <Send className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Email Enviado</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    As credenciais foram enviadas para <strong>{userCredentials.email}</strong>.
                    O usuário deve alterar a senha no primeiro acesso.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-900">Próximos Passos</h4>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Usuário pode fazer login com as credenciais enviadas</li>
                    <li>• Senha temporária deve ser alterada no primeiro acesso</li>
                    <li>• Acesso via: <span className="font-mono">{window.location.origin}/auth/login</span></li>
                    <li>• Tenant agora possui usuário ativo</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ====================================================================
  // RENDER PRINCIPAL
  // ====================================================================

  if (!tenant) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-blue-600" />
            Criar Usuário para {tenant.nome}
          </DialogTitle>
          <DialogDescription>
            Criar usuário administrador ou comum para tenant existente
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`
                  w-12 h-0.5 mx-2 
                  ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && step < 3 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {step < 3 && (
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
            )}
            
            {step < 2 ? (
              <Button onClick={handleNext} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Próximo'
                )}
              </Button>
            ) : step === 2 ? (
              <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </Button>
            ) : (
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                Finalizar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTenantAdminModal;