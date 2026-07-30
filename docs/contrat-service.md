# Reptile Concept — Document vivant : Contrat de service

> **Comment utiliser ce fichier**
> Même principe que `proposal.md` et `cahier-de-charges.md` : ce fichier est à la fois la source de vérité du contenu contractuel ET un prompt prêt à coller dans une IA (Gemini) pour générer un PDF signable, avec le branding GABAN Solutions, prêt à être téléversé dans DocuSign.
>
> ⚠️ Avant l'envoi pour signature, remplace tous les `[À COMPLÉTER]` par les vraies données (raisons sociales, adresses, numéros de taxes, noms des signataires). Un contrat avec des champs vides ne devrait pas être envoyé pour signature.

---

## 🧭 Instructions pour l'IA qui génère le PDF (ne pas modifier cette section)

Actúa como diseñador/a de documents légaux. Genera un PDF (o HTML/diseño listo para exportar a PDF) de un **contrat de service professionnel**, prêt à être téléversé dans DocuSign pour signature électronique, usando EXACTAMENTE el contenido de la sección "📄 Contenu du contrat" más abajo — no inventes cláusulas nuevas, no cambies los montos, fechas ni el alcance descrito. No resumas ni acortes las clauses legales : reproduce el texto de cada article tal cual.

**Contexte** : "Reptile Concept", commerce de reptiles à Lachine, Québec, cliente. "GABAN Solutions" (Montréal, QC — gabansolutions.ca — 514-258-0648), prestataire de services de développement web.

**Estilo** : Document sobrio et professionnel, format contrat légal (pas une pièce marketing). Portada simple en noir/carbone (#0b0b0c) avec accent doré (#cba135) — logo/nom GABAN Solutions en haut. Corps du document en blanc, numérotation d'articles claire (Article 1, Article 2…), sous-sections numérotées (1.1, 1.2…), typographie sans-serif lisible, interligne confortable pour un document qui sera lu attentivement avant signature. Pas de viñetas doradas décoratives dans le corps légal — c'est un contrat, pas une brochure. Pied de page avec numéro de page sur chaque page. Idioma : français (français québécois, terminologie juridique du Québec — ex. "Code civil du Québec", TPS/TVQ). Longueur : autant de pages que nécessaire pour reproduire tout le contenu ci-dessous sans le compresser.

**Structure** : Page de garde (titre, parties, date) → corps du contrat avec tous les articles dans l'ordre exact ci-dessous → bloc de signatures en dernière page, avec pour chaque partie : nom en lettres moulées, titre, date, et un espace signature clairement délimité (rectangle ou ligne) — ces zones doivent rester des champs de texte/signature simples et bien identifiés, car les champs de signature électronique DocuSign seront positionnés par-dessus après l'export en PDF.

Genera el documento completo ahora, usando el contenido exacto de la sección de abajo, sin omitir ninguna clause.

---

## 📄 Contenu du contrat (cette section se met à jour avec le projet)

### Page de garde

**CONTRAT DE SERVICE — DÉVELOPPEMENT D'UNE PLATEFORME WEB**

Entre :

**GABAN Solutions**, entreprise individuelle (entreprise à propriétaire unique), ayant son établissement au 588 23e Avenue, Lachine, Québec, H8S 3V2, représentée par Mitchell Castellanos, propriétaire unique, ci-après « **le Prestataire** » ou « **GABAN Solutions** »

Et :

**Reptile Concept**, entreprise, ayant son établissement au 1150 rue Notre-Dame, Lachine, Québec, H8S 2C4, représentée par [NOM DU/DE LA REPRÉSENTANT·E À COMPLÉTER], ci-après « **le Client** »

Ci-après collectivement désignées « **les Parties** ».

Date du contrat : 30 juillet 2026

---

### Article 1 — Objet du contrat

1.1 Le présent contrat a pour objet la conception, le développement et la livraison, par le Prestataire au bénéfice du Client, d'une plateforme web sur mesure comprenant une boutique en ligne et un panneau d'administration, telle que décrite à l'Annexe A (Description des livrables), laquelle fait partie intégrante du présent contrat.

1.2 Les Parties reconnaissent que la description détaillée du projet figure également dans les documents suivants, préparés conjointement au cours du projet et annexés à titre informatif : la Proposition commerciale et le Cahier des charges. En cas de divergence entre ces documents et le présent contrat, **le présent contrat et son Annexe A prévalent**.

### Article 2 — Livrables inclus

2.1 Le Prestataire livre au Client l'ensemble des composants suivants, déjà développés et fonctionnels à la date de signature :

**Boutique en ligne (site public)**
- Site bilingue français/anglais
- Catalogue d'animaux avec fiche détaillée par animal (photos réelles, génétique, lignée, prix, disponibilité en temps réel)
- Boutique d'accessoires avec fiche produit détaillée et sélecteur de quantité
- Panier et passage à la caisse avec paiement direct dans le portail
- Calcul et détail des taxes TPS/TVQ sur chaque commande (sous-total, TPS, TVQ, total), numéros d'inscription et taux configurables depuis l'admin
- Retrait en magasin comme mode de livraison, avec suivi de commande (payée, en préparation, prête pour retrait, récupérée)
- Délai de retrait et frais d'annulation configurables, avec expiration automatique des commandes non récupérées
- Vitrine des options de paiement (badges Stripe/Klarna, paiement différé)
- Flux d'avis clients après un retrait, avec modération avant publication
- Image de marque du Client intégrée partout (logo, couleurs, photos)
- Comptes clients : création de compte, connexion, historique des commandes, liste de souhaits (wishlist)

**Panneau d'administration**
- Navigation en menu latéral regroupée par catégorie, adaptée aux mobiles et tablettes
- Connexion sécurisée pour l'équipe du Client
- Gestion des animaux, des espèces, des produits (ajout/modification/suppression, photos)
- Gestion des commandes et de leur cycle de vie, annulation avec ou sans frais
- Téléversement direct de photos depuis l'ordinateur
- Gestion des clients (historique, notes, ajout manuel, import en bloc depuis QuickBooks)
- Vente en magasin (point de vente) avec intégration au terminal Clover existant
- Relevé financier unifié (ventes en ligne et en magasin) avec filtres et détail des taxes
- Reçus de vente imprimables et envoyables par courriel
- Page de paramètres, modération des avis, bandeau d'annonces
- Suivi de performance intégré (aucun abonnement tiers requis)
- Campagnes courriel bilingues avec journal des envois
- Coordonnées de l'entreprise modifiables, reflétées automatiquement partout

**Courriels automatiques**
- Confirmation de commande, avis de changement de statut, avis d'expiration — la mise en production de l'envoi réel est conditionnelle à la connexion, par le Client ou le Prestataire selon entente, d'un fournisseur de courriel transactionnel

**Infrastructure**
- Hébergement en production, base de données, nom de domaine et déploiement continu

2.2 La liste complète et détaillée des fonctionnalités figure à l'Annexe A. Le Client reconnaît avoir pris connaissance de cette liste et en accepter le contenu comme correspondant à l'ensemble des livrables du présent contrat.

### Article 3 — Exclusions

3.1 Ne sont **pas inclus** dans le prix prévu à l'Article 4 les frais d'abonnements récurrents facturés par des tiers, notamment (montants approximatifs, indépendants du Prestataire et sujets à changement par les fournisseurs concernés) :
- Base de données de production (gratuite au départ, puis environ 25 $ à 70 $ USD/mois selon le volume)
- Hébergement du site (gratuit au départ, puis facturation mensuelle selon le trafic)
- Nom de domaine (environ 15 $ à 20 $ CAD par année)
- Service d'envoi de courriels transactionnels et de campagnes
- Frais de transaction du processeur de paiement (pourcentage par vente)
- Stockage des photos téléversées
- Abonnement Clover déjà détenu par le Client (inchangé)

3.2 Le Client demeure responsable de la souscription et du paiement de ces services tiers en son nom propre.

3.3 Toute fonctionnalité nouvelle, ne faisant pas partie de la portée décrite à l'Annexe A, fait l'objet d'une proposition et d'un prix distincts, convenus par écrit entre les Parties avant exécution.

### Article 4 — Prix et modalités de paiement

4.1 **Prix forfaitaire** : le prix total du projet décrit à l'Annexe A est de **6 000,00 $ CAD**, avant taxes applicables.

4.2 **Taxes applicables** (TPS 5 % et TVQ 9,975 %, calculées sur le prix forfaitaire) :

| | Montant |
|---|---|
| Prix forfaitaire (avant taxes) | 6 000,00 $ CAD |
| TPS (5 %) | 300,00 $ CAD |
| TVQ (9,975 %) | 598,50 $ CAD |
| **Total, taxes incluses** | **6 898,50 $ CAD** |

Numéro d'inscription TPS/TVH de GABAN Solutions : 774415178 RT0001
Numéro d'inscription TVQ de GABAN Solutions : 4045997729 TQ0001

4.3 **Échéancier de paiement**, en deux versements égaux :

- **Premier versement (50 %) — à la signature du présent contrat : 3 449,25 $ CAD**, payable dans les [3] jours suivant la signature.
- **Solde (50 %) — à la mise en ligne du portail : 3 449,25 $ CAD**, exigible dès que les trois conditions suivantes sont réunies : (a) le portail est en ligne en environnement de production, (b) les personnes désignées par le Client ont reçu la formation nécessaire à l'utilisation du panneau d'administration, et (c) le Client a confirmé par écrit sa satisfaction quant à l'utilisation finale de la plateforme. Ces conditions sont normalement réunies dans un délai maximal de **5 jours ouvrables** suivant la signature du présent contrat, sous réserve de l'article 4.5.

4.4 **Mode de paiement** : les deux versements sont effectués par virement Interac (« e-transfer ») à l'adresse courriel **payments@gabansolutions.ca**. Une confirmation écrite de réception est transmise par le Prestataire après chaque versement.

4.5 Si le délai de 5 jours ouvrables prévu à l'article 4.3 n'est pas respecté en raison d'un retard imputable au Client (notamment un délai à fournir des informations, du contenu, des accès, ou à assister à la formation prévue), ce délai est prolongé d'une durée équivalente au retard constaté, sans pénalité pour le Prestataire.

4.6 Si le Client ne confirme pas sa satisfaction ni ne signale par écrit de motif raisonnable de refus dans les **5 jours ouvrables** suivant la mise en ligne et la formation, la plateforme est réputée acceptée et le solde prévu à l'article 4.3 devient immédiatement exigible.

4.7 Tout versement en retard porte intérêt au taux de 1,5 % par mois (19,56 % annuellement) à compter de son échéance.

### Article 5 — Confidentialité

5.1 Dans le cadre de l'exécution du présent contrat, le Prestataire pourra avoir accès à des renseignements confidentiels du Client, incluant notamment : données commerciales et financières, inventaire, listes de clients, coordonnées, historique de ventes et toute autre information relative à l'exploitation de l'entreprise du Client (ci-après les « **Renseignements confidentiels** »).

5.2 Le Prestataire s'engage à :
- utiliser les Renseignements confidentiels **exclusivement aux fins du développement, des tests et de la livraison de la plateforme** prévue au présent contrat;
- ne **jamais** vendre, louer, partager ou divulguer les Renseignements confidentiels à un tiers, sous quelque forme que ce soit;
- ne **pas conserver** les Renseignements confidentiels au-delà de ce qui est strictement nécessaire à l'exécution du présent contrat — **GABAN Solutions ne stocke pas ces données** de façon permanente et les retire de tout environnement de développement ou de test dès qu'elles ne sont plus nécessaires;
- protéger les Renseignements confidentiels par des mesures de sécurité raisonnables pendant toute période où ils sont en sa possession.

5.3 Cette obligation de confidentialité survit à la résiliation ou à l'expiration du présent contrat pour une durée de **2 ans**.

5.4 Les données de production de la plateforme (commandes, clients, inventaire) demeurent en tout temps hébergées dans l'infrastructure du Client (base de données et hébergement au nom du Client — voir Article 3), et non sur des systèmes internes du Prestataire.

5.5 Le Prestataire s'engage à respecter les obligations applicables en matière de protection des renseignements personnels en vertu de la *Loi sur la protection des renseignements personnels dans le secteur privé* du Québec (Loi 25) dans la mesure où il traite des renseignements personnels de la clientèle du Client au cours du développement.

### Article 6 — Propriété intellectuelle

6.1 Sous réserve du paiement intégral du prix prévu à l'Article 4, le Prestataire cède au Client, à compter du paiement du solde final, tous les droits de propriété intellectuelle sur le code source, les designs et les autres livrables développés spécifiquement pour le Client dans le cadre du présent contrat.

6.2 Jusqu'au paiement intégral, le Prestataire demeure titulaire de ces droits; le Client bénéficie d'une licence d'utilisation limitée à des fins de test et de formation.

6.3 Le Prestataire conserve le droit d'utiliser des composants génériques, bibliothèques ou méthodes de développement non spécifiques au Client dans d'autres projets, ainsi que le droit de mentionner le projet et d'utiliser des captures d'écran non confidentielles à des fins de portfolio, sauf refus écrit du Client.

### Article 7 — Garantie et support

7.1 Le Prestataire garantit que la plateforme livrée est conforme à la description de l'Annexe A et corrige, sans frais additionnels, tout défaut de fonctionnement (bogue) signalé par le Client.

7.2 Le support courant inclus sans frais additionnels comprend : les ajustements mineurs, les corrections de bogues et l'accompagnement dans l'utilisation normale de la plateforme, **pendant une période de 12 mois suivant la mise en ligne** de la plateforme en production. Au-delà de cette période, le support continu fait l'objet d'une entente distincte entre les Parties.

7.3 Ne sont pas couverts par le prix forfaitaire les changements de grande envergure, soit l'ajout de toute fonctionnalité ne faisant pas partie de la portée décrite à l'Annexe A, lesquels font l'objet d'un devis distinct convenu par écrit avant exécution.

### Article 8 — Limitation de responsabilité

8.1 La responsabilité totale du Prestataire envers le Client, pour quelque cause que ce soit découlant du présent contrat, ne peut excéder le montant total payé par le Client en vertu du présent contrat.

8.2 Le Prestataire n'est pas responsable des interruptions de service, pertes de données ou dommages résultant de la défaillance de services tiers (hébergement, base de données, processeur de paiement, fournisseur de courriel, terminal Clover) hors de son contrôle raisonnable.

### Article 9 — Résiliation

9.1 Le présent contrat peut être résilié par écrit d'un commun accord entre les Parties en tout temps.

9.2 Si le Client résilie le contrat après le premier versement mais avant la livraison finale, le premier versement (50 %) demeure acquis au Prestataire à titre de compensation pour le travail déjà effectué, sans préjudice au droit du Prestataire de réclamer une compensation additionnelle proportionnelle au travail effectué au-delà de ce montant si celui-ci excède 50 % du projet.

9.3 Si le Prestataire n'est pas en mesure de livrer la plateforme substantiellement conforme à l'Annexe A, le Client peut résilier le contrat et obtenir le remboursement du premier versement, sous déduction d'une somme raisonnable pour le travail déjà livré et accepté.

### Article 10 — Force majeure

10.1 Aucune des Parties n'est responsable d'un retard ou d'un défaut d'exécution résultant d'un cas de force majeure échappant à son contrôle raisonnable.

### Article 11 — Loi applicable et règlement des différends

11.1 Le présent contrat est régi par les lois de la province de Québec et les lois fédérales du Canada applicables, incluant le *Code civil du Québec*.

11.2 Tout différend découlant du présent contrat relève de la compétence exclusive des tribunaux du district judiciaire de Montréal, Québec.

### Article 12 — Dispositions générales

12.1 Le présent contrat, incluant son Annexe A, constitue l'intégralité de l'entente entre les Parties et remplace toute entente ou communication antérieure, écrite ou verbale, relative à son objet.

12.2 Toute modification au présent contrat doit être faite par écrit et signée par les deux Parties.

12.3 Si une disposition du présent contrat est jugée invalide ou inapplicable, les autres dispositions demeurent en vigueur.

12.4 Le présent contrat peut être signé électroniquement (incluant via DocuSign), chaque signature électronique ayant la même valeur juridique qu'une signature manuscrite.

### Bloc de signatures

**Pour GABAN Solutions**

Nom : Mitchell Castellanos
Titre : Propriétaire unique
Date : ______________
Signature : ______________

**Pour Reptile Concept**

Nom : [À COMPLÉTER]
Titre : [À COMPLÉTER]
Date : ______________
Signature : ______________

### Annexe A — Description détaillée des livrables

*(Reproduire ici, en annexe, l'intégralité de la section « Ce qui est déjà en place » du document `proposal.md`, y compris Boutique en ligne, Panneau d'administration, Courriels automatiques et Infrastructure — même contenu que l'Article 2, présenté ici de façon exhaustive à titre de référence contractuelle.)*

---

## État du projet (journal, pour garder ce fichier à jour)

| Date | Changement |
|---|---|
| 2026-07-30 | Document vivant créé à partir de `proposal.md` et `cahier-de-charges.md`. Contrat de service complet en français, prêt pour révision légale et envoi via DocuSign : prix 6 000 $ CAD + taxes (6 898,50 $ CAD taxes incluses), versement initial de 3 449,25 $ CAD à la signature, solde de 3 449,25 $ CAD à la mise en ligne/formation/satisfaction (max. 5 jours ouvrables), paiement par Interac e-transfer à payments@gabansolutions.ca, clause de confidentialité (non-conservation des données du Client), propriété intellectuelle, garantie/support, résiliation, loi applicable (Québec). Plusieurs champs `[À COMPLÉTER]` restent à remplir avant signature (voir résumé fourni au Client). |
| 2026-07-30 | Ajout des numéros d'inscription TPS/TVH (774415178 RT0001) et TVQ (4045997729 TQ0001) de GABAN Solutions à l'Article 4.2. Fixé la durée du support inclus sans frais à 12 mois suivant la mise en ligne (Article 7.2). Champs restants à compléter avant envoi : raisons sociales, adresses et représentant·e·s des deux Parties (page de garde), durée de survie de la confidentialité (Article 5.3 — 2 ans par défaut, à confirmer). |
| 2026-07-30 | Renseignements de GABAN Solutions complétés : entreprise individuelle représentée par Mitchell Castellanos (propriétaire unique), établissement au 588 23e Avenue, Lachine, Québec, H8S 3V2. Date du contrat fixée au 30 juillet 2026. Durée de confidentialité confirmée à 2 ans (Article 5.3). Il reste à compléter la raison sociale, l'adresse et le/la représentant·e de Reptile Concept sur la page de garde et le bloc de signatures avant l'envoi pour signature. |
| 2026-07-30 | Adresse de Reptile Concept complétée : 1150 rue Notre-Dame, Lachine, Québec, H8S 2C4. Il reste à compléter le nom du/de la représentant·e de Reptile Concept (page de garde, Article 1) et le bloc de signatures avant l'envoi pour signature. |
