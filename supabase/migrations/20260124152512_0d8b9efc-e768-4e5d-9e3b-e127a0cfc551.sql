-- Create trigger function to auto-fill school_id from class
CREATE OR REPLACE FUNCTION public.set_attendance_school_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.school_id IS NULL AND NEW.class_id IS NOT NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.classes WHERE id = NEW.class_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-fill school_id
DROP TRIGGER IF EXISTS trigger_set_attendance_school_id ON public.attendance;
CREATE TRIGGER trigger_set_attendance_school_id
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_attendance_school_id();