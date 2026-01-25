# Guide de Tests Eduvate

## 📋 Vue d'ensemble

Ce projet utilise une infrastructure de tests complète avec :
- **Vitest** : Tests unitaires et d'intégration
- **Playwright** : Tests End-to-End (E2E)
- **MSW** : Mocking des API Supabase
- **GitHub Actions** : CI/CD automatisé
- **Docker** : Environnement de tests isolé

---

## 🚀 Exécution Locale

### Tests Unitaires & Intégration

```bash
# Mode watch (développement)
npm run test

# Exécution unique
npm run test:run

# Avec couverture de code
npm run test:coverage
```

### Tests E2E (Playwright)

```bash
# Installer les navigateurs (première fois)
npx playwright install

# Lancer les tests E2E
npm run test:e2e

# Mode debug interactif
npx playwright test --debug

# Générer le rapport
npx playwright show-report
```

### Suite Complète

```bash
# Tous les tests avant déploiement
npm run test:all
```

---

## 🐳 Exécution avec Docker

### Commandes Docker Compose

```bash
# Tous les tests
docker compose -f docker-compose.test.yml up --build

# Tests unitaires uniquement
docker compose -f docker-compose.test.yml up unit-tests --build

# Tests E2E uniquement
docker compose -f docker-compose.test.yml up e2e-tests --build

# Rapport de couverture
docker compose -f docker-compose.test.yml up coverage --build

# Nettoyer après les tests
docker compose -f docker-compose.test.yml down -v
```

### Construction Manuelle de l'Image

```bash
# Construire l'image de test
docker build -f Dockerfile.test -t eduvate-tests .

# Lancer les tests unitaires
docker run --rm eduvate-tests npm run test:run

# Lancer avec couverture (monter le volume pour récupérer le rapport)
docker run --rm -v $(pwd)/coverage:/app/coverage eduvate-tests npm run test:coverage
```

---

## 🔄 GitHub Actions (CI/CD)

### Déclencheurs

Le workflow `.github/workflows/test.yml` s'exécute sur :
- **Push** vers `main` ou `develop`
- **Pull Request** vers `main` ou `develop`

### Jobs Exécutés

| Job | Description | Dépendances |
|-----|-------------|-------------|
| `unit-tests` | Vitest + Couverture | - |
| `edge-function-tests` | Tests Deno Edge Functions | - |
| `e2e-tests` | Playwright (Chromium) | unit-tests |
| `build` | Vérification TypeScript + Build | unit-tests |

### Configuration des Secrets GitHub

Ajouter ces secrets dans **Settings → Secrets → Actions** :

```
VITE_SUPABASE_URL=https://nqsvluszgpqnoqybzpvk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Voir les Résultats

1. Aller sur l'onglet **Actions** du repo GitHub
2. Cliquer sur le workflow pour voir les détails
3. Les rapports Playwright sont uploadés en **Artifacts** si les tests échouent

---

## 📁 Structure des Tests

```
src/
├── test/
│   ├── setup.ts              # Configuration globale Vitest
│   ├── mocks/
│   │   ├── handlers.ts       # Handlers MSW pour API mocking
│   │   └── server.ts         # Serveur MSW
│   ├── fixtures/
│   │   ├── users.ts          # Données de test utilisateurs
│   │   └── grades.ts         # Données de test notes
│   ├── unit/
│   │   ├── auth-validation.test.ts
│   │   └── utils.test.ts
│   └── integration/
│       ├── AuthPage.test.tsx
│       └── security.test.tsx
e2e/
├── auth.spec.ts              # Tests E2E authentification
├── security.spec.ts          # Tests E2E sécurité
├── teacher.spec.ts           # Tests E2E enseignant
├── student.spec.ts           # Tests E2E étudiant
└── school-admin.spec.ts      # Tests E2E admin école
```

---

## 🎯 Couverture de Code

### Seuils Minimaux (vitest.config.ts)

```typescript
thresholds: {
  statements: 60,
  branches: 60,
  functions: 60,
  lines: 60,
}
```

### Générer le Rapport

```bash
npm run test:coverage
# Rapport HTML: ./coverage/index.html
```

---

## 🔧 Dépannage

### Tests qui échouent en CI mais pas en local

1. Vérifier les variables d'environnement dans GitHub Secrets
2. S'assurer que le build passe avant les tests E2E
3. Vérifier les timeouts (augmenter si nécessaire)

### Playwright ne trouve pas Chromium

```bash
# Réinstaller les navigateurs
npx playwright install --with-deps chromium
```

### Docker build échoue

```bash
# Nettoyer le cache Docker
docker system prune -a
docker compose -f docker-compose.test.yml build --no-cache
```

### MSW ne mocke pas les requêtes

Vérifier que `src/test/setup.ts` est bien chargé dans `vitest.config.ts` :
```typescript
setupFiles: ["./src/test/setup.ts"]
```

---

## 📊 Badges (README.md)

Ajouter ces badges au README principal :

```markdown
![Tests](https://github.com/VOTRE_USERNAME/VOTRE_REPO/actions/workflows/test.yml/badge.svg)
[![codecov](https://codecov.io/gh/VOTRE_USERNAME/VOTRE_REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/VOTRE_USERNAME/VOTRE_REPO)
```
