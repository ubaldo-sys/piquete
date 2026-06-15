#!/bin/bash
# =============================================================================
# testar-stack.sh
# Bateria de testes para verificar se toda a stack está funcionando.
# =============================================================================

# ── Cores ─────────────────────────────────────────────────────────────────────
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m'

PASSOU=0
FALHOU=0

ok()    { echo -e "  ${VERDE}✔${NC} $1"; PASSOU=$((PASSOU + 1)); }
falha() { echo -e "  ${VERMELHO}✘${NC} $1"; FALHOU=$((FALHOU + 1)); }
aviso() { echo -e "  ${AMARELO}⚠${NC} $1"; }
titulo(){ echo -e "\n${AZUL}▶ $1${NC}"; }

DOCKER_COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJETO_DIR="/run/media/mauro/290D3DC253282DEF/Workspace/Piquete"

echo ""
echo "=============================================="
echo "  Piquete — Bateria de Testes da Stack"
echo "=============================================="

# ══════════════════════════════════════════════════
titulo "1. Docker"
# ══════════════════════════════════════════════════

if command -v docker &>/dev/null; then
  ok "Docker instalado ($(docker --version | cut -d' ' -f3 | tr -d ','))"
else
  falha "Docker não encontrado"
fi

if docker info &>/dev/null; then
  ok "Docker daemon rodando"
else
  falha "Docker daemon não está rodando"
fi

# ══════════════════════════════════════════════════
titulo "2. Containers"
# ══════════════════════════════════════════════════

for container in postgres n8n evolution portainer cloudflared; do
  STATUS=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
  if [ "$STATUS" = "running" ]; then
    ok "Container '$container' está running"
  else
    falha "Container '$container' não está running (status: ${STATUS:-não encontrado})"
  fi
done

# ══════════════════════════════════════════════════
titulo "3. Portas locais"
# ══════════════════════════════════════════════════

check_porta() {
  local PORTA=$1
  local NOME=$2
  if curl -s --max-time 3 "http://localhost:$PORTA" -o /dev/null; then
    ok "$NOME respondendo na porta $PORTA"
  else
    falha "$NOME não responde na porta $PORTA"
  fi
}

check_porta 5678 "n8n"
check_porta 8080 "Evolution API"
check_porta 9000 "Portainer"

# ══════════════════════════════════════════════════
titulo "4. Cloudflare Tunnel"
# ══════════════════════════════════════════════════

TUNNEL_URL=$(docker logs cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | head -1)

if [ -n "$TUNNEL_URL" ]; then
  ok "URL do tunnel encontrada: $TUNNEL_URL"

  # Testa se a URL é acessível externamente
  HTTP_CODE=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$TUNNEL_URL" 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "301" ]; then
    ok "Tunnel acessível externamente (HTTP $HTTP_CODE)"
  else
    falha "Tunnel não acessível externamente (HTTP $HTTP_CODE)"
  fi
else
  falha "URL do tunnel não encontrada nos logs"
fi

# ══════════════════════════════════════════════════
titulo "5. Evolution API"
# ══════════════════════════════════════════════════

EVOL_RESP=$(curl -s --max-time 5 http://localhost:8080/instance/fetchInstances \
  -H "apikey: minha-chave-secreta" 2>/dev/null)

if echo "$EVOL_RESP" | grep -q "\["; then
  ok "Evolution API respondendo com autenticação"

  # Verifica se a instância piquete existe
  if echo "$EVOL_RESP" | grep -q "piquete"; then
    ok "Instância 'piquete' encontrada"

    # Verifica se está conectada ao WhatsApp
    ESTADO=$(curl -s --max-time 5 \
      "http://localhost:8080/instance/connectionState/piquete" \
      -H "apikey: minha-chave-secreta" 2>/dev/null)

    if echo "$ESTADO" | grep -q '"open"'; then
      ok "WhatsApp conectado (estado: open)"
    elif echo "$ESTADO" | grep -q '"connecting"'; then
      aviso "WhatsApp conectando — escaneie o QR Code"
    else
      aviso "WhatsApp não conectado — rode: curl http://localhost:8080/instance/connect/piquete -H 'apikey: minha-chave-secreta'"
    fi
  else
    aviso "Instância 'piquete' não encontrada — crie com o comando de setup"
  fi
else
  falha "Evolution API não autenticou (verifique a apikey)"
fi

# ══════════════════════════════════════════════════
titulo "6. n8n Webhook"
# ══════════════════════════════════════════════════

if [ -n "$TUNNEL_URL" ]; then
  WEBHOOK_URL="$TUNNEL_URL/webhook/enviar-cobranca"
  RESP=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"membro":{"id":0,"nome_completo":"Teste","cpf":0,"email":"teste@teste.com","telefone":"51999999999","status_pagamento":"atrasado"},"data_envio":"2026-01-01T00:00:00Z"}' \
    2>/dev/null)

  if [ "$RESP" = "200" ] || [ "$RESP" = "500" ]; then
    ok "Webhook do n8n acessível via tunnel (HTTP $RESP)"
  else
    falha "Webhook não respondeu corretamente (HTTP $RESP)"
  fi
else
  aviso "Teste do webhook ignorado — tunnel não disponível"
fi

# ══════════════════════════════════════════════════
titulo "7. Projeto React"
# ══════════════════════════════════════════════════

if [ -f "$PROJETO_DIR/package.json" ]; then
  ok "Pasta do projeto encontrada"
else
  falha "Pasta do projeto não encontrada em: $PROJETO_DIR"
fi

if [ -f "$PROJETO_DIR/.env" ]; then
  ok "Arquivo .env encontrado"

  if grep -q "VITE_SUPABASE_URL" "$PROJETO_DIR/.env" && \
     ! grep -q "xxxx" "$PROJETO_DIR/.env"; then
    ok "VITE_SUPABASE_URL configurada"
  else
    falha "VITE_SUPABASE_URL não configurada ou com valor de exemplo"
  fi

  if grep -q "VITE_SUPABASE_ANON_KEY" "$PROJETO_DIR/.env" && \
     ! grep -q "\.\.\." "$PROJETO_DIR/.env"; then
    ok "VITE_SUPABASE_ANON_KEY configurada"
  else
    falha "VITE_SUPABASE_ANON_KEY não configurada ou com valor de exemplo"
  fi

  WEBHOOK_ENV=$(grep "VITE_WEBHOOK_URL" "$PROJETO_DIR/.env" | cut -d'=' -f2 | tr -d '"')
  if [ -n "$WEBHOOK_ENV" ] && echo "$WEBHOOK_ENV" | grep -q "trycloudflare"; then
    ok "VITE_WEBHOOK_URL configurada: $WEBHOOK_ENV"
  else
    aviso "VITE_WEBHOOK_URL não configurada ou desatualizada"
  fi
else
  falha "Arquivo .env não encontrado"
fi

# ══════════════════════════════════════════════════
titulo "8. Firebase e site"
# ══════════════════════════════════════════════════

if command -v firebase &>/dev/null; then
  ok "Firebase CLI instalado ($(firebase --version))"
else
  falha "Firebase CLI não encontrado"
fi

SITE_CODE=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
  "https://piquete-417f6.web.app" 2>/dev/null)

if [ "$SITE_CODE" = "200" ]; then
  ok "Site no ar: https://piquete-417f6.web.app (HTTP 200)"
else
  falha "Site não acessível (HTTP $SITE_CODE)"
fi

# ══════════════════════════════════════════════════
# Resultado final
# ══════════════════════════════════════════════════

TOTAL=$((PASSOU + FALHOU))
echo ""
echo "=============================================="
echo -e "  Resultado: ${VERDE}$PASSOU passou${NC} / ${VERMELHO}$FALHOU falhou${NC} / $TOTAL total"
echo "=============================================="

if [ $FALHOU -eq 0 ]; then
  echo -e "\n  ${VERDE}✔ Stack completamente operacional!${NC}\n"
  exit 0
else
  echo -e "\n  ${VERMELHO}✘ Corrija os itens acima antes de usar.${NC}\n"
  exit 1
fi
