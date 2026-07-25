# Reptile Concept — Document vivant : Cahier des charges

> **Comment utiliser ce fichier**
> Même principe que `proposal.md` : ce fichier est à la fois la source de vérité du contenu ET un prompt prêt à coller dans une IA pour générer un PDF. Copie tout le fichier tel quel. Contrairement à `proposal.md`, ce document **ne doit jamais contenir de prix** — c'est une fiche de spécifications neutre que le client peut partager avec n'importe quel fournisseur pour obtenir des soumissions comparables.
>
> Mets à jour la section "Contenu" chaque fois qu'une feature est ajoutée, planifiée ou terminée. Ne mets jamais de montants dans ce fichier.

---

## 🧭 Instructions pour l'IA qui génère le PDF (ne pas modifier cette section)

Actúa como redactor/a técnico de especificaciones de proyecto. Genera un PDF (o HTML/diseño listo para exportar a PDF) con el alcance completo del proyecto, usando EXACTAMENTE el contenido de la sección "📄 Contenido du cahier des charges" más abajo. **No incluyas ningún precio, rango de costo, tarifa horaria ni nada relacionado a dinero en ningún lugar del documento** — es una hoja de especificaciones neutral para que el cliente la comparta con otros proveedores y compare cotizaciones.

**Contexto**: "Reptile Concept" (Lachine, Quebec). Documento preparado por "GABAN Solutions" (Montréal, QC — gabansolutions.ca — 514-258-0648) a título de redactor, no de vendedor — el resto del contenido debe leerse neutral, como una hoja de especificaciones técnicas.

**Estilo**: Portada y cierre discretos en negro/carbón con acentos dorados (#cba135) solo para el branding de quién preparó el documento; el resto del contenido en blanco/crema, formato de lista/checklist fácil de escanear, agrupado por secciones con encabezados claros. Idioma: francés. Extensión según el contenido de abajo (puede ser largo, es un documento de referencia, no una pieza de venta).

**Estructura**: Portada → breve introducción explicando el propósito del documento → secciones de alcance (usa los encabezados de la sección de contenido tal cual) → página final invitando a cualquier proveedor consultado a incluir en su cotización: mano de obra estimada, cronograma propuesto, y costos recurrentes por separado del costo de desarrollo.

Genera el documento completo ahora, usando el contenido exacto de la sección de abajo, sin agregar precios.

---

## 📄 Contenido du cahier des charges (esta sección se actualiza con el proyecto)

### Portada
**Reptile Concept — Cahier des charges du projet**
Spécifications complètes pour demande de soumissions.

### Introduction
Ce document décrit l'ensemble des composants du projet, déjà réalisés et à venir, pour qu'un fournisseur puisse soumissionner sur un alcance clair et comparable.

### Section 1 — Découverte et architecture *(réalisé)*
- Analyse du marché, parcours utilisateurs et feuille de route
- Conception du modèle de données (animal unique vs. inventaire générique, commandes, paiements, clients)

### Section 2 — Boutique en ligne *(réalisé)*
- Site bilingue français/anglais
- Catalogue d'animaux avec fiche détaillée par animal (photos, génétique, lignée, disponibilité en temps réel)
- Boutique d'accessoires avec fiche produit détaillée et sélecteur de quantité
- Panier d'achat
- Passage à la caisse avec paiement direct dans le portail
- Retrait en magasin comme mode de livraison, avec suivi du cycle de la commande (payée, en préparation, prête pour retrait, récupérée)
- Délai de retrait et frais d'annulation configurables par l'équipe, avec expiration automatique des commandes non récupérées
- Vitrine des options de paiement (badges, paiement différé) affichée sur le site
- Flux d'avis clients après un retrait, avec modération avant publication
- Image de marque appliquée partout (logo, couleurs, photos réelles)
- Page d'erreur et messages personnalisés

### Section 3 — Panneau d'administration *(réalisé)*
- Connexion sécurisée pour l'équipe
- Gestion des animaux (ajouter/modifier/supprimer, avec photos)
- Gestion des espèces (fiches de soins, informations d'élevage)
- Gestion des produits (ajouter/modifier/supprimer, avec photos)
- Gestion des commandes : suivi du statut, actions de changement d'étape, annulation avec ou sans frais
- Relevé financier de base par commande
- Page de paramètres (délai de retrait, pourcentage de frais d'annulation, courriel de notification)
- Modération des avis clients
- Historique et notes par client
- Bandeau d'annonces modifiable par l'équipe
- Registre des actions de l'équipe dans le panneau

### Section 4 — Courriels automatiques *(réalisé, en attente de connexion d'un fournisseur de courriel)*
- Courriel de confirmation de commande
- Courriel à chaque changement de statut (en préparation, prête pour retrait, récupérée)
- Courriel d'expiration si la commande n'est pas récupérée à temps

### Section 5 — Paiement en ligne réel *(à finaliser)*
- Validation qu'un processeur de paiement (carte de crédit, paiement différé) accepte la vente d'animaux vivants
- Connexion réelle du processeur de paiement (actuellement affiché en vitrine, pas encore connecté à un compte marchand réel)
- Gestion de base des remboursements et litiges

### Section 6 — Comptes clients *(à développer)*
- Création de compte, connexion, mot de passe
- Espace client avec historique des commandes et statut de chacune
- Liste de souhaits (wishlist) pour animaux et produits
- Ajout manuel d'un client depuis le panneau admin
- Import des clients existants depuis QuickBooks

### Section 7 — Inventaire centralisé et point de vente *(à développer)*
- La plateforme devient la source unique de vérité de l'inventaire
- Connexion à Clover comme terminal de paiement uniquement (Clover ne gère plus l'inventaire de façon indépendante)
- Enregistrement des ventes en personne directement depuis le panneau admin
- Vente comptant : retrait automatique de l'inventaire, ajout à la petite caisse, écriture comptable correspondante
- Vente par carte : transaction envoyée au terminal Clover existant, avec attente de la réponse avant de finaliser la vente
- Module de finances avec filtres (par mois, par statut, par méthode de paiement)

### Section 8 — Transfert des données actuelles *(à développer)*
- Import unique de l'inventaire actuel depuis Excel
- Import des clients existants depuis QuickBooks (voir aussi section 6)

### Section 9 — Médias *(à développer)*
- Téléversement direct de photos (glisser-déposer ou sélection de fichier) depuis le panneau admin, en plus de l'option par lien existante
- Stockage des fichiers téléversés

### Section 10 — Suivi de performance *(à développer)*
- Tableau de bord : trafic du site, historique, comparatif dans le temps

### Section 11 — Marketing courriel *(à développer)*
- Section admin pour rédiger un message (français et anglais) et l'envoyer à toute la liste de clients
- Journal des envois : courriels envoyés et brouillons, avec possibilité de renvoi
- Respect des règles canadiennes anti-pourriel (consentement, lien de désabonnement, identification de l'expéditeur)

### Section 12 — Mise en ligne et infrastructure *(réalisé)*
- Nom de domaine et configuration
- Base de données de production et sauvegardes
- Déploiement continu du site

### Page finale
Invitation à tout fournisseur consulté d'inclure dans sa soumission : la main-d'œuvre estimée, l'échéancier proposé, et les frais récurrents (hébergement, domaine, etc.) séparément du coût de développement. Coordonnées de GABAN Solutions à titre de préparateur du document.

---

## État du projet (journal, pour garder ce fichier à jour)

| Date | Changement |
|---|---|
| 2026-07-25 | Documento vivo creado. Marca como "réalisé" el flujo de pago directo + retiro en tienda, ledger financiero, reseñas, y emails transaccionales (codificados, falta proveedor real). Agrega 6 nuevas secciones "à développer": comptes clients, inventario centralizado + POS, migración de datos, medios (upload de fotos), monitoreo de performance, marketing por correo. |
