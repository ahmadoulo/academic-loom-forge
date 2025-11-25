-- Créer l'enum pour les types de plans d'abonnement
CREATE TYPE subscription_plan_type AS ENUM ('basic', 'standard', 'premium');

-- Créer l'enum pour les durées d'abonnement
CREATE TYPE subscription_duration_type AS ENUM ('1_month', '3_months', '6_months', '1_year', '2_years');

-- Créer l'enum pour les statuts d'abonnement
CREATE TYPE subscription_status_type AS ENUM ('trial', 'active', 'expired', 'cancelled');

-- Créer l'enum pour les méthodes de paiement
CREATE TYPE payment_method_type AS ENUM ('cash', 'bank_transfer', 'check', 'card', 'other');

-- Table des plans d'abonnement
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type subscription_plan_type NOT NULL,
  description TEXT,
  features TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  plan_type subscription_plan_type NOT NULL,
  status subscription_status_type NOT NULL DEFAULT 'trial',
  duration subscription_duration_type NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT NOT NULL DEFAULT 'MAD',
  payment_method payment_method_type,
  transaction_id TEXT,
  notes TEXT,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_end_date DATE,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_subscriptions_school_id ON subscriptions(school_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_is_trial ON subscriptions(is_trial);

-- Activer RLS sur les nouvelles tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour subscription_plans
CREATE POLICY "Anyone can view active plans"
ON subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON subscription_plans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'global_admin'
  )
);

-- Policies pour subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'global_admin'
  )
);

CREATE POLICY "Admins can create subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'global_admin'
  )
);

CREATE POLICY "Admins can update subscriptions"
ON subscriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'global_admin'
  )
);

CREATE POLICY "School admins can view their school subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.school_id = subscriptions.school_id
    AND profiles.role = 'school_admin'
  )
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer les plans par défaut
INSERT INTO subscription_plans (name, type, description, features) VALUES
  ('Basic', 'basic', 'Plan de base pour petites écoles', ARRAY['Jusqu''à 100 étudiants', 'Gestion de base', 'Support par email']),
  ('Standard', 'standard', 'Plan standard pour écoles moyennes', ARRAY['Jusqu''à 500 étudiants', 'Toutes les fonctionnalités de base', 'Support prioritaire', 'Rapports avancés']),
  ('Premium', 'premium', 'Plan premium pour grandes écoles', ARRAY['Étudiants illimités', 'Toutes les fonctionnalités', 'Support 24/7', 'API personnalisée', 'Formation dédiée']);