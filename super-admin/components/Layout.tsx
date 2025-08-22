'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { UserProfile } from '@/lib/supabase'
import { 
  Shield, 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: any
  current?: boolean
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const { logout, checkAuth } = useAuth()

  // Verificar autenticação
  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    const { isAuthenticated, user: userData } = await checkAuth()
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    setUser(userData!)
    setLoading(false)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-primary-700">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-white" />
                <span className="ml-2 text-white font-semibold">DigiUrban</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-5 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-primary-100 hover:bg-primary-600 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-primary-700">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Shield className="h-8 w-8 text-white" />
            <span className="ml-2 text-white font-semibold text-lg">DigiUrban</span>
          </div>
          <nav className="mt-5 flex-1 space-y-1 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-primary-100 hover:bg-primary-600 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* User Info */}
          <div className="flex flex-shrink-0 border-t border-primary-600 p-4">
            <div className="group block w-full flex-shrink-0">
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.nome_completo?.charAt(0)?.toUpperCase() || 'SA'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.nome_completo || 'Super Admin'}
                  </p>
                  <p className="text-xs text-primary-200">
                    Super Administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1">
              {/* Search */}
              <div className="flex w-full md:ml-0">
                <label htmlFor="search-field" className="sr-only">
                  Pesquisar
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    id="search-field"
                    className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    placeholder="Pesquisar tenants, usuários..."
                    type="search"
                    name="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <button
                type="button"
                className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="ml-3 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                title="Logout"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}