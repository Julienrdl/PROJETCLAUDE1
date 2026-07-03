# JMGA — Suivi de chantiers photovoltaïques

Application de suivi des chantiers, du planning et des interventions pour JMGA (pose de panneaux photovoltaïques).

## Fonctionnalités

- Planning des poses de centrales et interventions (maintenance, SAV...)
- Fiches chantier : adresse, puissance (kWc), panneaux, onduleurs, CA HT prévu, statut de facturation, champ libre
- Rapports d'intervention avec photos
- Réceptions de chantier avec signature du poseur et du client, photos et export PDF
- Tableau de bord (chantiers actifs, puissance totale, CA HT prévu/facturé, planning à venir)
- Deux profils : Bureau (accès complet) et Poseur (planning et rapports terrain)

## Développement

```bash
npm install
npm run dev
```

Configurez `.env` (voir `.env.example`) avec votre base Turso (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) et un `JWT_SECRET`.

Ouvrez [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```
