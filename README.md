# Reptile Concept

Boutique en ligne et outils d'administration pour Reptile Concept (Lachine, QC) : reptiles, terrariums, substrats, décoration et nourriture. Voir le plan de conception complet (UML, historiques utilisateurs, douleurs de l'industrie, diagrammes de flux) dans `docs/plan.md` si présent, ou dans l'historique de planification du projet.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma](https://www.prisma.io) + SQLite en développement (facilement remplaçable par Postgres en production)
- [next-intl](https://next-intl.dev) pour le site bilingue FR/EN (FR par défaut, conformément à la Loi 96 du Québec)
- Panel d'administration (`/admin`) avec authentification par session (cookie signé + bcrypt)

## Démarrage

```bash
npm install
npm run db:migrate   # applique les migrations Prisma (SQLite local)
npm run db:seed       # ajoute des données de démonstration + un compte admin
npm run dev
```

Le site public est disponible sur `http://localhost:3000/fr` (ou `/en`).
Le panel admin est sur `http://localhost:3000/admin/login`.

Identifiants admin de démonstration (créés par `npm run db:seed`) :
- Email : `admin@reptileconcept.ca`
- Mot de passe : `changeme123`

⚠️ Changez ce mot de passe avant tout déploiement réel, et définissez `SESSION_SECRET` (déjà généré dans `.env` pour le développement local) avec une valeur secrète propre à chaque environnement.

## Structure

- `src/app/[locale]/` — site public bilingue (catalogue d'animaux, fiches, boutique d'accessoires)
- `src/app/admin/` — panel d'administration (CRUD animaux/produits/commandes/clients/annonces)
- `prisma/schema.prisma` — modèle de données (Animal, Species, Product, Bundle, Order, Payment, AdminUser, Announcement, etc.)
- `prisma/seed.ts` — données de démonstration

## Scripts utiles

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run db:migrate` — migrations Prisma
- `npm run db:seed` — recharge les données de démonstration
- `npm run db:studio` — interface Prisma Studio pour explorer la base de données
