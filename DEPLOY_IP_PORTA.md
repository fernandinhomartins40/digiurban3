# DEPLOY DIGIURBAN2 - VPS 72.60.10.112:3010

Deploy configurado para **acesso direto via IP:porta SEM domínio ou SSL**.

## 🎯 Acesso da Aplicação
**URL: http://72.60.10.112:3010**

## 📋 Configurações Atualizadas

### Arquitetura de Deploy
```
Internet → VPS:3010 (Nginx) → Container:8080 (React App)
```

### Arquivos Modificados
- ✅ `.env.nova_vps` - Removido DOMAIN, CORS para IP:porta
- ✅ `deploy_nova_vps.sh` - Nginx configurado para IP:porta, sem SSL
- ✅ `nginx-vps-config.conf` - Proxy para porta 8080, sem HTTPS
- ✅ Firewall configurado para porta 3010 (não mais 80/443)

## 🚀 Como Fazer Deploy

### 1. Upload da Aplicação (Máquina Local)
```bash
chmod +x deploy_upload.sh
./deploy_upload.sh
```

### 2. Configurar VPS (Na VPS)
```bash
ssh root@72.60.10.112
cd /opt/digiurban2
./deploy_nova_vps.sh
```

### 3. Subir Aplicação
```bash
docker-compose up -d --build
```

## 🔧 Configurações Técnicas

### Nginx
- **Porta de escuta:** 3010
- **Server name:** 72.60.10.112
- **Proxy pass:** http://127.0.0.1:8080
- **Protocolo:** HTTP (sem SSL)

### Docker
- **Container:** digiurban2-app
- **Porta externa:** 8080
- **Porta interna:** 80

### Firewall (UFW)
```bash
sudo ufw allow ssh
sudo ufw allow 3010
```

## 📊 URLs de Teste

### Health Check
- **URL:** http://72.60.10.112:3010/health
- **Resposta esperada:** "DigiUrban React App - HTTP - IP:3010 -> Container Port 8080"

### Aplicação
- **URL:** http://72.60.10.112:3010/
- **Funcionalidade:** Interface completa da aplicação

## 🛠️ Comandos Úteis

### Gerenciamento da Aplicação
```bash
# Ver logs da aplicação
docker-compose logs -f

# Reiniciar aplicação
docker-compose restart

# Rebuild completo
docker-compose down && docker-compose up -d --build

# Status dos containers
docker-compose ps
```

### Gerenciamento do Nginx
```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/digiurban-ip.access.log
sudo tail -f /var/log/nginx/digiurban-ip.error.log
```

### Testes de Conectividade
```bash
# Teste local na VPS
curl -I http://localhost:3010/health

# Teste do container
curl -I http://localhost:8080

# Teste remoto (da sua máquina)
curl -I http://72.60.10.112:3010/health
```

## ⚠️ Importantes

### O que FOI REMOVIDO
- ❌ Configuração de domínio (digiurban.com.br)
- ❌ Certificados SSL/HTTPS
- ❌ Certbot
- ❌ Redirecionamentos HTTPS
- ❌ Firewall para portas 80/443

### O que FOI MANTIDO
- ✅ Headers de segurança
- ✅ Proxy reverso
- ✅ WebSocket support
- ✅ Logs detalhados
- ✅ Health checks
- ✅ Cache de assets estáticos

## 🔍 Troubleshooting

### Se a aplicação não carregar
```bash
# 1. Verificar se o Nginx está ouvindo na porta 3010
sudo netstat -tulpn | grep :3010

# 2. Verificar se o container está rodando na porta 8080
sudo netstat -tulpn | grep :8080
docker-compose ps

# 3. Verificar logs
docker-compose logs -f
sudo tail -f /var/log/nginx/error.log
```

### Se houver erro de CORS
- As configurações de CORS foram atualizadas para `http://72.60.10.112:3010`
- Verificar se o Supabase aceita requisições desta origem

### Se o health check falhar
```bash
# Teste direto no container
curl -I http://localhost:8080

# Teste no Nginx
curl -I http://localhost:3010/health
```