# Guide de Déploiement Docker avec PostgreSQL Local

## Configuration pour utiliser PostgreSQL local au lieu de Lovable Cloud

### 1. Structure du Projet

Le projet est configuré pour fonctionner avec deux modes :
- **Mode Développement Lovable** : Utilise Lovable Cloud (Supabase hébergé)
- **Mode Production Docker** : Utilise PostgreSQL local avec PostgREST

### 2. Configuration Docker

Le fichier `docker-compose.yml` est déjà configuré pour utiliser PostgreSQL local. Les URLs sont définies comme suit :

```yaml
frontend:
  build:
    args:
      VITE_SUPABASE_URL: http://localhost:8095
      VITE_SUPABASE_PUBLISHABLE_KEY: "mysuperlongsecretkey_1234567890abcdef"
```

### 3. Démarrage avec Docker

```bash
# 1. Reconstruire l'image (important après modifications du code)
docker-compose build --no-cache

# 2. Démarrer tous les services
docker-compose up -d

# 3. Vérifier que tous les services sont actifs
docker-compose ps
```

### 4. Services Disponibles

- **Frontend** : http://localhost:3000
- **PostgreSQL** : localhost:5432
- **PostgREST API** : http://localhost:8095
- **Adminer** (Interface DB) : http://localhost:8094

### 5. Connexion à Adminer

Pour gérer la base de données visuellement :
- URL : http://localhost:8094
- Système : PostgreSQL
- Serveur : db
- Utilisateur : postgres
- Mot de passe : postgres
- Base de données : eduvate

### 6. Initialisation de la Base de Données

La base de données est automatiquement initialisée avec le fichier `database/init.sql` au premier démarrage. Ce fichier contient :

- Toutes les tables (schools, teachers, students, classes, etc.)
- Les tables de devoirs (assignments)
- Les tables de demandes de documents (document_requests, document_request_tracking)
- Les politiques RLS (Row Level Security)
- Les triggers pour updated_at
- Les données de démonstration

### 7. Rebuild après Modifications du Code

**IMPORTANT** : Chaque fois que vous modifiez le code source, vous devez reconstruire l'image Docker :

```bash
# Arrêter les services
docker-compose down

# Reconstruire sans cache
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

### 8. Réinitialiser la Base de Données

Si vous devez réinitialiser complètement la base de données :

```bash
# Arrêter et supprimer tous les volumes
docker-compose down -v

# Redémarrer (cela réexécutera init.sql)
docker-compose up -d
```

### 9. Variables d'Environnement

Les variables sont définies au moment du build dans le Dockerfile :

- `VITE_SUPABASE_URL` : URL de l'API PostgREST
- `VITE_SUPABASE_PUBLISHABLE_KEY` : Clé JWT pour PostgREST

**Pour modifier ces valeurs**, éditez le fichier `docker-compose.yml` dans la section `frontend > build > args`.

### 10. Différences avec Lovable Cloud

| Fonctionnalité | Lovable Cloud | Docker Local |
|----------------|---------------|--------------|
| Base de données | Supabase hébergé | PostgreSQL local |
| API | Supabase REST API | PostgREST |
| Authentification | Supabase Auth | Custom avec user_credentials |
| URL API | https://nqsvluszgpqnoqybzpvk.supabase.co | http://localhost:8095 |

### 11. Dépannage

#### L'application se connecte toujours à Lovable Cloud

**Solution** : Vérifiez que les build args sont correctement définis dans docker-compose.yml et reconstruisez :
```bash
docker-compose build --no-cache frontend
docker-compose up -d
```

#### Les modifications de code ne sont pas visibles

**Solution** : Reconstruisez l'image après chaque modification :
```bash
docker-compose build --no-cache frontend
docker-compose restart frontend
```

#### Erreur de connexion à PostgreSQL

**Solution** : Vérifiez que le service DB est démarré et healthy :
```bash
docker-compose logs db
```

#### PostgREST retourne des erreurs d'authentification

**Solution** : Vérifiez que la JWT_SECRET est correcte dans docker-compose.yml (doit correspondre entre postgrest et les build args du frontend).

### 12. Logs et Débogage

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f frontend
docker-compose logs -f postgrest
docker-compose logs -f db
```

### 13. Passer en Mode Production

Pour un vrai déploiement en production :

1. Modifiez les mots de passe dans docker-compose.yml
2. Utilisez un JWT_SECRET sécurisé (minimum 32 caractères)
3. Configurez SSL/TLS pour PostgreSQL
4. Utilisez un reverse proxy (Nginx/Traefik) avec HTTPS
5. Configurez des backups automatiques de la base de données

### 14. Commandes Utiles

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Redémarrer un service spécifique
docker-compose restart frontend

# Voir l'état des services
docker-compose ps

# Accéder au shell d'un conteneur
docker-compose exec frontend sh
docker-compose exec db psql -U postgres -d eduvate
```
