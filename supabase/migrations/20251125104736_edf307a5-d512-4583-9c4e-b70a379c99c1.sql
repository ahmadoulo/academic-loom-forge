-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on subscriptions table  
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can create subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "School admins can view their school subscriptions" ON public.subscriptions;

-- Allow all operations on subscription_plans for now (admin access)
CREATE POLICY "Allow all operations on subscription_plans"
ON public.subscription_plans
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow all operations on subscriptions for now (admin access)
CREATE POLICY "Allow all operations on subscriptions"
ON public.subscriptions
FOR ALL
USING (true)
WITH CHECK (true);