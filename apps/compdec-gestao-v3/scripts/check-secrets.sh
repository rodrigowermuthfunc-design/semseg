#!/usr/bin/env bash
set -euo pipefail
bad=$(grep -RInE --exclude-dir=node_modules --exclude-dir=.git --exclude='check-secrets.sh' '(BEGIN PRIVATE KEY|service[_-]?account|AIza[0-9A-Za-z_-]{30,}|password\s*[:=]\s*["'"'][^"'"']+)' . || true)
if [[ -n "$bad" ]]; then echo "Possível segredo encontrado:"; echo "$bad"; exit 1; fi
echo "Nenhum padrão óbvio de segredo encontrado."
