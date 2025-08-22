#!/bin/bash
# ====================================================================
# SCRIPT DE VERIFICAÇÃO SSL - DIGIURBAN.COM.BR
# Data: 20/08/2025
# Uso: bash verify-ssl-fix.sh
# ====================================================================

echo "🔍 VERIFICANDO CONFIGURAÇÃO SSL DO DIGIURBAN.COM.BR"
echo "=================================================="

# Função para verificar headers
check_headers() {
    echo ""
    echo "📋 Verificando headers de segurança..."
    
    # Verificar HSTS
    hsts=$(curl -s -I https://digiurban.com.br | grep -i "strict-transport-security")
    if [ -n "$hsts" ]; then
        echo "✅ HSTS: $hsts"
    else
        echo "❌ HSTS: Não encontrado"
    fi
    
    # Verificar X-Content-Type-Options
    xcto=$(curl -s -I https://digiurban.com.br | grep -i "x-content-type-options")
    if [ -n "$xcto" ]; then
        echo "✅ X-Content-Type-Options: $xcto"
    else
        echo "❌ X-Content-Type-Options: Não encontrado"
    fi
    
    # Verificar X-Frame-Options
    xfo=$(curl -s -I https://digiurban.com.br | grep -i "x-frame-options")
    if [ -n "$xfo" ]; then
        echo "✅ X-Frame-Options: $xfo"
    else
        echo "❌ X-Frame-Options: Não encontrado"
    fi
    
    # Verificar X-XSS-Protection
    xxp=$(curl -s -I https://digiurban.com.br | grep -i "x-xss-protection")
    if [ -n "$xxp" ]; then
        echo "✅ X-XSS-Protection: $xxp"
    else
        echo "❌ X-XSS-Protection: Não encontrado"
    fi
}

# Função para verificar SSL
check_ssl() {
    echo ""
    echo "🔒 Verificando certificado SSL..."
    
    # Verificar se HTTPS funciona
    http_code=$(curl -s -o /dev/null -w "%{http_code}" https://digiurban.com.br)
    if [ "$http_code" = "200" ]; then
        echo "✅ HTTPS Status: $http_code (OK)"
    else
        echo "❌ HTTPS Status: $http_code"
    fi
    
    # Verificar redirecionamento HTTP -> HTTPS
    redirect_code=$(curl -s -o /dev/null -w "%{http_code}" http://digiurban.com.br)
    if [ "$redirect_code" = "301" ] || [ "$redirect_code" = "302" ]; then
        echo "✅ HTTP Redirect: $redirect_code (OK)"
    else
        echo "❌ HTTP Redirect: $redirect_code"
    fi
    
    # Verificar SSL com openssl (se disponível)
    if command -v openssl &> /dev/null; then
        echo ""
        echo "🔐 Detalhes do certificado:"
        echo | openssl s_client -servername digiurban.com.br -connect digiurban.com.br:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer
    fi
}

# Função para verificar nginx
check_nginx() {
    echo ""
    echo "🌐 Verificando status do nginx..."
    
    if command -v nginx &> /dev/null; then
        # Testar configuração
        if nginx -t &> /dev/null; then
            echo "✅ Configuração nginx: Válida"
        else
            echo "❌ Configuração nginx: Inválida"
            nginx -t
        fi
        
        # Verificar se está rodando
        if systemctl is-active --quiet nginx 2>/dev/null; then
            echo "✅ Status nginx: Ativo"
        elif pgrep nginx > /dev/null; then
            echo "✅ Status nginx: Rodando"
        else
            echo "❌ Status nginx: Não está rodando"
        fi
    else
        echo "⚠️ Nginx não encontrado (verificação local)"
    fi
}

# Executar verificações
check_ssl
check_headers
check_nginx

echo ""
echo "🎯 RECOMENDAÇÕES FINAIS:"
echo "========================"
echo "1. Teste o site em diferentes navegadores"
echo "2. Use modo incógnito para evitar cache"
echo "3. Verifique ferramentas online:"
echo "   - https://www.ssllabs.com/ssltest/analyze.html?d=digiurban.com.br"
echo "   - https://securityheaders.com/?q=digiurban.com.br"
echo "4. Se ainda houver avisos, verifique o console do navegador (F12)"
echo ""
echo "✅ Verificação concluída!"