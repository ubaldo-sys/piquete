#!/bin/bash
# =============================================================================
# atualizar-tunnel.sh
# Lê a URL do Cloudflare Tunnel gerada pelo container cloudflared,
# atualiza o .env do projeto React e faz o deploy no Firebase.
# =============================================================================

set -e

# ── Configuração ──────────────────────────────────────────────────────────────
DOCKER_COMPOSE_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJETO_DIR="/run/media/mauro/290D3DC253282DEF/Workspace/Piquete"
ENV_FILE="$PROJETO_DIR/.env"
MAX_ESPERA=60   # segundos para aguardar o tunnel subir

# ── Cores para output ─────────────────────────────────────────────────────────
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
AZUL='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${AZUL}[INFO]${NC} $1"; }
ok()     { echo -e "${VERDE}[OK]${NC} $1"; }
aviso()  { echo -e "${AMARELO}[AVISO]${NC} $1"; }
erro()   { echo -e "${VERMELHO}[ERRO]${NC} $1"; exit 1; }

echo ""
echo "=============================================="
echo "  Piquete — Atualização do Tunnel e Deploy"
echo "=============================================="
echo ""

# ── 1. Subir containers ───────────────────────────────────────────────────────
log "Subindo containers Docker..."
cd "$DOCKER_COMPOSE_DIR"
docker compose up -d
ok "Containers iniciados."

# ── 2. Aguardar URL do tunnel ─────────────────────────────────────────────────
log "Aguardando Cloudflare Tunnel gerar URL (até ${MAX_ESPERA}s)..."

TUNNEL_URL=""
CONTADOR=0

while [ -z "$TUNNEL_URL" ] && [ $CONTADOR -lt $MAX_ESPERA ]; do
  TUNNEL_URL=$(docker logs cloudflared 2>&1 | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | head -1)
  if [ -z "$TUNNEL_URL" ]; then
    sleep 2
    CONTADOR=$((CONTADOR + 2))
    echo -n "."
  fi
done

echo ""

if [ -z "$TUNNEL_URL" ]; then
  erro "Timeout: URL do tunnel não encontrada em ${MAX_ESPERA}s. Verifique: docker logs cloudflared"
fi

ok "URL do tunnel: $TUNNEL_URL"

# ── 3. Atualizar .env do docker-compose ──────────────────────────────────────
log "Atualizando TUNNEL_URL no .env do docker..."
if grep -q "^TUNNEL_URL=" "$DOCKER_COMPOSE_DIR/.env"; then
  sed -i "s|^TUNNEL_URL=.*|TUNNEL_URL=$TUNNEL_URL|" "$DOCKER_COMPOSE_DIR/.env"
else
  echo "TUNNEL_URL=$TUNNEL_URL" >> "$DOCKER_COMPOSE_DIR/.env"
fi
ok ".env do docker atualizado."

# ── 4. Reiniciar n8n com a nova URL ──────────────────────────────────────────
log "Reiniciando n8n com a nova URL do webhook..."
docker compose restart n8n
ok "n8n reiniciado."

# ── 5. Atualizar .env do projeto React ───────────────────────────────────────
log "Atualizando VITE_WEBHOOK_URL no .env do projeto..."
if [ ! -f "$ENV_FILE" ]; then
  erro "Arquivo .env não encontrado em: $ENV_FILE"
fi

if grep -q "^VITE_WEBHOOK_URL=" "$ENV_FILE"; then
  sed -i "s|^VITE_WEBHOOK_URL=.*|VITE_WEBHOOK_URL=\"$TUNNEL_URL\"|" "$ENV_FILE"
else
  echo "VITE_WEBHOOK_URL=\"$TUNNEL_URL\"" >> "$ENV_FILE"
fi
ok ".env do projeto atualizado."

# ── 6. Build e deploy no Firebase ────────────────────────────────────────────
log "Fazendo build do projeto React..."
cd "$PROJETO_DIR"
npm run build 2>&1 | tail -5

log "Fazendo deploy no Firebase..."
firebase deploy --only hosting 2>&1 | tail -10

echo ""
echo "=============================================="
ok "Tudo pronto! Sistema operacional."
echo ""
echo "  Site:    https://piquete-417f6.web.app"
echo "  Tunnel:  $TUNNEL_URL"
echo "  n8n:     http://localhost:5678"
echo "  Portainer: http://localhost:9000"
echo "=============================================="
echo ""
