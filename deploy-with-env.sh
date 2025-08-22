#!/bin/bash

# =====================================================
# SCRIPT DE DEPLOY SEGURO COM VARIÁVEIS DE AMBIENTE
# =====================================================

set -e  # Exit on any error

echo "🚀 Iniciando deploy seguro do DigiUrban2..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error "Arquivo .env.production não encontrado!"
    print_warning "Copie .env.production.example para .env.production e configure os valores reais."
    print_warning "cp .env.production.example .env.production"
    exit 1
fi

print_success "Arquivo .env.production encontrado"

# Load environment variables from .env.production
print_status "Carregando variáveis de ambiente de .env.production..."
set -a  # Automatically export all variables
source .env.production
set +a

# Validate critical environment variables
print_status "Validando variáveis críticas..."

required_vars=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY" 
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "As seguintes variáveis críticas não estão configuradas:"
    for var in "${missing_vars[@]}"; do
        print_error "  - $var"
    done
    print_warning "Configure todas as variáveis em .env.production antes de prosseguir"
    exit 1
fi

print_success "Todas as variáveis críticas estão configuradas"

# Validate JWT format for keys
print_status "Validando formato das chaves JWT..."

if [[ ! "$VITE_SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    print_error "VITE_SUPABASE_ANON_KEY não parece ser um JWT válido"
    exit 1
fi

if [[ ! "$SUPABASE_SERVICE_ROLE_KEY" =~ ^eyJ ]]; then
    print_error "SUPABASE_SERVICE_ROLE_KEY não parece ser um JWT válido"
    exit 1
fi

print_success "Formato das chaves JWT validado"

# Stop existing containers
print_status "Parando containers existentes..."
docker-compose down --remove-orphans || true

# Remove old images to force rebuild
print_status "Removendo imagens antigas..."
docker image prune -f || true

# Build and deploy with environment variables
print_status "Construindo e deployando aplicação..."
print_warning "Este processo pode levar alguns minutos..."

# Build with environment variables passed as build args
docker-compose up --build -d

# Wait for container to be healthy
print_status "Aguardando container ficar saudável..."
timeout=300  # 5 minutes
counter=0

while ! docker-compose ps digiurban2 | grep -q "healthy"; do
    if [ $counter -ge $timeout ]; then
        print_error "Timeout: Container não ficou saudável em 5 minutos"
        docker-compose logs digiurban2
        exit 1
    fi
    
    echo -n "."
    sleep 5
    counter=$((counter + 5))
done

echo ""
print_success "Container está saudável!"

# Show final status
print_status "Status final dos containers:"
docker-compose ps

print_status "Logs recentes:"
docker-compose logs --tail=20 digiurban2

print_success "🎉 Deploy completado com sucesso!"
print_success "Aplicação disponível em: http://localhost:3002"

# Show important information
echo ""
echo "==================== INFORMAÇÕES IMPORTANTES ===================="
print_warning "1. Variáveis de ambiente foram carregadas de .env.production"
print_warning "2. NUNCA commite .env.production no Git"
print_warning "3. Mantenha .env.production seguro e com permissões adequadas"
print_warning "4. Monitore os logs: docker-compose logs -f digiurban2"
echo "=================================================================="