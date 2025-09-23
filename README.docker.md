# Déploiement Docker pour Eduvate

Ce document explique comment déployer Eduvate avec Docker en environnement de préproduction.

## Structure des fichiers

- `Dockerfile` : Configuration pour construire l'image de l'application frontend
- `docker-compose.yml` : Configuration complète pour la production/préproduction
- `docker-compose.dev.yml` : Configuration simplifiée pour le développement local
- `nginx.conf` : Configuration du serveur web Nginx
- `database/init.sql` : Script d'initialisation de la base de données

## Installation et lancement

### Préproduction complète

1. **Cloner le projet et naviguer dans le répertoire**
```bash
git clone <votre-repo>
cd eduvate
```

2. **Construire et lancer tous les services**
```bash
docker-compose up -d --build
```

3. **Vérifier le statut des services**
```bash
docker-compose ps
```

4. **Accéder aux services**
- Application frontend : http://localhost:3000
- API Supabase : http://localhost:8000
- Interface Adminer (BDD) : http://localhost:8080
  - Serveur : db
  - Utilisateur : postgres
  - Mot de passe : postgres
  - Base de données : eduvate

### Développement local (base de données uniquement)

Si vous souhaitez seulement lancer la base de données en local :

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Accès :
- Base de données PostgreSQL : localhost:5433
- Interface Adminer : http://localhost:8081

## Variables d'environnement

Les variables principales sont configurées dans le docker-compose.yml :

- `POSTGRES_DB` : Nom de la base de données
- `POSTGRES_USER` : Utilisateur PostgreSQL
- `POSTGRES_PASSWORD` : Mot de passe PostgreSQL
- `VITE_SUPABASE_URL` : URL de l'API Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` : Clé publique Supabase

## Structure de la base de données

Le script `database/init.sql` crée automatiquement :

### Tables principales
- `schools` : Écoles
- `teachers` : Professeurs
- `classes` : Classes
- `students` : Étudiants
- `subjects` : Matières
- `grades` : Notes
- `attendance` : Présences
- `attendance_sessions` : Sessions de présence QR

### Tables de liaison
- `teacher_classes` : Assignation professeurs-classes
- `class_subjects` : Matières par classe

### Fonctionnalités automatiques
- Triggers pour `updated_at`
- Row Level Security (RLS) activé
- Contraintes de clés étrangères
- Données de test initiales

## Commandes utiles

### Arrêter tous les services
```bash
docker-compose down
```

### Supprimer les volumes (données)
```bash
docker-compose down -v
```

### Voir les logs
```bash
docker-compose logs -f [service-name]
```

### Reconstruire un service spécifique
```bash
docker-compose up -d --build frontend
```

### Connexion à la base de données
```bash
docker exec -it eduvate_db psql -U postgres -d eduvate
```

### Backup de la base de données
```bash
docker exec eduvate_db pg_dump -U postgres eduvate > backup.sql
```

### Restaurer la base de données
```bash
docker exec -i eduvate_db psql -U postgres eduvate < backup.sql
```

## Sécurité en production

Pour un déploiement en production, modifiez :

1. **Mots de passe** : Changez tous les mots de passe par défaut
2. **JWT Secret** : Utilisez un token sécurisé de 32+ caractères
3. **Ports** : Exposez uniquement les ports nécessaires
4. **SSL/TLS** : Ajoutez la terminaison SSL
5. **Policies RLS** : Renforcez les politiques de sécurité
6. **Logs** : Configurez la rotation des logs

## Monitoring

Les services incluent des health checks :
- Base de données : `pg_isready`
- Supabase : endpoint `/health`

## Problèmes courants

1. **Port déjà utilisé** : Modifiez les ports dans docker-compose.yml
2. **Permissions** : Vérifiez les droits sur les dossiers montés
3. **Mémoire** : Assurez-vous d'avoir suffisamment de RAM (min 2GB)
4. **Docker version** : Utilisez Docker 20+ et Docker Compose 2+

## Support

Pour des questions spécifiques au déploiement, consultez :
- Documentation Docker : https://docs.docker.com/
- Documentation PostgreSQL : https://www.postgresql.org/docs/
- Documentation Nginx : https://nginx.org/en/docs/