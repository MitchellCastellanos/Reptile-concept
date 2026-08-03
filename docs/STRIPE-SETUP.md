# Stripe + Klarna — Checklist de mise en production

> Document de référence pour connecter le compte marchand Reptiles Concept au checkout en ligne.
> Le code est déjà en place ; il ne reste que la configuration côté Stripe, Vercel et validation.

---

## État actuel du code

| Composant | Fichier | Rôle |
|-----------|---------|------|
| Client Stripe | `src/lib/stripe.ts` | Session Checkout (CAD, carte + Klarna) |
| Flux commande | `src/lib/order-payment.ts` | Réservation inventaire → paiement → fulfillment |
| Webhook | `src/app/api/stripe/webhook/route.ts` | Confirme les paiements, annule les sessions expirées |
| Checkout | `src/app/[locale]/checkout/actions.ts` | Redirige vers Stripe si clé présente, sinon mode dev |
| Remboursements | `src/lib/stripe-refund.ts` | Rembourse via Stripe lors d'annulations |
| Cron | `src/app/api/cron/expire-pending-orders/route.ts` | Libère l'inventaire des commandes abandonnées (>25 h) |
| Migration | `prisma/migrations/20260802220000_order_pending_payment/` | Statut `pending_payment` sur les commandes |

### Comportement selon les variables d'environnement

| `STRIPE_SECRET_KEY` | Comportement |
|---------------------|--------------|
| **Absent** | Mode dev : commande marquée `paid` immédiatement (`provider: manual`), pas de charge réelle |
| **Présent** | Redirection Stripe Checkout → webhook confirme → inventaire finalisé + push Clover |

---

## Ce qu'il te reste à faire (checklist)

### 1. Créer le compte Stripe avec le client (en personne)

- [ ] Aller sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register) **avec le client présent**
- [ ] Utiliser les infos légales de **Reptiles Concept** (pas GABAN Solutions)
- [ ] Compléter la vérification d'identité / entreprise (KYC)
- [ ] Ajouter le compte bancaire du client pour les dépôts

### 2. Activer Klarna

- [ ] Dashboard Stripe → **Settings → Payment methods**
- [ ] Activer **Klarna**
- [ ] Vérifier que le compte est éligible (Canada, catégorie « animalerie / reptiles » — peut nécessiter approbation)

> **Note :** Klarna interdit certaines catégories (espèces protégées, méthodes de livraison cruelles). Une boutique de reptiles captifs avec retrait en magasin est généralement OK, mais Stripe/Klarna peuvent demander des précisions.

### 3. Récupérer les clés API

- [ ] Dashboard → **Developers → API keys**
- [ ] Copier la **Secret key** (`sk_test_…` pour tester, `sk_live_…` pour prod)

### 4. Configurer les variables sur Vercel

Projet Vercel → **Settings → Environment Variables** :

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
NEXT_PUBLIC_SITE_URL=https://reptiles-concept.ca
```

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Oui | Active le vrai checkout (sans elle = mode dev) |
| `STRIPE_WEBHOOK_SECRET` | Oui en prod | Signature des webhooks |
| `NEXT_PUBLIC_SITE_URL` | Recommandé | URL publique pour les redirects Stripe |
| `CRON_SECRET` | Recommandé | Protège `/api/cron/expire-pending-orders` |

Redéployer après avoir ajouté les variables.

### 5. Créer le webhook Stripe (production)

- [ ] Dashboard → **Developers → Webhooks → Add endpoint**
- [ ] URL : `https://reptiles-concept.ca/api/stripe/webhook`
- [ ] Événements à écouter :
  - `checkout.session.completed`
  - `checkout.session.expired`
- [ ] Copier le **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET` sur Vercel

### 6. Appliquer la migration Prisma (si pas déjà fait)

```bash
npm run db:deploy
```

Ajoute le statut `pending_payment` à l'enum `OrderStatus`.

### 7. Tester en mode test avant le live

#### a) Clés test sur Vercel (preview ou staging)

Utiliser `sk_test_…` et créer un webhook test pointant vers ton URL de preview, ou utiliser le **Stripe CLI** en local :

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le CLI affiche un `whsec_…` temporaire → le mettre dans `.env` local :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### b) Scénarios à valider

- [ ] Checkout avec **carte test** `4242 4242 4242 4242` → commande `paid`, email, inventaire baissé, Clover mis à jour
- [ ] Checkout avec **Klarna test** (si disponible en mode test pour CA)
- [ ] Annuler sur la page Stripe → retour au checkout, panier intact, commande `cancelled`, stock restauré
- [ ] Annulation admin d'une commande payée → remboursement Stripe + stock restauré
- [ ] Commande `ready_for_pickup` expirée → remboursement partiel (frais d'annulation) via Stripe

#### c) Cartes de test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 9995` | Paiement refusé |

Docs : [https://docs.stripe.com/testing](https://docs.stripe.com/testing)

### 8. Passer en live

- [ ] Remplacer `sk_test_…` par `sk_live_…` sur Vercel (Production)
- [ ] Créer un **nouveau webhook** en mode Live avec la même URL
- [ ] Mettre à jour `STRIPE_WEBHOOK_SECRET` avec le secret du webhook live
- [ ] Faire un achat réel de test (petit montant) et vérifier dans Stripe Dashboard + admin Reptiles Concept

---

## Flux technique (référence rapide)

```
Client remplit le checkout
  → Commande créée (pending_payment)
  → Animaux → reserved, produits → stock décrémenté
  → Redirection Stripe Checkout (carte + Klarna)

Paiement réussi
  → Webhook checkout.session.completed
  → Commande → paid, Payment → succeeded
  → Animaux → sold
  → Emails confirmation + admin
  → pushSoldItemsToClover()

Paiement abandonné / expiré
  → Webhook checkout.session.expired OU cron expire-pending-orders
  → Commande → cancelled
  → Inventaire restauré
```

---

## Fichiers clés si tu dois débugger

| Problème | Où regarder |
|----------|-------------|
| Paiement OK mais commande bloquée en `pending_payment` | Logs Vercel → `/api/stripe/webhook` ; vérifier `STRIPE_WEBHOOK_SECRET` |
| Redirect Stripe incorrect | `NEXT_PUBLIC_SITE_URL` |
| Klarna n'apparaît pas | Dashboard Stripe → Payment methods ; montant min/max Klarna CAD |
| Remboursement pas passé | Logs `[stripe] refund failed` ; `Payment.providerRef` doit contenir le Payment Intent ID |
| Double vente | Vérifier que `pushSoldItemsToClover` tourne après webhook (logs `[clover-sync]`) |

---

## Ce qui n'est PAS Stripe (rappel)

| Canal | Processeur |
|-------|------------|
| Ventes en magasin / salon | **Clover** (terminal physique) |
| Ventes en ligne | **Stripe** (carte + Klarna) |

Deux comptes marchands, deux types de frais — c'est normal. L'inventaire reste synchronisé via `cloverItemId` dans les deux sens.

---

## Prompt prêt à coller dans Cursor

Quand tu as les clés :

> Aquí están las keys de Stripe del cliente Reptiles Concept:
> - STRIPE_SECRET_KEY=sk_live_...
> - STRIPE_WEBHOOK_SECRET=whsec_...
> Configúralas en Vercel (producción), verifica que el webhook apunte a /api/stripe/webhook, corre una prueba de checkout test→live, y confirma que inventario y emails funcionan. Sigue docs/STRIPE-SETUP.md.

---

*Dernière mise à jour : 2026-08-02*
