# Données de Test - Documentation

## ✅ Données Créées

Ce fichier documente les données de test créées pour simuler un environnement de production.

### Résumé
- **5 Professeurs** avec emails @test.com
- **4 Classes** (3 Licence Informatique + 1 Master Finance)
- **10 Matières** réparties sur les classes
- **30 Étudiants** avec CIN commençant par "TEST"
- **Toutes les liaisons** (teacher_classes, class_subjects, student_school)

### Détails des Professeurs
| Nom Complet | Email | Qualification |
|------------|-------|---------------|
| Ahmed Benali | ahmed.benali@test.com | Doctorat en Mathématiques |
| Fatima El Idrissi | fatima.idrissi@test.com | Master en Informatique |
| Mohamed Tazi | mohamed.tazi@test.com | Master en Physique |
| Khadija Alami | khadija.alami@test.com | Licence en Français |
| Youssef Bennani | youssef.bennani@test.com | Master en Économie |

### Classes et Effectifs
| Classe | Nombre d'Étudiants | Nombre de Matières |
|--------|-------------------|-------------------|
| 1ère Année Licence Informatique | 10 | 3 |
| 2ème Année Licence Informatique | 10 | 3 |
| 3ème Année Licence Informatique | 5 | 2 |
| 1ère Année Master Finance | 5 | 2 |

### Matières par Classe
**1ère Année Licence Informatique:**
- Mathématiques 1 (coef. 3)
- Algorithmique (coef. 4)
- Communication (coef. 2)

**2ème Année Licence Informatique:**
- Mathématiques 2 (coef. 3)
- Bases de Données (coef. 4)
- Réseaux Informatiques (coef. 3)

**3ème Année Licence Informatique:**
- Développement Web (coef. 4)
- Sécurité Informatique (coef. 3)

**1ère Année Master Finance:**
- Finance d'Entreprise (coef. 5)
- Mathématiques Financières (coef. 4)

### Étudiants
- **TEST001 à TEST010** → 1ère Année Licence Informatique
- **TEST011 à TEST020** → 2ème Année Licence Informatique
- **TEST021 à TEST025** → 3ème Année Licence Informatique
- **TEST026 à TEST030** → 1ère Année Master Finance

---

## 🗑️ Suppression des Données de Test

Pour supprimer **toutes** les données de test créées, exécutez les requêtes SQL suivantes **dans l'ordre** :

```sql
-- 1. Supprimer les inscriptions des étudiants
DELETE FROM student_school 
WHERE student_id IN (
  SELECT id FROM students WHERE cin_number LIKE 'TEST%'
);

-- 2. Supprimer les liaisons classes-matières
DELETE FROM class_subjects 
WHERE subject_id IN (
  SELECT id FROM subjects 
  WHERE name IN ('Mathématiques 1', 'Algorithmique', 'Communication', 
                 'Mathématiques 2', 'Bases de Données', 'Réseaux Informatiques', 
                 'Développement Web', 'Sécurité Informatique', 
                 'Finance d''Entreprise', 'Mathématiques Financières')
  AND school_id = '42f93ce5-9562-4825-a249-b780018834da'
);

-- 3. Supprimer les matières
DELETE FROM subjects 
WHERE name IN ('Mathématiques 1', 'Algorithmique', 'Communication', 
               'Mathématiques 2', 'Bases de Données', 'Réseaux Informatiques', 
               'Développement Web', 'Sécurité Informatique', 
               'Finance d''Entreprise', 'Mathématiques Financières')
AND school_id = '42f93ce5-9562-4825-a249-b780018834da';

-- 4. Supprimer les liaisons professeurs-classes
DELETE FROM teacher_classes 
WHERE teacher_id IN (
  SELECT id FROM teachers WHERE email LIKE '%@test.com'
);

-- 5. Supprimer les étudiants
DELETE FROM students 
WHERE cin_number LIKE 'TEST%';

-- 6. Supprimer les classes
DELETE FROM classes 
WHERE name IN ('1ère Année Licence Informatique', 
               '2ème Année Licence Informatique', 
               '3ème Année Licence Informatique', 
               '1ère Année Master Finance')
AND school_id = '42f93ce5-9562-4825-a249-b780018834da'
AND school_year_id = '3814d3a0-3546-4fce-92cb-3547d3dcee79';

-- 7. Supprimer les professeurs
DELETE FROM teachers 
WHERE email LIKE '%@test.com'
AND school_id = '42f93ce5-9562-4825-a249-b780018834da';
```

### ⚠️ Avertissements
- Ces commandes supprimeront **définitivement** toutes les données de test
- Assurez-vous d'exécuter les requêtes **dans l'ordre** pour respecter les contraintes de clés étrangères
- Faites une sauvegarde avant de supprimer si nécessaire

### 🔍 Vérification
Pour vérifier que toutes les données ont été supprimées :

```sql
-- Vérifier les professeurs
SELECT COUNT(*) as nb_professeurs FROM teachers WHERE email LIKE '%@test.com';

-- Vérifier les étudiants
SELECT COUNT(*) as nb_etudiants FROM students WHERE cin_number LIKE 'TEST%';

-- Vérifier les classes
SELECT COUNT(*) as nb_classes FROM classes 
WHERE name LIKE '%Licence Informatique%' OR name LIKE '%Master Finance%';

-- Vérifier les matières
SELECT COUNT(*) as nb_matieres FROM subjects 
WHERE school_id = '42f93ce5-9562-4825-a249-b780018834da'
AND created_at >= NOW() - INTERVAL '1 day';
```

Tous les compteurs devraient retourner **0** après la suppression.

---

## 📊 Statistiques

- **Total de données créées** : ~100+ enregistrements
- **Tables affectées** : 7 (teachers, classes, students, subjects, teacher_classes, class_subjects, student_school)
- **École** : ESTEM (42f93ce5-9562-4825-a249-b780018834da)
- **Année scolaire** : 2025-2026 (3814d3a0-3546-4fce-92cb-3547d3dcee79)
