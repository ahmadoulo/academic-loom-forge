# 📧 Système de Notifications d'Absence Automatiques

## Vue d'ensemble

Le système envoie automatiquement des notifications par email aux étudiants et tuteurs lorsqu'une absence est enregistrée, **1 minute après la fin d'une séance**.

## 🔄 Fonctionnement

### 1. Notification Automatique (Recommandé)

Le système vérifie automatiquement toutes les minutes si des séances sont terminées et si des absences doivent être notifiées.

**Comment ça marche :**
- Une Edge Function (`auto-send-absence-notifications`) s'exécute périodiquement
- Elle vérifie les séances terminées depuis 1-10 minutes
- Si tous les étudiants sont marqués et qu'il y a des absents, les notifications sont envoyées
- Chaque notification n'est envoyée qu'**une seule fois** par séance (trackée dans `absence_notifications_log`)

**Activation automatique :**
- Le système est activé automatiquement quand un administrateur école ouvre le dashboard
- Les notifications continuent tant que le dashboard reste ouvert

### 2. Notification Manuelle

Les professeurs peuvent également envoyer manuellement des notifications d'absence en cliquant sur le bouton **"Notifier Absences"** dans l'interface de prise de présence.

## 🔧 Configuration d'un Cron Job Externe (Optionnel)

Pour une solution plus robuste qui fonctionne même si personne n'a le dashboard ouvert, vous pouvez configurer un cron job externe.

### Option 1 : Utiliser cron-job.org (Gratuit)

1. Allez sur [cron-job.org](https://cron-job.org)
2. Créez un compte gratuit
3. Créez un nouveau cron job avec :
   - **URL** : `https://nqsvluszgpqnoqybzpvk.supabase.co/functions/v1/auto-send-absence-notifications`
   - **Schedule** : Every 1 minute
   - **Method** : POST
   - **Headers** : 
     ```
     Content-Type: application/json
     apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc3ZsdXN6Z3Bxbm9xeWJ6cHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDkwNDMsImV4cCI6MjA3MzYyNTA0M30.ShZH7nJjRabCMXGxAX4x0ASc_5xL9fX7F_XInm4oR8c
     ```

### Option 2 : Utiliser EasyCron (Gratuit)

1. Allez sur [easycron.com](https://easycron.com)
2. Créez un compte gratuit (permet 1 cron job)
3. Créez un nouveau cron job avec :
   - **URL** : `https://nqsvluszgpqnoqybzpvk.supabase.co/functions/v1/auto-send-absence-notifications`
   - **Cron Expression** : `*/1 * * * *` (toutes les minutes)
   - **HTTP Method** : POST
   - **Custom Headers** : 
     ```
     Content-Type: application/json
     apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc3ZsdXN6Z3Bxbm9xeWJ6cHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDkwNDMsImV4cCI6MjA3MzYyNTA0M30.ShZH7nJjRabCMXGxAX4x0ASc_5xL9fX7F_XInm4oR8c
     ```

### Option 3 : GitHub Actions (Pour les développeurs)

Créez un fichier `.github/workflows/absence-notifications.yml` :

```yaml
name: Send Absence Notifications

on:
  schedule:
    - cron: '*/1 * * * *' # Toutes les minutes

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            'https://nqsvluszgpqnoqybzpvk.supabase.co/functions/v1/auto-send-absence-notifications' \
            -H 'Content-Type: application/json' \
            -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc3ZsdXN6Z3Bxbm9xeWJ6cHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDkwNDMsImV4cCI6MjA3MzYyNTA0M30.ShZH7nJjRabCMXGxAX4x0ASc_5xL9fX7F_XInm4oR8c'
```

## 📊 Suivi des Notifications

Toutes les notifications envoyées sont enregistrées dans la table `absence_notifications_log` avec :
- ID de la séance (`assignment_id`)
- Date de la séance (`session_date`)
- Horodatage d'envoi (`sent_at`)
- Nombre de notifications envoyées (`sent_count`)

Cela garantit qu'**aucune notification n'est envoyée en double** pour la même séance.

## 🔍 Dépannage

### Les notifications ne sont pas envoyées

1. Vérifiez que la clé API Resend est configurée (`RESEND_API_KEY`)
2. Vérifiez les logs de l'Edge Function dans la console
3. Assurez-vous que les étudiants ont des emails configurés
4. Vérifiez que tous les étudiants sont marqués (présent/absent)

### Les notifications sont envoyées en double

Cela ne devrait pas arriver grâce à la table `absence_notifications_log`. Si cela se produit :
1. Vérifiez qu'il n'y a pas de doublons dans la table `absence_notifications_log`
2. Vérifiez les logs pour voir si plusieurs instances s'exécutent

### Tester manuellement

Vous pouvez tester l'Edge Function manuellement :

```bash
curl -X POST \
  'https://nqsvluszgpqnoqybzpvk.supabase.co/functions/v1/auto-send-absence-notifications' \
  -H 'Content-Type: application/json' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xc3ZsdXN6Z3Bxbm9xeWJ6cHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDkwNDMsImV4cCI6MjA3MzYyNTA0M30.ShZH7nJjRabCMXGxAX4x0ASc_5xL9fX7F_XInm4oR8c'
```

## ✅ Avantages du Nouveau Système

- ✅ **Fiable** : Fonctionne indépendamment du navigateur
- ✅ **Automatique** : Pas besoin d'action manuelle
- ✅ **Sans doublon** : Chaque notification n'est envoyée qu'une fois
- ✅ **Traçable** : Toutes les notifications sont enregistrées
- ✅ **Évolutif** : Peut gérer plusieurs séances simultanées
- ✅ **Robuste** : Continue de fonctionner même si le professeur se déconnecte
