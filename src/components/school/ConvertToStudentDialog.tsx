import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/useClasses';
import { useSchoolYears } from '@/hooks/useSchoolYears';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ConvertToStudentDialogProps {
  admission: any;
  schoolId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertToStudentDialog({ admission, schoolId, open, onOpenChange }: ConvertToStudentDialogProps) {
  const { classes } = useClasses(schoolId);
  const { schoolYears } = useSchoolYears();
  const currentYear = schoolYears.find(y => y.is_current);
  const [converting, setConverting] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [classId, setClassId] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');

  // Filtrer les classes de l'année en cours uniquement
  const currentYearClasses = classes.filter(
    (c: any) => !c.archived && c.school_year_id === currentYear?.id
  );

  const handleConvert = async () => {
    if (!birthDate || !classId || !cinNumber) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!currentYear) {
      toast.error('Aucune année scolaire active');
      return;
    }

    setConverting(true);

    try {
      // 1. Create student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert([{
          firstname: admission.firstname,
          lastname: admission.lastname,
          email: admission.email,
          cin_number: cinNumber,
          birth_date: birthDate,
          student_phone: admission.phone,
          tutor_name: tutorName || null,
          parent_phone: tutorPhone || null,
          tutor_email: tutorEmail || null,
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Create student_school relationship
      const { error: studentSchoolError } = await supabase
        .from('student_school')
        .insert([{
          student_id: student.id,
          school_id: schoolId,
          school_year_id: currentYear.id,
          class_id: classId,
          is_active: true,
        }]);

      if (studentSchoolError) throw studentSchoolError;

      // 3. Update admission status
      const { error: admissionError } = await supabase
        .from('school_admission')
        .update({
          converted_to_student_id: student.id,
          converted_at: new Date().toISOString(),
          status: 'traite'
        })
        .eq('id', admission.id);

      if (admissionError) throw admissionError;

      toast.success('Candidat converti en étudiant avec succès');
      onOpenChange(false);
      
      // Reset form
      setBirthDate('');
      setClassId('');
      setCinNumber('');
      setTutorName('');
      setTutorPhone('');
      setTutorEmail('');
    } catch (error: any) {
      console.error('Error converting admission:', error);
      toast.error('Erreur lors de la conversion: ' + error.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir en étudiant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input
              value={`${admission.firstname} ${admission.lastname}`}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cin">Numéro CIN/CNE *</Label>
            <Input
              id="cin"
              value={cinNumber}
              onChange={(e) => setCinNumber(e.target.value)}
              placeholder="Ex: AB123456"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance *</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Classe *</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une classe" />
              </SelectTrigger>
              <SelectContent>
                {currentYearClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={admission.email} disabled />
          </div>

          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={admission.phone} disabled />
          </div>

          <div className="space-y-2">
            <Label>Nom du tuteur</Label>
            <Input
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              placeholder="Nom complet du tuteur (optionnel)"
            />
          </div>

          <div className="space-y-2">
            <Label>Téléphone du tuteur</Label>
            <Input
              value={tutorPhone}
              onChange={(e) => setTutorPhone(e.target.value)}
              placeholder="Numéro de téléphone du tuteur (optionnel)"
            />
          </div>

          <div className="space-y-2">
            <Label>Email du tuteur</Label>
            <Input
              type="email"
              value={tutorEmail}
              onChange={(e) => setTutorEmail(e.target.value)}
              placeholder="Email du tuteur (optionnel)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conversion...
              </>
            ) : (
              'Convertir en étudiant'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
