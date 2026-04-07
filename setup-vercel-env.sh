#!/usr/bin/env bash
# =============================================================================
# setup-vercel-env.sh
# Crea todas las variables de entorno en tu proyecto Vercel de una vez.
#
# Requisitos previos:
#   1. npm install -g vercel
#   2. vercel login
#   3. vercel link   (ejecutar en la carpeta del proyecto, elige el proyecto correcto)
#
# Uso:
#   bash setup-vercel-env.sh
#
# Todas las variables marcadas con CHANGE_ME deben editarse en este archivo
# antes de ejecutarlo, o bien cambiarlas después en el dashboard de Vercel.
# =============================================================================

set -e

# Colores para los mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

add_env() {
  local name="$1"
  local value="$2"
  local env="${3:-production}"   # production | preview | development
  echo -e "${GREEN}→ Añadiendo ${name}...${NC}"
  echo "$value" | vercel env add "$name" "$env" --force 2>/dev/null || \
  echo "$value" | vercel env add "$name" "$env" 2>/dev/null || true
}

echo ""
echo "============================================="
echo " Configurando variables de entorno en Vercel"
echo "============================================="
echo ""

# ─── URL pública ──────────────────────────────────────────────────────────────
add_env "NEXT_PUBLIC_URL"             "https://CHANGE_ME.com"

# ─── Autenticación admin ──────────────────────────────────────────────────────
# Genera el secreto con:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
add_env "ADMIN_SESSION_SECRET"        "CHANGE_ME_generate_a_32_byte_hex_secret"
add_env "ADMIN_EMAIL"                 "CHANGE_ME_your_login_email@gmail.com"

# ─── Supabase ─────────────────────────────────────────────────────────────────
# Supabase → Project Settings → API
add_env "SUPABASE_URL"                "https://CHANGE_ME.supabase.co"
add_env "SUPABASE_SERVICE_ROLE_KEY"   "CHANGE_ME_supabase_service_role_key"

# ─── Stripe ───────────────────────────────────────────────────────────────────
add_env "STRIPE_SECRET_KEY"           "sk_test_CHANGE_ME"
add_env "STRIPE_WEBHOOK_SECRET"       "whsec_CHANGE_ME"

# ─── Email (SMTP Hostinger) ───────────────────────────────────────────────────
add_env "EMAIL_PROVIDER"              "smtp"
add_env "EMAIL_FROM"                  "CHANGE_ME_sender@your-domain.com"
add_env "SMTP_HOST"                   "smtp.hostinger.com"
add_env "SMTP_PORT"                   "465"
add_env "SMTP_SECURE"                 "true"
add_env "SMTP_USER"                   "CHANGE_ME_your_hostinger_email@your-domain.com"
add_env "SMTP_PASS"                   "CHANGE_ME_hostinger_email_password"

# ─── Analytics (opcional) ─────────────────────────────────────────────────────
# Deja en blanco si no usas GA4
add_env "NEXT_PUBLIC_GA_ID"           ""

echo ""
echo -e "${YELLOW}============================================="
echo " ¡Listo! Variables añadidas en Vercel."
echo ""
echo " Recuerda cambiar los valores CHANGE_ME:"
echo "   vercel → Settings → Environment Variables"
echo " o edita este archivo y vuelve a ejecutarlo."
echo -e "=============================================${NC}"
echo ""
