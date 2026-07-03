#!/bin/bash
# Script de démarrage JMGA — Suivi de chantiers

# Copier le fichier .env si absent
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠  Fichier .env créé depuis .env.example — pensez à changer JWT_SECRET et configurer Turso !"
fi

echo "🚀 Démarrage JMGA sur http://localhost:${PORT:-3000}"
node .next/standalone/server.js
