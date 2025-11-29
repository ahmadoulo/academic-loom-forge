-- Supprimer la foreign key incorrecte et ajouter la bonne référence
ALTER TABLE grades 
DROP CONSTRAINT IF EXISTS grades_bonus_given_by_fkey;

-- Ajouter la référence correcte vers user_credentials
ALTER TABLE grades 
ADD CONSTRAINT grades_bonus_given_by_fkey 
FOREIGN KEY (bonus_given_by) REFERENCES user_credentials(id);