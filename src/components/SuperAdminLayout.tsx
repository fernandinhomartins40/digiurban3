import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  DollarSign, 
  BarChart3, 
  Shield, 
  Settings,
  Monitor,
  LogOut,
  Menu,
  X,
  Home,
  Zap,
  Calendar,
  Users,
  Database
} from 'lucide-react';
import { useAuth } from '@/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile: user, logout: signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Detectar mudanças de tamanho da tela e configurar estado inicial
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1280; // Aumentado para xl (1280px)
      setIsMobile(mobile);
      
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Configurar estado inicial
    handleResize();

    // Usar debounce para melhor performance
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedHandleResize);
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const navigationItems = [
    {
      name: 'Dashboard Executivo',
      href: '/super-admin/dashboard',
      icon: LayoutDashboard,
      description: 'KPIs e métricas SaaS'
    },
    {
      name: 'Gestão de Tenants',
      href: '/super-admin/tenants',
      icon: Building2,
      description: 'Administrar prefeituras'
    },
    {
      name: 'Gestão de Usuários',
      href: '/super-admin/users',
      icon: Users,
      description: 'Administrar usuários'
    },
    {
      name: 'Gestão Financeira',
      href: '/super-admin/billing',
      icon: DollarSign,
      description: 'Billing e receitas'
    },
    {
      name: 'Analytics',
      href: '/super-admin/analytics',
      icon: BarChart3,
      description: 'Relatórios empresariais'
    },
    {
      name: 'Monitoramento',
      href: '/super-admin/monitoring',
      icon: Monitor,
      description: 'Sistema técnico'
    },
    {
      name: 'Ferramentas',
      href: '/super-admin/operations',
      icon: Shield,
      description: 'Operações'
    },
    {
      name: 'Configurações',
      href: '/super-admin/settings',
      icon: Settings,
      description: 'Config globais'
    },
    {
      name: 'Schema DB',
      href: '/super-admin/schema',
      icon: Database,
      description: 'Estrutura BD'
    }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || (href === '/super-admin/dashboard' && location.pathname === '/super-admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex relative">
      
      {/* Overlay mobile */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 xl:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-80' : 'w-0 xl:w-16'} 
        ${isMobile 
          ? 'fixed left-0 top-0 h-full z-50' 
          : 'relative'
        }
        bg-white/90 backdrop-blur-lg border-r border-gray-200/50 shadow-xl
        transition-all duration-300 ease-in-out flex flex-col
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        min-h-screen max-h-screen overflow-hidden
      `}>
        
        {/* Header da Sidebar */}
        <header className="flex-shrink-0 p-4 xl:p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <div className="flex items-center justify-between min-h-[48px]">
            {(isSidebarOpen || !isMobile) && (
              <div className={`flex-1 transition-opacity duration-200 ${!isSidebarOpen && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                <h1 className="text-xl xl:text-2xl font-bold leading-tight">
                  <span className="text-blue-600 mr-2">🎛️</span>
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Super Admin
                  </span>
                </h1>
                <p className="text-xs xl:text-sm text-gray-600 mt-1 font-medium">Centro de Comando SaaS</p>
              </div>
            )}
            
            {/* Toggle button - sempre visível no desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/70 p-2 rounded-lg transition-all duration-200 flex-shrink-0 ml-auto"
              aria-label={isSidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4 xl:h-5 xl:w-5" />
              ) : (
                <Menu className="h-4 w-4 xl:h-5 xl:w-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Status do Sistema */}
        {isSidebarOpen && (
          <div className="flex-shrink-0 px-4 xl:px-6 py-3 xl:py-4 border-b border-gray-200/50 bg-gradient-to-r from-green-50/70 to-emerald-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-xs xl:text-sm font-medium text-green-700">Sistema Online</span>
              </div>
              <Badge variant="outline" className="bg-white/70 text-xs border-green-200/50">
                <Zap className="h-3 w-3 mr-1 text-orange-500" />
                Produção
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span>Atualizado há 2 min</span>
            </div>
          </div>
        )}

        {/* Navegação Principal */}
        <nav className="flex-1 px-3 xl:px-4 py-4 space-y-1 xl:space-y-2 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            const IconComponent = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center w-full rounded-xl transition-all duration-200 
                  ${isSidebarOpen 
                    ? 'gap-3 px-3 py-3' 
                    : 'justify-center p-3 xl:p-2'
                  }
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10 text-blue-700 border border-blue-200/50 shadow-sm ring-1 ring-blue-100/50' 
                    : 'text-gray-700 hover:bg-gray-50/80 hover:text-blue-600 hover:shadow-sm'
                  }
                `}
                title={!isSidebarOpen ? item.name : undefined}
              >
                {/* Icon Container */}
                <div className={`
                  flex items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0
                  ${isSidebarOpen ? 'p-2' : 'p-1'}
                  ${isActive 
                    ? 'bg-blue-100 text-blue-600 shadow-sm' 
                    : 'bg-gray-100/70 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  }
                `}>
                  <IconComponent className={`
                    ${isSidebarOpen ? 'h-5 w-5' : 'h-5 w-5 xl:h-4 xl:w-4'} 
                    transition-all duration-200
                    ${isActive ? 'text-blue-600' : 'text-current'}
                  `} />
                </div>
                
                {/* Content - só aparece quando sidebar está aberta */}
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-tight truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 leading-tight truncate mt-0.5">{item.description}</p>
                      </div>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 ml-2 flex-shrink-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Indicador ativo para sidebar collapsed */}
                {!isSidebarOpen && isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-l-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Botão de Voltar ao Site */}
        <div className={`flex-shrink-0 border-t border-gray-200/50 ${isSidebarOpen ? 'p-4' : 'p-2 xl:p-3'}`}>
          {isSidebarOpen && (
            <Link
              to="/"
              className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-blue-600 mb-3"
            >
              <div className="flex items-center justify-center p-2 rounded-lg bg-gray-100/70 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-200 flex-shrink-0">
                <Home className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight truncate">Voltar ao Site</p>
                <p className="text-xs text-gray-500 leading-tight truncate">DigiUrban Landing</p>
              </div>
            </Link>
          )}
          
          {!isSidebarOpen && (
            <Link
              to="/"
              className="group flex items-center justify-center p-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50/80 hover:text-blue-600 mb-3"
              title="Voltar ao Site"
            >
              <Home className="h-5 w-5" />
            </Link>
          )}
        </div>

        {/* User Profile & Logout */}
        <footer className={`flex-shrink-0 border-t border-gray-200/50 bg-gray-50/30 ${isSidebarOpen ? 'p-4' : 'p-2 xl:p-3'}`}>
          {/* User Profile - quando sidebar aberta */}
          {isSidebarOpen && user && (
            <div className="bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-sm rounded-xl p-3 mb-3 border border-gray-200/30 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white/20">
                  {(user.nome || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate text-gray-900">
                    {user.nome || user.fullName || 'Super Admin'}
                  </p>
                  <p className="text-xs text-gray-600 leading-tight truncate mt-0.5">
                    {user.email}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1 bg-purple-50 text-purple-700 border-purple-200/50 px-2">
                    Super Administrador
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Avatar mini - quando sidebar fechada */}
          {!isSidebarOpen && user && (
            <div className="flex justify-center mb-3">
              <div 
                className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white/20"
                title={user.nome || user.fullName || user.email}
              >
                {(user.nome || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            size={isSidebarOpen ? "default" : "sm"}
            className={`
              w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200/50 
              transition-all duration-200 shadow-sm
              ${isSidebarOpen ? 'rounded-lg' : 'rounded-lg p-2'}
            `}
            title={!isSidebarOpen ? 'Sair' : undefined}
          >
            <LogOut className={`h-4 w-4 text-red-600 ${!isSidebarOpen ? 'mx-auto' : ''}`} />
            {isSidebarOpen && <span className="ml-2 font-medium">Sair</span>}
          </Button>
        </footer>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header mobile com botão menu */}
        {isMobile && (
          <header className="flex-shrink-0 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 px-4 py-3 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100/70 -ml-2"
              >
                <Menu className="h-5 w-5" />
                <span className="ml-2 font-medium">Menu</span>
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🎛️</span>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Super Admin
                </h1>
              </div>
              <div className="w-16"></div> {/* Spacer para centralizar */}
            </div>
          </header>
        )}
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

    </div>
  );
};

export default SuperAdminLayout;