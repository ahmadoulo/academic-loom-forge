-- D'abord nettoyer les owner_id invalides
UPDATE schools SET owner_id = NULL WHERE owner_id IS NOT NULL;

-- Ajouter la foreign key entre grades.bonus_given_by et app_users
ALTER TABLE grades 
DROP CONSTRAINT IF EXISTS grades_bonus_given_by_fkey;

ALTER TABLE grades 
ADD CONSTRAINT grades_bonus_given_by_fkey 
FOREIGN KEY (bonus_given_by) REFERENCES app_users(id) ON DELETE SET NULL;

-- Ajouter la foreign key entre schools.owner_id et app_users
ALTER TABLE schools 
DROP CONSTRAINT IF EXISTS schools_owner_id_fkey;

ALTER TABLE schools 
ADD CONSTRAINT schools_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE SET NULL;

-- Ajouter la foreign key entre school_textbook_notes.created_by et app_users
ALTER TABLE school_textbook_notes 
DROP CONSTRAINT IF EXISTS school_textbook_notes_created_by_fkey;

ALTER TABLE school_textbook_notes 
ADD CONSTRAINT school_textbook_notes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE SET NULL;