import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFinance, FeeConfig } from '@/hooks/useFinance';

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  amount_default: z.string().min(1, 'Le montant est requis'),
  frequency: z.enum(['monthly', 'yearly', 'once']),
  description: z.string().optional(),
});

interface FeeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  editingConfig?: FeeConfig;
}

export const FeeConfigDialog = ({
  open,
  onOpenChange,
  schoolId,
  editingConfig,
}: FeeConfigDialogProps) => {
  const { createFeeConfig, updateFeeConfig } = useFinance(schoolId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount_default: '',
      frequency: 'monthly',
      description: '',
    },
  });

  useEffect(() => {
    if (editingConfig) {
      form.reset({
        name: editingConfig.name,
        amount_default: editingConfig.amount_default.toString(),
        frequency: editingConfig.frequency,
        description: editingConfig.description || '',
      });
    } else {
      form.reset({
        name: '',
        amount_default: '',
        frequency: 'monthly',
        description: '',
      });
    }
  }, [editingConfig, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingConfig) {
        await updateFeeConfig(editingConfig.id, {
          name: values.name,
          amount_default: parseFloat(values.amount_default),
          frequency: values.frequency,
          description: values.description,
        });
      } else {
        await createFeeConfig({
          school_id: schoolId,
          name: values.name,
          amount_default: parseFloat(values.amount_default),
          frequency: values.frequency,
          description: values.description,
          is_active: true,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving fee config:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingConfig ? 'Modifier le type de frais' : 'Nouveau type de frais'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du frais</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Scolarité, Transport..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount_default"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant par défaut (MAD)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fréquence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fréquence" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
                      <SelectItem value="once">Ponctuel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails supplémentaires..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingConfig ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
