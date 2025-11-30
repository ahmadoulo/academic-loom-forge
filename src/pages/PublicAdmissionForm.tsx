import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAdmissions, type CreateAdmissionData } from '@/hooks/useAdmissions';
import { useCycles } from '@/hooks/useCycles';
import { useOptions } from '@/hooks/useOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  civility: z.enum(['M', 'Mme', 'Mlle']),
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  nationality: z.string().min(2, 'La nationalité est requise'),
  city: z.string().min(2, 'La ville est requise'),
  phone: z.string().min(10, 'Le téléphone doit contenir au moins 10 caractères'),
  email: z.string().email('Email invalide'),
  desired_cycle_id: z.string().min(1, 'La formation souhaitée est requise'),
  desired_option_id: z.string().optional(),
  education_level: z.string().min(2, 'Le niveau d\'études est requis'),
  last_institution: z.string().min(2, 'Le dernier établissement est requis'),
  last_institution_type: z.enum(['public', 'private', 'mission']),
});

type FormData = z.infer<typeof formSchema>;

export default function PublicAdmissionForm() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const { createAdmission } = useAdmissions();
  const { cycles } = useCycles(school?.id);
  const { options } = useOptions(school?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      civility: 'M',
      last_institution_type: 'public'
    }
  });

  const selectedCycleId = watch('desired_cycle_id');
  const filteredOptions = options.filter(opt => opt.cycle_id === selectedCycleId && opt.is_active);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('identifier', identifier)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setSchool(data);
      } catch (err: any) {
        console.error('Error fetching school:', err);
        toast.error('École introuvable');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      fetchSchool();
    }
  }, [identifier, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!school) return;

    setSubmitting(true);
    const admissionData: CreateAdmissionData = {
      school_id: school.id,
      civility: data.civility,
      firstname: data.firstname,
      lastname: data.lastname,
      nationality: data.nationality,
      city: data.city,
      phone: data.phone,
      email: data.email,
      desired_cycle_id: data.desired_cycle_id,
      desired_option_id: data.desired_option_id,
      education_level: data.education_level,
      last_institution: data.last_institution,
      last_institution_type: data.last_institution_type,
    };
    
    const success = await createAdmission(admissionData);

    setSubmitting(false);

    if (success) {
      toast.success('Votre demande a été envoyée avec succès! Nous vous recontacterons bientôt.');
      setTimeout(() => navigate('/'), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left side - School branding */}
            <div className="text-center lg:text-left space-y-6">
              {school.logo_url && (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-32 w-auto mx-auto lg:mx-0"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Ouvrez les portes des possibles
                </h1>
                <p className="text-xl text-muted-foreground">
                  Préinscription en ligne
                </p>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="bg-card rounded-lg shadow-xl p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Civilité */}
                <div className="space-y-2">
                  <Label>Civilité *</Label>
                  <RadioGroup
                    defaultValue="M"
                    onValueChange={(value) => setValue('civility', value as any)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="M" id="m" />
                      <Label htmlFor="m" className="font-normal cursor-pointer">M.</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Mme" id="mme" />
                      <Label htmlFor="mme" className="font-normal cursor-pointer">Mme</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Mlle" id="mlle" />
                      <Label htmlFor="mlle" className="font-normal cursor-pointer">Mlle</Label>
                    </div>
                  </RadioGroup>
                  {errors.civility && (
                    <p className="text-sm text-destructive">{errors.civility.message}</p>
                  )}
                </div>

                {/* Prénom & Nom */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">Prénom *</Label>
                    <Input id="firstname" {...register('firstname')} />
                    {errors.firstname && (
                      <p className="text-sm text-destructive">{errors.firstname.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Nom *</Label>
                    <Input id="lastname" {...register('lastname')} />
                    {errors.lastname && (
                      <p className="text-sm text-destructive">{errors.lastname.message}</p>
                    )}
                  </div>
                </div>

                {/* Nationalité & Ville */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationalité *</Label>
                    <Input id="nationality" {...register('nationality')} />
                    {errors.nationality && (
                      <p className="text-sm text-destructive">{errors.nationality.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input id="city" {...register('city')} />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" type="tel" {...register('phone')} />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                {/* Formation souhaitée */}
                <div className="space-y-2">
                  <Label htmlFor="desired_cycle_id">Formation souhaitée *</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue('desired_cycle_id', value);
                      setValue('desired_option_id', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.filter(c => c.is_active).map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.desired_cycle_id && (
                    <p className="text-sm text-destructive">{errors.desired_cycle_id.message}</p>
                  )}
                </div>

                {/* Option (si disponible) */}
                {selectedCycleId && filteredOptions.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="desired_option_id">Option / Spécialisation</Label>
                    <Select onValueChange={(value) => setValue('desired_option_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une option (optionnel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Niveau d'études */}
                <div className="space-y-2">
                  <Label htmlFor="education_level">Niveau d'études *</Label>
                  <Input id="education_level" {...register('education_level')} />
                  {errors.education_level && (
                    <p className="text-sm text-destructive">{errors.education_level.message}</p>
                  )}
                </div>

                {/* Dernier établissement */}
                <div className="space-y-2">
                  <Label htmlFor="last_institution">Dernier établissement *</Label>
                  <Input id="last_institution" {...register('last_institution')} />
                  {errors.last_institution && (
                    <p className="text-sm text-destructive">{errors.last_institution.message}</p>
                  )}
                </div>

                {/* Type du dernier établissement */}
                <div className="space-y-2">
                  <Label>Type du dernier établissement *</Label>
                  <RadioGroup
                    defaultValue="public"
                    onValueChange={(value) => setValue('last_institution_type', value as any)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="font-normal cursor-pointer">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">Privé</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mission" id="mission" />
                      <Label htmlFor="mission" className="font-normal cursor-pointer">Mission</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Privacy notice */}
                <p className="text-xs text-muted-foreground">
                  En soumettant ce formulaire, vous acceptez que vos données personnelles soient traitées 
                  dans le cadre de la gestion de votre demande d'admission.
                </p>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Préinscription en ligne'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
