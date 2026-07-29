# Reptile Concept — Document vivant : Comparatif Sur mesure vs Shopify

> **Comment utiliser ce fichier**
> Même principe que `proposal.md` et `cahier-de-charges.md` : ce fichier est à la fois la source de vérité du contenu ET un prompt prêt à coller dans une IA (Gemini, ChatGPT, Claude...) pour générer un PDF. Copie tout le fichier tel quel (instructions ET contenu).
>
> Mets à jour la section "Contenu" si les prix ou le scope changent. Ce document s'appuie sur le scope exact de `cahier-de-charges.md` — ne pas le simplifier vers une boutique générique.

---

## 🧭 Instructions pour l'IA qui génère le PDF (ne pas modifier cette section)

Actúa como diseñador/a de documentos comerciales/consultoría. Genera un PDF (o HTML/diseño listo para exportar a PDF) profesional y visualmente atractivo, usando EXACTAMENTE el contenido de la sección "📄 Contenu du comparatif" más abajo — no inventes secciones nuevas, no cambies los montos ni las cifras.

**Contexto**: "Reptile Concept" (Lachine, Quebec) evalúa si migrar a una plataforma Shopify sería más económico que la plataforma sur mesure ya entregada por GABAN Solutions (Montréal, QC — gabansolutions.ca — 514-258-0648), documentada dans `proposal.md` et `cahier-de-charges.md`. Este documento es preparado por GABAN Solutions a título de comparatif objectif, pas de argumentaire de vente agressif — les chiffres doivent parler d'eux-mêmes.

**Estilo**: Portada y cierre en negro/carbón (#0b0b0c) con acentos dorados (#cba135), páginas de contenido en blanco/crema (#f7f4ec) con detalles dorados, tipografía sans-serif limpia (system-ui), look premium tipo consultoría, no técnico. Usa tablas claras y bien formateadas para los comparatifs (pas de texte brut pour les chiffres). Usa viñetas con check dorado (✓) o croix discrète (✗/⚠) selon le cas dans les tableaux de fonctionnalités. Idioma: francés. 5-7 páginas.

**Estructura del documento**:
1. Portada
2. Introduction (pourquoi ce comparatif)
3. Les deux scénarios Shopify possibles (encadré explicatif)
4. Tableau comparatif des fonctionnalités
5. Tableau comparatif des coûts (développement + récurrent)
6. Tableau du coût total sur 2 ans (TCO)
7. Conclusion / recommandation
8. Cierre con contacto GABAN Solutions

Genera el documento completo ahora, usando el contenido exacto de la sección de abajo, sin modificar las cifras.

---

## 📄 Contenu du comparatif (esta sección se actualiza con el proyecto)

### Portada
**Reptile Concept — Comparatif : Plateforme sur mesure vs Shopify**
Préparé pour Reptile Concept (Lachine, QC) par GABAN Solutions (Montréal, QC).

### Introduction
Ce document compare la plateforme sur mesure déjà livrée (voir `proposal.md`) avec l'alternative Shopify, en tenant compte du **scope réel** du projet — notamment l'inventaire d'animaux uniques (pas du stock générique) et l'intégration avec le terminal Clover déjà utilisé en boutique.

### Les deux scénarios Shopify possibles

Shopify ne peut pas simplement remplacer la plateforme actuelle telle quelle — il faut choisir entre deux scénarios :

**Scénario A — Shopify + abandon de Clover au profit de Shopify POS**
Le seul chemin où l'inventaire reste unifié en temps réel sans développement sur mesure, car Clover est remplacé par le système de caisse propre à Shopify (Shopify POS Pro).

**Scénario B — Shopify + maintien de Clover**
Il n'existe pas de connecteur standard fiable pour une synchronisation bidirectionnelle en temps réel avec une logique d'article unique (éviter de vendre deux fois le même animal). Cela exige un développement de middleware sur mesure — donc un retour à du développement personnalisé, en plus de l'abonnement Shopify.

### Tableau comparatif des fonctionnalités

| Fonctionnalité (cahier des charges) | Sur mesure (livré) | Shopify + Shopify POS | Shopify + Clover |
|---|---|---|---|
| Inventaire unifié temps réel (éviter double vente d'un animal unique) | ✓ natif | ✓ natif (POS Pro) | ⚠ middleware sur mesure requis |
| Synchronisation avec Clover | — (non requis) | ✗ (Clover abandonné) | ⚠ sur mesure, fiabilité non garantie |
| Site bilingue FR/EN natif | ✓ | ✓ (app Translate & Adapt) | ✓ |
| Registre d'audit des actions de l'équipe | ✓ | ⚠ limité (Shopify Plus requis pour un vrai registre) | ⚠ idem |
| Mini-CRM avec historique/notes client | ✓ | ✓ natif, basique | ✓ |
| Liste de souhaits (wishlist) | ✓ | ⚠ application payante | ⚠ application payante |
| Import QuickBooks / Excel | ✓ | ⚠ manuel ou application | ⚠ manuel ou application |
| Tableau de bord de trafic sans abonnement tiers | ✓ | ✓ (Shopify Analytics inclus) | ✓ |
| Campagnes courriel bilingues | ✓ | ✓ (Shopify Email) | ✓ |
| Frais mensuels de plateforme | **0 $** | ≈ 300 $–400 $ CAD/mois | ≈ 300 $–400 $ CAD/mois + coût d'intégration |

### Tableau comparatif des coûts

| Scénario | Développement (unique) | Récurrent/mois | TCO sur 2 ans |
|---|---|---|---|
| **Sur mesure — prix facturé par GABAN Solutions** | 6 000 $ CAD | ≈ 0 $–30 $ CAD (hébergement/BD, gratuit au départ) | **≈ 6 100 $–6 700 $ CAD** |
| **Sur mesure — prix du marché de Montréal** (agences comparables) | 12 000 $–28 000 $ CAD | ≈ 0 $–30 $ CAD | ≈ 12 700 $–29 000 $ CAD |
| **Shopify + Shopify POS** (abandon de Clover) | 5 000 $–12 600 $ CAD | ≈ 300 $–400 $ CAD (plan Grow + POS Pro) | **≈ 13 400 $–21 000 $ CAD** |
| **Shopify + Clover** (middleware sur mesure) | 13 000 $–33 600 $ CAD | ≈ 300 $–400 $ CAD | **≈ 21 400 $–42 000 $ CAD** |

### Conclusion / recommandation

1. Shopify n'est pas plus économique dans ce cas précis. Il ne devient moins cher à construire que si le client accepte d'**abandonner Clover** — et même dans ce scénario, sur 2 ans, le coût total dépasse **2 à 3 fois** celui de la solution sur mesure, car Shopify facture un abonnement mensuel à vie alors que GABAN Solutions ne facture aucuns frais mensuels de plateforme.
2. Si Clover doit être conservé (ce qui est le cas actuellement), la voie Shopify devient l'option **la plus coûteuse de toutes** — au-delà même du haut du fourchette de marché sur mesure — car elle exige de construire un pont personnalisé aussi complexe que la solution déjà livrée, par-dessus une plateforme qui n'a pas été conçue pour ce cas d'usage.
3. La plateforme sur mesure déjà livrée correspond, fonctionnalité par fonctionnalité, au niveau le plus complet des deux scénarios Shopify — au prix affiché du scénario le plus économique, sans aucuns frais mensuels récurrents.

### Cierre
GABAN Solutions — Montréal, QC — gabansolutions.ca — 514-258-0648

---

## État du projet (journal, pour garder ce fichier à jour)

| Date | Changement |
|---|---|
| 2026-07-29 | Document créé. Comparatif basé sur le scope réel du cahier des charges (inventaire d'animaux uniques, intégration Clover), avec deux scénarios Shopify distincts et TCO sur 2 ans. |
