# Reptile Concept

Boutique en ligne et outils d'administration pour Reptile Concept (Lachine, QC) : reptiles, terrariums, substrats, décoration et nourriture.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- [Prisma](https://www.prisma.io) + PostgreSQL
- [next-intl](https://next-intl.dev) pour le site bilingue FR/EN (FR par défaut, conformément à la Loi 96 du Québec)
- Panel d'administration (`/admin`) avec authentification par session (cookie signé + bcrypt)

## Flux de vente

Le client paie directement dans le portail (achat immédiat, plus de « réservation »),
puis récupère sa commande en boutique :

1. Le client paie en ligne → statut `paid`, courriel de confirmation au client + courriel
   de nouvelle vente à l'admin (`adminNotificationEmail` dans `/admin/settings`, ou le
   compte `owner` par défaut).
2. L'admin clique sur **Marquer en préparation** → statut `preparing`, courriel au client.
3. L'admin clique sur **Marquer prête pour retrait** → statut `ready_for_pickup`. La vente
   est enregistrée dans les registres financiers (`/admin/finance`) et une date limite de
   retrait est calculée (jours ouvrables configurables dans `/admin/settings`, 4 par défaut).
   Courriel au client avec les horaires et la date limite.
4. Si le client ne récupère pas sa commande avant la date limite, elle est automatiquement
   annulée et remboursée (moins les frais d'annulation configurables, 15 % par défaut) —
   voir `src/lib/order-expiration.ts`. Ce contrôle tourne à chaque chargement de
   `/admin/orders` ; pour un contrôle fiable en production, planifiez un appel régulier
   (Vercel Cron ou autre) sur `GET /api/cron/expire-orders`.
5. L'admin clique sur **Marquer récupérée** → statut `picked_up`, courriel final avec un
   lien (à durée illimitée, signé avec `SESSION_SECRET`) vers `/reviews/new/[orderId]`
   pour laisser un avis. Les avis publiés apparaissent sur `/reviews`.

**Paiement en ligne (Stripe + Klarna) :** pas encore branché — le paiement est enregistré
comme réussi immédiatement (voir le commentaire MVP dans `checkout/actions.ts`). Des badges
« bientôt disponible » font déjà la promotion de ces options dans toute l'interface.

**Courriels :** aucun fournisseur n'est requis pour développer — sans `RESEND_API_KEY`, les
courriels sont simplement affichés dans la console (`src/lib/email.ts`).

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
   - `RESEND_API_KEY` *(optionnel)* — pour envoyer réellement les courriels transactionnels via [Resend](https://resend.com). Sans cette clé, les courriels sont seulement journalisés.
   - `EMAIL_FROM` *(optionnel)* — adresse d'expédition des courriels (ex. `Reptile Concept <ventes@reptileconcept.ca>`)
   - `NEXT_PUBLIC_SITE_URL` *(optionnel)* — URL publique du site, utilisée dans les liens des courriels (ex. lien admin, lien d'avis). Par défaut, `VERCEL_URL` est utilisé.
   - `CRON_SECRET` *(optionnel)* — si défini, protège `GET /api/cron/expire-orders` (en-tête `Authorization: Bearer <valeur>`)
4. **Déployer** — Vercel installe les dépendances (`postinstall` génère le client Prisma), applique les migrations (`prisma migrate deploy`, inclus dans la commande `build`) puis construit le site. Vous obtenez une URL `https://votre-projet.vercel.app`.
5. **Charger les données de démonstration** (une seule fois) — en local, pointez temporairement `DATABASE_URL` vers la base de production dans `.env` et lancez `npm run db:seed`, ou exécutez la même commande depuis n'importe quel environnement ayant accès à la chaîne de connexion.

Chaque futur `git push` sur la branche connectée redéploie automatiquement.

## Structure

- `src/app/[locale]/` — site public bilingue (catalogue d'animaux, fiches, boutique d'accessoires, avis)
- `src/app/admin/` — panel d'administration (CRUD animaux/produits/commandes/clients/annonces/avis, finances, réglages)
- `src/app/api/cron/expire-orders/` — endpoint à planifier pour annuler les commandes non récupérées à temps
- `src/lib/email.ts`, `src/lib/email-templates.ts`, `src/lib/order-notifications.ts` — envoi des courriels transactionnels
- `src/lib/order-expiration.ts` — annulation/remboursement automatique des commandes expirées
- `prisma/schema.prisma` — modèle de données (Animal, Species, Product, Bundle, Order, Payment, FinancialRecord, Review, StoreSettings, AdminUser, Announcement, etc.)
- `prisma/seed.ts` — données de démonstration

## Scripts utiles

- `npm run dev` — serveur de développement
- `npm run build` — applique les migrations Prisma puis build de production
- `npm run db:migrate` — migrations Prisma (développement)
- `npm run db:seed` — recharge les données de démonstration
- `npm run db:studio` — interface Prisma Studio pour explorer la base de données
