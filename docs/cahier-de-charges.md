# Reptiles Concept — Document vivant : Cahier des charges

> **Comment utiliser ce fichier**
> Même principe que `proposal.md` : ce fichier est à la fois la source de vérité du contenu ET un prompt prêt à coller dans une IA pour générer un PDF. Copie tout le fichier tel quel. Contrairement à `proposal.md`, ce document **ne doit jamais contenir de prix** — c'est une fiche de spécifications neutre que le client peut partager avec n'importe quel fournisseur pour obtenir des soumissions comparables.
>
> Mets à jour la section "Contenu" chaque fois qu'une feature est ajoutée, planifiée ou terminée. Ne mets jamais de montants dans ce fichier.

---

## 🧭 Instructions pour l'IA qui génère le PDF (ne pas modifier cette section)

Actúa como redactor/a técnico de especificaciones de proyecto. Genera un PDF (o HTML/diseño listo para exportar a PDF) con el alcance completo del proyecto, usando EXACTAMENTE el contenido de la sección "📄 Contenido du cahier des charges" más abajo. **No incluyas ningún precio, rango de costo, tarifa horaria ni nada relacionado a dinero en ningún lugar del documento** — es una hoja de especificaciones neutral para que el cliente la comparta con otros proveedores y compare cotizaciones.

**Contexto**: "Reptiles Concept" (Lachine, Quebec). Documento preparado por "GABAN Solutions" (Montréal, QC — gabansolutions.ca — 514-258-0648) a título de redactor, no de vendedor — el resto del contenido debe leerse neutral, como una hoja de especificaciones técnicas.

**Estilo**: Portada y cierre discretos en negro/carbón con acentos dorados (#cba135) solo para el branding de quién preparó el documento; el resto del contenido en blanco/crema, formato de lista/checklist fácil de escanear, agrupado por secciones con encabezados claros. Idioma: francés. Extensión según el contenido de abajo (puede ser largo, es un documento de referencia, no una pieza de venta).

**Estructura**: Portada → breve introducción explicando el propósito del documento → secciones de alcance (usa los encabezados de la sección de contenido tal cual) → página final invitando a cualquier proveedor consultado a incluir en su cotización: mano de obra estimada, cronograma propuesto, y costos recurrentes por separado del costo de desarrollo.

Genera el documento completo ahora, usando el contenido exacto de la sección de abajo, sin agregar precios.

---

## 📄 Contenido du cahier des charges (esta sección se actualiza con el proyecto)

### Portada
**Reptiles Concept — Cahier des charges du projet**
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
- Calcul et détail des taxes TPS/TVQ sur chaque commande (sous-total, TPS, TVQ, total), numéros d'inscription et taux configurables depuis l'admin
- Retrait en magasin comme mode de livraison, avec suivi du cycle de la commande (payée, en préparation, prête pour retrait, récupérée)
- Délai de retrait et frais d'annulation configurables par l'équipe, avec expiration automatique des commandes non récupérées
- Vitrine des options de paiement (badges, paiement différé) affichée sur le site
- Flux d'avis clients après un retrait, avec modération avant publication
- Image de marque appliquée partout (logo, couleurs, photos réelles)
- Page d'erreur et messages personnalisés

### Section 3 — Panneau d'administration *(réalisé)*
- Navigation en menu latéral regroupée par catégorie (catalogue, ventes, clients, site), entièrement adaptée aux mobiles et tablettes (menu déroulant sur petit écran, tableaux défilables)
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
- Coordonnées de l'entreprise modifiables (courriel de contact, téléphone, adresse et horaires en français et en anglais), reflétées automatiquement dans le pied de page, les reçus et les courriels envoyés aux clients
- Registre des actions de l'équipe dans le panneau

### Section 4 — Courriels automatiques *(réalisé, en attente de connexion d'un fournisseur de courriel)*
- Courriel de confirmation de commande
- Courriel à chaque changement de statut (en préparation, prête pour retrait, récupérée)
- Courriel d'expiration si la commande n'est pas récupérée à temps

### Section 5 — Paiement en ligne réel *(à finaliser)*
- Validation qu'un processeur de paiement (carte de crédit, paiement différé) accepte la vente d'animaux vivants
- Connexion réelle du processeur de paiement (actuellement affiché en vitrine, pas encore connecté à un compte marchand réel)
- Gestion de base des remboursements et litiges

### Section 6 — Comptes clients *(réalisé)*
- Création de compte, connexion, mot de passe
- Espace client avec historique des commandes et statut de chacune
- Liste de souhaits (wishlist) pour animaux et produits, accessible directement depuis chaque fiche du catalogue en plus de l'espace client
- Ajout manuel d'un client depuis le panneau admin
- Import en bloc des clients existants à partir d'un export QuickBooks (fichier CSV)

### Section 7 — Inventaire centralisé et point de vente *(réalisé, portée révisée — voir note)*

> **Note sur la portée** : cette section a été révisée après l'acquisition par le client d'un appareil Clover à écran tactile autonome (utilisé aussi bien au comptoir en magasin que dans les salons/expositions, sans ordinateur). Contrairement à la portée d'origine, les ventes en personne ne sont plus enregistrées depuis le panneau admin — elles sont sonnées directement sur l'appareil Clover, qui devient l'autorité sur l'inventaire et les ventes en personne. La plateforme reste la source de vérité pour le contenu enrichi du catalogue (photos, génétique, lignée, fiches bilingues) et pour les ventes en ligne, et se synchronise avec Clover dans les deux sens pour rester exacte. Ce changement de portée n'était pas prévu dans le développement d'origine (voir journal ci-dessous).

- Connexion bidirectionnelle avec l'appareil Clover autonome :
  - Chaque vente sonnée sur Clover (comptoir ou salon) est reflétée automatiquement sur la plateforme (webhook temps réel + sondage de secours), qui met à jour la disponibilité de l'animal/produit concerné
  - Chaque vente en ligne sur la plateforme met à jour l'inventaire correspondant dans Clover, pour que l'appareil ne propose plus un article déjà vendu en ligne
  - Un identifiant Clover optionnel relie chaque fiche animal/produit du site à sa fiche correspondante dans Clover
- Décision du client (2026-08-04) : les ventes en personne passent à 100 % par l'appareil Clover, maintenant et pour l'avenir. L'enregistrement manuel d'une vente depuis le panneau admin (« Vente en magasin », prévu à l'origine comme solution de secours) a donc été retiré du produit — plus de risque de double saisie entre Clover et l'admin
- Module de finances unifié (commandes en ligne + ventes Clover synchronisées) avec filtres (par mois, par type, par canal, par méthode de paiement) et détail des taxes perçues — le volet des ventes Clover est un miroir en lecture seule de ce qui s'est passé sur l'appareil, pas une comptabilité parallèle. Clover ne renvoyant pas de détail TPS/TVQ par vente, la plateforme l'estime à partir du total encaissé et des taux configurés dans Réglages, pour que le relevé reste complet même si le détail de Clover n'est qu'une estimation

### Section 8 — Transfert des données actuelles
- Import en bloc des clients existants depuis QuickBooks *(réalisé — voir aussi section 6)*
- Import unique de l'inventaire actuel depuis Excel *(à développer)*

### Section 9 — Médias *(réalisé)*
- Téléversement direct de photos (sélection de fichier) depuis le panneau admin, en plus de l'option par lien existante
- Stockage des fichiers téléversés

### Section 10 — Suivi de performance *(réalisé)*
- Tableau de bord intégré à la plateforme : trafic du site, historique, comparatif dans le temps, pages les plus consultées — aucun abonnement d'analytique tiers requis

### Section 11 — Marketing courriel *(réalisé)*
- Section admin pour rédiger un message (français et anglais) et l'envoyer à toute la liste de clients
- Journal des envois : courriels envoyés et brouillons, avec possibilité de renvoi
- Respect du consentement des clients (case de désinscription respectée à l'envoi) — la gestion complète des exigences canadiennes anti-pourriel (ex. lien de désabonnement dans chaque courriel) reste à finaliser avec le fournisseur de courriel réel

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
| 2026-07-25 | Secciones 6, 7, 9, 10 y 11 marcadas como "réalisé" (comptes clients, inventario centralizado + POS con Clover, upload de fotos, monitoreo de performance, campañas de email). La sección 8 se dividió: import de clientes QuickBooks ya está hecho, solo queda pendiente el import de inventario desde Excel. |
| 2026-07-25 | Se agregó cálculo de taxes TPS/TVQ (Sección 2 y 7) configurables desde el admin, aplicadas en checkout en línea y ventas en magasin, con reçus de vente en magasin imprimibles/enviables por correo. |
| 2026-07-25 | Se agregó botón de cuenta visible en todo momento, wishlist en cada tarjeta del catálogo (Sección 2 y 6), y control +/- de cantidad en vente en magasin (Sección 7). Se reorganizó el panneau admin en menú lateral por categoría y se hizo responsive (Sección 3), corrigiendo también un bug de contraste en los campos de formulario. |
| 2026-07-25 | Se agregó a la Sección 3 la posibilidad de editar desde el admin el courriel de contacto público, teléfono, dirección y horarios (FR/EN), reflejados automáticamente en el sitio, los reçus y los courriels transaccionales. |
| 2026-07-30 | Cambio de alcance no previsto: el cliente adquirió un aparato Clover de pantalla táctil autónomo, usado tanto en el mostrador de la tienda como en salones/expos sin computadora. Esto invierte la Sección 7: Clover pasa a ser la autoridad sobre el inventario y las ventas en persona (ya no la plataforma); la plataforma se vuelve el catálogo enriquecido (fotos, genética, fichas bilingües) y el canal de venta en línea, sincronizado con Clover en ambos sentidos (webhook + sondage de secours). Se implementó: enlace opcional Clover Item ID en cada fiche animal/produit, sync entrant (ventes Clover → disponibilité du site) y sync sortant (ventes en ligne → stock Clover), tableau de bord de finances devenu un miroir en lecture seule pour le volet Clover. Ce changement sort de la portée d'origine — voir proposal.md pour la note de tarification séparée. |
| 2026-07-30 | Ajout d'une file d'import (page admin "Nouveaux articles Clover") : tout nouvel article capturé directement sur l'appareil Clover apparaît automatiquement dans cette file (webhook + sondage de secours), avec un bouton pour créer la fiche animal/produit correspondante — l'identifiant Clover et le prix sont pré-remplis, il ne reste qu'à ajouter les champs propres au site (espèce, description, photo). Un bouton "Synchroniser maintenant" (page Réglages) permet aussi de forcer la vérification manuellement, sans attendre le webhook ou le sondage automatique. |
| 2026-08-04 | QA de bout en bout du flux complet (création produit → boutique → panier → checkout → cycle de vie de commande → courriels → relevé financier → avis client) sur environnement local. A détecté qu'un commit antérieur (2026-08-02, refactor Clover) avait accidentellement réduit `/admin/finance` et `/admin/pos` à de simples redirections et retiré leurs liens du menu — régression non liée au propos de ce commit. Corrigé : les deux pages et le lien de menu "Ventes" sont restaurés et re-testés avec des données réelles. |
| 2026-08-04 | Deux ajustements suite à cette QA : (1) les ventes Clover synchronisées n'avaient pas de détail TPS/TVQ (Clover ne le renvoie pas) — le relevé financier les estime maintenant à partir du total encaissé et des taux configurés dans Réglages, testé et vérifié cohérent avec le calcul du checkout en ligne. (2) Décision du client : les ventes en personne restent 100 % sur l'appareil Clover, donc "Vente en magasin" (l'enregistrement manuel de secours dans l'admin) est retiré du produit — page, formulaire et reçu supprimés, lien de menu retiré. Le module Finances reste en place : c'est lui la source de vérité pour le total des ventes (en ligne + Clover), pas le tableau de bord de Clover. |
