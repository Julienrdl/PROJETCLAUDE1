#!/bin/bash
# Script de démarrage DI SOLAR — Validation Factures

# Créer le dossier data si absent
mkdir -p data uploads

# Copier le fichier .env si absent
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠  Fichier .env créé depuis .env.example — pensez à changer JWT_SECRET !"
fi

echo "🚀 Démarrage DI SOLAR sur http://localhost:${PORT:-3000}"
node .next/standalone/server.js
