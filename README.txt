Lucky Réparations & Créations — V8 Base propre

Objectif :
- une seule source de données : content/realisations.json ;
- le CMS et la galerie utilisent exactement le même fichier ;
- plus aucune carte codée en dur ;
- clic sur une carte = ouverture photo plein écran ;
- conservation de la réalisation Lampe cheval ;
- base plus simple à maintenir.

Installation :
1. Décompresser l'archive.
2. GitHub > Add file > Upload files.
3. Glisser tout le contenu.
4. Commit changes.
5. Attendre le redéploiement Netlify.
6. Recharger avec Ctrl + F5.


V8.1 Back-office simple : ouvrir /backoffice/ pour gérer les réalisations et exporter content/realisations.json.

V9 Back-office GitHub automatique :
- URL : /backoffice/
- Ajout/modification/suppression des réalisations.
- Upload d'images vers assets/uploads via GitHub API.
- Bouton Publier : met à jour content/realisations.json dans GitHub.
- Nécessite un Personal Access Token GitHub enregistré localement dans le navigateur.

V10 Back-office Galerie Pro :
- Glisser-déposer des images.
- Upload multiple vers GitHub.
- Réorganisation des photos avec ↑ / ↓.
- Définir une photo comme image principale avec ⭐.
- Duplication de réalisation.
- Mode brouillon.
- Validation avant publication.
- Bibliothèque photos.
- Génération d'une description simple.

V10.1 Back-office simplifié :
- Suppression de l'onglet Photos séparé.
- Bibliothèque d'images intégrée directement dans Réalisations.
- Sélection d'une image existante.
- Bouton pour utiliser l'image sélectionnée comme image principale.
- Bouton pour ajouter l'image sélectionnée à la galerie.


V10.2 SEO + Google Search Console :
- Ajout de la balise de validation Google Search Console.
- URLs mises à jour vers Cloudflare Pages.
- robots.txt et sitemap.xml mis à jour.
- Balises SEO générales : keywords, Open Graph, Twitter Card, theme-color.
- Données structurées LocalBusiness sur la page d'accueil.

V10.3 :
- Icône automatique selon la catégorie.
- Champ icône non modifiable.
- Badges de catégorie dans la liste.
- Compteur photo par réalisation.
- Suppression remplacée par archivage en brouillon.
- Aperçu image principale agrandi.

V10.4 :
- Liste filtrée par défaut sur les réalisations actives.
- Filtres : Actives, À la une, Brouillons, Archivées, Tout.
- Les nouvelles réalisations commencent en brouillon.
- Bouton Archiver au lieu de laisser les anciens éléments encombrer la liste.
- Bouton Réactiver.
- Suppression définitive séparée et confirmée.


V11 stable : back-office reconstruit pour corriger les boutons et onglets inactifs.


V11.1 : boutons en onclick direct pour éviter tout blocage d'onglets.


V12 SEO Professionnel : pages SEO locales Mouscron/Tournai, sitemap enrichi, robots.txt, balises SEO, Open Graph, données structurées LocalBusiness/Service.
