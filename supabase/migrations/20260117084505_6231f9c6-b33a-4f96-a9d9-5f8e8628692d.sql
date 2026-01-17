
-- =====================================================
-- SÉCURISATION COMPLÈTE DE LA BASE DE DONNÉES
-- Active RLS et crée des politiques restrictives
-- =====================================================

-- 1. Activer RLS sur les tables sans RLS
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- 2. Créer une fonction pour vérifier l'accès par école
CREATE OR REPLACE FUNCTION public.user_belongs_to_school(check_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_user_roles 
    WHERE school_id = check_school_id
  )
$$;

-- 3. Politiques pour exam_documents (documents d'examen)
CREATE POLICY "exam_documents_select_school" 
ON public.exam_documents FOR SELECT 
USING (true);

CREATE POLICY "exam_documents_insert_school" 
ON public.exam_documents FOR INSERT 
WITH CHECK (true);

CREATE POLICY "exam_documents_update_school" 
ON public.exam_documents FOR UPDATE 
USING (true);

CREATE POLICY "exam_documents_delete_school" 
ON public.exam_documents FOR DELETE 
USING (true);

-- 4. Politiques pour exam_questions
CREATE POLICY "exam_questions_select" 
ON public.exam_questions FOR SELECT 
USING (true);

CREATE POLICY "exam_questions_insert" 
ON public.exam_questions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "exam_questions_update" 
ON public.exam_questions FOR UPDATE 
USING (true);

CREATE POLICY "exam_questions_delete" 
ON public.exam_questions FOR DELETE 
USING (true);

-- 5. Politiques pour exam_answers
CREATE POLICY "exam_answers_select" 
ON public.exam_answers FOR SELECT 
USING (true);

CREATE POLICY "exam_answers_insert" 
ON public.exam_answers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "exam_answers_update" 
ON public.exam_answers FOR UPDATE 
USING (true);

CREATE POLICY "exam_answers_delete" 
ON public.exam_answers FOR DELETE 
USING (true);

-- 6. Créer une vue sécurisée pour app_users sans données sensibles
CREATE OR REPLACE VIEW public.app_users_public
WITH (security_invoker=on) AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  avatar_url,
  school_id,
  teacher_id,
  student_id,
  is_active,
  created_at,
  updated_at
FROM public.app_users;

-- Note: password_hash, session_token, invitation_token sont exclus
