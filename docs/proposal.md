# Reptile Concept — Document vivant : Proposition de projet

> **Comment utiliser ce fichier**
> Ce document a deux rôles à la fois :
> 1. C'est la **source de vérité** du contenu de la proposition commerciale (mise à jour à mesure que le projet évolue).
> 2. C'est **déjà un prompt prêt à coller** dans une autre IA pour générer un PDF soigné. Copie tout le fichier (les instructions ET le contenu) et colle-le tel quel — le format reste stable même quand le contenu ci-dessous change.
>
> Dernière mise à jour de contenu : voir section "État du projet" ci-dessous. Mets à jour ce fichier chaque fois qu'une feature significative est ajoutée, planifiée ou terminée.

---

## 🧭 Instructions pour l'IA qui génère le PDF (ne pas modifier cette section)

Actúa como diseñador/a de propuestas comerciales. Genera un PDF (o HTML/diseño listo para exportar a PDF) de una propuesta comercial profesional y visualmente atractiva, usando EXACTAMENTE el contenido de la sección "📄 Contenido de la propuesta" más abajo — no inventes secciones nuevas, no cambies los montos ni el alcance descrito.

**Contexto**: "Reptile Concept", tienda de reptiles en Lachine, Quebec, migrando de operar 100% por Facebook a una plataforma propia. Documento preparado por "GABAN Solutions" (Montréal, QC — gabansolutions.ca — 514-258-0648).

**Estilo**: Portada y cierre en negro/carbón (#0b0b0c) con acentos dorados (#cba135), páginas de contenido en blanco/crema (#f7f4ec) con detalles dorados, tipografía sans-serif limpia (system-ui), look premium tipo consultoría, no técnico. Usa viñetas con check dorado para listas de features. Idioma: francés. 4-8 páginas según cuánto contenido tenga la sección de abajo en ese momento — no fuerces todo a caber en un número fijo de páginas.

**Estructura del documento**:
1. Portada
2. Le constat de départ (problème)
3. La solution proposée
4. Aperçu en direct (con el link real si está indicado abajo)
5. Ce qui est déjà en place (état actuel du projet)
6. Prochaines étapes planifiées (les nouvelles features à venir)
7. Ce qui est inclus / ce qui ne l'est pas (abonnements récurrents)
8. Investissement (deja el monto en blanco o referencia al documento de costos, según lo que diga la sección de abajo)
9. Cierre con contacto GABAN Solutions

Genera el documento completo ahora, usando el contenido exacto de la sección de abajo.

---

## 📄 Contenido de la propuesta (esta sección se actualiza con el proyecto)

### Portada
**Reptile Concept — Plateforme E-commerce & Panneau d'administration**
Préparé pour Reptile Concept (Lachine, QC) par GABAN Solutions (Montréal, QC).

### Le constat de départ
Reptile Concept est une entreprise établie à Lachine, mais son opération reposait entièrement sur Facebook : aucun site propre, aucun paiement en ligne, aucun historique client, risque de double-vente d'un même animal, et aucune expérience de vente/livraison structurée.

### La solution proposée
Une plateforme web sur mesure — pas un gabarit générique de type Shopify — parce que l'inventaire de Reptile Concept n'est pas du stock générique : chaque reptile est un individu unique (génétique, lignée, statut de disponibilité), vendu aux côtés d'une boutique d'accessoires classique (terrariums, substrats, décoration, nourriture).

### Aperçu en direct
Un environnement fonctionnel est déjà consultable aujourd'hui : **reptile-concept.vercel.app**

### Ce qui est déjà en place (état actuel)

**Boutique en ligne (site public)**
- Site bilingue français/anglais
- Catalogue d'animaux avec fiche détaillée par animal (photos réelles, génétique, lignée, prix, disponibilité en temps réel)
- Boutique d'accessoires avec fiche produit détaillée et sélecteur de quantité
- Panier et **passage à la caisse avec paiement direct** — le client paie immédiatement dans le portail (ce n'est plus une simple réservation)
- **Retrait en magasin** comme mode de livraison, avec suivi de commande : payée → en préparation → prête pour retrait → récupérée
- Délai de retrait configurable (par défaut 4 jours ouvrables) et frais d'annulation configurable (par défaut 15 %) pour les commandes non récupérées à temps, avec expiration automatique
- Vitrine "achetez maintenant, payez plus tard" et badges de paiement (Stripe/Klarna) déjà affichés sur le site — *à titre indicatif pour le moment, en attente de la connexion réelle des comptes marchands (voir section paiement ci-dessous)*
- Flux d'avis clients après un retrait (lien envoyé par courriel, modération avant publication, page publique d'avis)
- Image de marque réelle intégrée partout (logo, couleurs, photos)
- Page d'accueil, page d'erreur personnalisée, états vides illustrés

**Panneau d'administration**
- Connexion sécurisée pour l'équipe
- Gestion des animaux (ajouter/modifier/supprimer, avec photos)
- Gestion des espèces (fiches de soins)
- Gestion des produits (ajouter/modifier/supprimer, avec photos)
- Gestion des commandes : suivi du cycle de vie, actions (marquer en préparation / prête / récupérée), annulation avec ou sans frais
- Relevé financier de base par commande (vente, remboursement, frais d'annulation)
- Page de paramètres (délai de retrait, pourcentage de frais d'annulation, courriel de notification)
- Modération des avis clients
- Historique et notes par client (mini CRM)
- Bandeau d'annonces modifiable par l'équipe elle-même
- Registre des actions de l'équipe (qui a modifié quoi)

**Courriels automatiques**
- Le système est déjà programmé pour envoyer automatiquement : confirmation de commande, avis "en préparation", avis "prête pour retrait", confirmation de retrait, avis d'expiration — il ne manque que la connexion d'un compte fournisseur de courriel réel pour que ça parte en production (actuellement les courriels s'impriment dans les journaux internes, pas encore envoyés pour vrai)

**Infrastructure**
- Hébergement en production (Vercel) et base de données (PostgreSQL/Neon)
- Domaine et déploiement continu — chaque mise à jour se publie automatiquement

### Prochaines étapes planifiées (à développer)

**1. Comptes clients**
- Création de compte, connexion, mot de passe
- Espace client : historique des commandes et statut de chacune
- Liste de souhaits (wishlist)
- Ajout manuel d'un client depuis le panneau admin
- Import des clients existants depuis QuickBooks

**2. Clover comme terminal de paiement, la plateforme comme source unique d'inventaire**
- L'inventaire vit uniquement dans la plateforme — Clover ne gère plus l'inventaire de façon indépendante
- Enregistrement des ventes en personne directement depuis le panneau admin (point de vente intégré à l'opération quotidienne)
- Vente comptant : retrait automatique de l'inventaire, ajout du montant à la petite caisse, écriture comptable correspondante
- Vente par carte : la transaction est envoyée au terminal Clover déjà utilisé en magasin, en attente de la réponse (approuvée/refusée) avant de finaliser la vente
- Module de finances enrichi : filtres par mois, par statut, par méthode de paiement

**3. Suivi de performance**
- Tableau de bord simple : trafic du site, historique, comparatif dans le temps

**4. Téléversement direct de photos**
- Ajouter une photo depuis l'ordinateur (glisser-déposer ou sélection de fichier) directement dans le panneau admin, en plus de l'option actuelle par lien/URL

**5. Campagnes courriel**
- Nouvelle section admin pour rédiger un message (en français et en anglais) et l'envoyer à toute la liste de clients
- Journal des envois : historique des courriels envoyés et brouillons, pour les renvoyer ou les réutiliser

### Ce qui est inclus / ce qui ne l'est pas

**Inclus dans le développement** : toute la conception, la programmation, les tests, et la mise en place initiale de chaque composant décrit ci-dessus.

**Non inclus — abonnements récurrents à prévoir séparément** (montants approximatifs) :
- Base de données de production : gratuite au départ, puis environ 25 $–70 $ USD/mois si le volume dépasse le forfait gratuit
- Hébergement du site : gratuit au départ, facturation mensuelle (pas annuelle) si le trafic dépasse le forfait gratuit, généralement quelques dizaines de dollars/mois
- Nom de domaine : environ 15 $–20 $ CAD **par année** (ceci est le seul élément vraiment annuel)
- Service d'envoi de courriels : gratuit jusqu'à un certain volume, puis quelques dollars/mois
- Frais de transaction du processeur de paiement : un pourcentage par vente (standard dans l'industrie, pas un abonnement)
- Stockage des photos téléversées : quelques dollars/mois selon le volume, une fois la feature de téléversement direct en place
- Clover : l'abonnement déjà payé par le client, inchangé

### Investissement
Voir l'annexe budgétaire séparée pour le détail des coûts.

### Cierre
GABAN Solutions — Montréal, QC — gabansolutions.ca — 514-258-0648

---

## État du projet (journal, pour garder ce fichier à jour)

| Date | Changement |
|---|---|
| 2026-07-25 | Documento vivo creado. Refleja el pivote a pago directo + retiro en tienda, ledger financiero, reseñas, emails transaccionales codificados (pendiente de proveedor real), y las 7 features nuevas planeadas (cuentas de cliente, Clover como terminal de pago + POS diario, monitoreo de performance, upload de fotos, campañas de email). |
