#!/bin/bash

# SCRIPT DE DEPLOY DA INTEGRAÇÃO DE SUBDOMÍNIOS
# Arquivo: deploy-subdomain-integration.sh

echo "🚀 ============================================"
echo "🚀 DEPLOY DA INTEGRAÇÃO DE SUBDOMÍNIOS"
echo "🚀 ============================================"

VPS_HOST="72.60.10.108"
VPS_USER="root"

# ============================================
# 1. TRANSFERIR ARQUIVOS PARA VPS
# ============================================

echo "📤 Transferindo arquivos para VPS..."

# Transferir script de aplicação
scp apply-subdomain-patches.sh $VPS_USER@$VPS_HOST:/tmp/

echo "✅ Arquivos transferidos"

# ============================================
# 2. EXECUTAR APLICAÇÃO NA VPS
# ============================================

echo "🔧 Executando aplicação na VPS..."

ssh $VPS_USER@$VPS_HOST << 'EOF'
echo "🔧 Iniciando aplicação dos patches na VPS..."

# Tornar o script executável
chmod +x /tmp/apply-subdomain-patches.sh

# Executar o script de aplicação
/tmp/apply-subdomain-patches.sh

echo "✅ Patches aplicados na VPS"
EOF

# ============================================
# 3. REINICIAR SUPABASE MANAGER
# ============================================

echo "🔄 Reiniciando Supabase Manager..."

ssh $VPS_USER@$VPS_HOST << 'EOF'
echo "🔄 Parando Supabase Manager..."
pkill -f "node.*server.js"
sleep 3

echo "🚀 Iniciando Supabase Manager com novas configurações..."
cd /opt/supabase-manager/src
nohup node server.js > /tmp/supabase-subdomain.log 2>&1 &

sleep 5

echo "🔍 Verificando se está rodando..."
if ps aux | grep -q "node.*server.js"; then
    echo "✅ Supabase Manager rodando com sucesso"
else
    echo "❌ Erro ao iniciar Supabase Manager"
    echo "📋 Logs:"
    tail -10 /tmp/supabase-subdomain.log
fi
EOF

echo "✅ ============================================"
echo "✅ DEPLOY CONCLUÍDO"
echo "✅ ============================================"
echo "🧪 Próximo passo: Testar criação de nova instância"