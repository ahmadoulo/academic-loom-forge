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
import { useFinance, SchoolFee } from '@/hooks/useFinance';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  amount_paid: z.string().min(1, 'Le montant est requis'),
  payment_date: z.string().min(1, 'La date est requise'),
  method: z.enum(['cash', 'cheque', 'bank', 'other']),
  notes: z.string().optional(),
});

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  fee: SchoolFee | null;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  schoolId,
  fee,
}: PaymentDialogProps) => {
  const { recordPayment } = useFinance(schoolId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount_paid: '',
      payment_date: new Date().toISOString().split('T')[0],
      method: 'cash',
      notes: '',
    },
  });

  useEffect(() => {
    if (fee && open) {
      const remaining = Number(fee.amount_due) - Number(fee.amount_paid);
      form.reset({
        amount_paid: remaining > 0 ? remaining.toString() : '',
        payment_date: new Date().toISOString().split('T')[0],
        method: 'cash',
        notes: '',
      });
    }
  }, [fee, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!fee) return;

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      await recordPayment({
        student_id: fee.student_id,
        school_id: schoolId,
        fee_id: fee.id,
        amount_paid: parseFloat(values.amount_paid),
        payment_date: new Date(values.payment_date).toISOString(),
        method: values.method,
        notes: values.notes,
        recorded_by: userData.id,
      });
      
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  if (!fee) return null;

  const remaining = Number(fee.amount_due) - Number(fee.amount_paid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer un Paiement</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4 border-y">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Élève:</span>
            <span className="font-medium">
              {fee.students?.firstname} {fee.students?.lastname}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type de frais:</span>
            <span className="font-medium">{fee.school_fee_config?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mois:</span>
            <span className="font-medium">{fee.due_month}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Montant total:</span>
            <span className="font-medium">{Number(fee.amount_due).toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Déjà payé:</span>
            <span className="font-medium text-green-600">
              {Number(fee.amount_paid).toFixed(2)} MAD
            </span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t">
            <span>Reste à payer:</span>
            <span className="text-orange-600">{remaining.toFixed(2)} MAD</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount_paid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant payé (MAD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de paiement</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Méthode de paiement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une méthode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                      <SelectItem value="bank">Virement bancaire</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes supplémentaires..."
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
                Enregistrer le paiement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
