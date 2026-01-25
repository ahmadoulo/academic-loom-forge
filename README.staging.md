# Déploiement Staging - Eduvate

Ce document explique comment déployer Eduvate en staging avec le projet Supabase Lovable.

## Configuration

### 1. Copier le fichier d'environnement

Sur votre serveur staging, copiez le fichier `.env.staging` vers `.env` :

```bash
cp .env.staging .env
```

### 2. Déployer l'application

Utilisez le fichier `docker-compose.staging.yml` pour déployer :

```bash
# Pull les dernières modifications
git pull

# Rebuild et redémarrer
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml build --no-cache
docker compose -f docker-compose.staging.yml up -d
```

### 3. Vérifier le déploiement

```bash
# Voir les logs
docker compose -f docker-compose.staging.yml logs -f

# Vérifier le statut
docker compose -f docker-compose.staging.yml ps
```

## Différences avec les autres environnements

- **Lovable Dev** (`eduvate.lovable.app`) : Utilise automatiquement `nqsvluszgpqnoqybzpvk.supabase.co`
- **Staging** (`staging.eduvate.app`) : Doit utiliser `docker-compose.staging.yml` avec `.env.staging`
- **Local PostgREST** : Utilise `docker-compose.yml` (base de données locale)
- **Self-hosted Supabase** : Utilise `docker-compose.selfhost.yml` (Supabase complet local)

## Projet Supabase

Le projet Supabase utilisé est : `nqsvluszgpqnoqybzpvk`

**Important** : L'edge function `validate-invitation-token` est déployée automatiquement par Lovable sur ce projet.

## Dépannage

Si l'activation de compte ne fonctionne pas :

1. Vérifier que `.env` contient les bonnes variables (projet `nqsvluszgpqnoqybzpvk`)
2. Vérifier que le build utilise ces variables :
   ```bash
   docker compose -f docker-compose.staging.yml config
   ```
3. Forcer un rebuild complet :
   ```bash
   docker compose -f docker-compose.staging.yml down -v
   docker compose -f docker-compose.staging.yml build --no-cache
   docker compose -f docker-compose.staging.yml up -d
   ```
4. Vérifier les network logs du navigateur pour confirmer que l'URL Supabase est correcte