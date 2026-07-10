# Reptile Concept

Boutique en ligne et outils d'administration pour Reptile Concept (Lachine, QC) : reptiles, terrariums, substrats, décoration et nourriture.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [next-intl](https://next-intl.dev) pour le site bilingue FR/EN (FR par défaut, conformément à la Loi 96 du Québec)
- Panel d'administration (`/admin`) avec authentification par session (cookie signé + bcrypt)

## Démarrage (développement local)

Nécessite une base PostgreSQL accessible localement (`postgresql://...`).

```bash
cp .env.example .env   # puis renseignez DATABASE_URL et SESSION_SECRET
npm install
npm run db:migrate     # applique les migrations Prisma
npm run db:seed        # ajoute des données de démonstration + un compte admin
npm run dev
```

Le site public est disponible sur `http://localhost:3000/fr` (ou `/en`).
Le panel admin est sur `http://localhost:3000/admin/login`.

Identifiants admin de démonstration (créés par `npm run db:seed`) :
- Email : `admin@reptileconcept.ca`
- Mot de passe : `changeme123`

⚠️ Changez ce mot de passe avant tout déploiement réel, et définissez `SESSION_SECRET` avec une valeur secrète propre à chaque environnement (voir `.env.example` pour la générer).

## Déploiement sur Vercel

1. **Créer une base Postgres gratuite** — le plus simple est [Neon](https://neon.tech) (aucune carte de crédit requise) : créez un projet, copiez la chaîne de connexion (`postgresql://...`).
   - Alternative : Vercel propose aussi une intégration Postgres directement depuis le dashboard du projet (onglet **Storage** → **Create Database**).
2. **Importer le repo sur Vercel** — [vercel.com/new](https://vercel.com/new), connectez GitHub, sélectionnez `MitchellCastellanos/Reptile-concept`. Vercel détecte Next.js automatiquement, aucune configuration de build à changer.
3. **Ajouter les variables d'environnement** (onglet **Settings → Environment Variables** du projet Vercel) :
   - `DATABASE_URL` — la chaîne de connexion Postgres de l'étape 1
   - `SESSION_SECRET` — une valeur aléatoire (générez-en une avec la commande dans `.env.example`)
4. **Déployer** — Vercel installe les dépendances (`postinstall` génère le client Prisma), applique les migrations (`prisma migrate deploy`, inclus dans la commande `build`) puis construit le site. Vous obtenez une URL `https://votre-projet.vercel.app`.
5. **Charger les données de démonstration** (une seule fois) — en local, pointez temporairement `DATABASE_URL` vers la base de production dans `.env` et lancez `npm run db:seed`, ou exécutez la même commande depuis n'importe quel environnement ayant accès à la chaîne de connexion.

Chaque futur `git push` sur la branche connectée redéploie automatiquement.

## Structure

- `src/app/[locale]/` — site public bilingue (catalogue d'animaux, fiches, boutique d'accessoires)
- `src/app/admin/` — panel d'administration (CRUD animaux/produits/commandes/clients/annonces)
- `prisma/schema.prisma` — modèle de données (Animal, Species, Product, Bundle, Order, Payment, AdminUser, Announcement, etc.)
- `prisma/seed.ts` — données de démonstration

## Scripts utiles

- `npm run dev` — serveur de développement
- `npm run build` — applique les migrations Prisma puis build de production
- `npm run db:migrate` — migrations Prisma (développement)
- `npm run db:seed` — recharge les données de démonstration
- `npm run db:studio` — interface Prisma Studio pour explorer la base de données
