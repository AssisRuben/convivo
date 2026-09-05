#!/usr/bin/env bash
set -euo pipefail

# O client do Prisma (src/lib/generated/prisma) é gerado, não versionado
# (ver .gitignore) — o EasyPanel sabe rodar isso antes do build porque foi
# configurado lá explicitamente, mas o EAS Build clona o repo do zero sem
# saber disso. Achado com um build real quebrando: "Unable to resolve
# module @/lib/generated/prisma/client" ao tentar empacotar as rotas de
# API (mesmo num build só de Android, o export do Expo Router empacota o
# server junto). `prisma generate` só lê o schema, nunca conecta no banco
# — não precisa de DATABASE_URL disponível aqui.
echo "Running eas-build-post-install: prisma generate"
npx prisma generate
