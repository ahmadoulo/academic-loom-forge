import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeeConfig {
  id: string;
  school_id: string;
  name: string;
  amount_default: number;
  frequency: 'monthly' | 'yearly' | 'once';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolFee {
  id: string;
  student_id: string;
  school_id: string;
  fee_config_id: string;
  label: string;
  due_month: string;
  amount_due: number;
  amount_paid: number;
  status: 'pending' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
  students?: {
    firstname: string;
    lastname: string;
    cin_number: string;
  };
  school_fee_config?: {
    name: string;
    frequency: string;
  };
}

export interface Payment {
  id: string;
  student_id: string;
  school_id: string;
  fee_id: string;
  amount_paid: number;
  payment_date: string;
  method: 'cash' | 'cheque' | 'bank' | 'other';
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export const useFinance = (schoolId?: string) => {
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [schoolFees, setSchoolFees] = useState<SchoolFee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fee configurations
  const fetchFeeConfigs = async () => {
    if (!schoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('school_fee_config')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeConfigs((data || []) as FeeConfig[]);
    } catch (error) {
      console.error('Error fetching fee configs:', error);
      toast.error('Erreur lors du chargement des configurations');
    }
  };

  // Fetch school fees
  const fetchSchoolFees = async () => {
    if (!schoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('school_fees')
        .select(`
          *,
          students(firstname, lastname, cin_number),
          school_fee_config:fee_config_id(name, frequency)
        `)
        .eq('school_id', schoolId)
        .order('due_month', { ascending: false });

      if (error) throw error;
      setSchoolFees((data || []) as SchoolFee[]);
    } catch (error) {
      console.error('Error fetching school fees:', error);
      toast.error('Erreur lors du chargement des frais');
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    if (!schoolId) return;
    
    try {
      const { data, error } = await supabase
        .from('school_payments')
        .select('*')
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Erreur lors du chargement des paiements');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFeeConfigs(),
        fetchSchoolFees(),
        fetchPayments()
      ]);
      setLoading(false);
    };

    loadData();
  }, [schoolId]);

  // Create fee config
  const createFeeConfig = async (config: Omit<FeeConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('school_fee_config')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Type de frais créé avec succès');
      await fetchFeeConfigs();
      return data;
    } catch (error) {
      console.error('Error creating fee config:', error);
      toast.error('Erreur lors de la création du type de frais');
      throw error;
    }
  };

  // Update fee config
  const updateFeeConfig = async (id: string, updates: Partial<FeeConfig>) => {
    try {
      const { error } = await supabase
        .from('school_fee_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Type de frais mis à jour');
      await fetchFeeConfigs();
    } catch (error) {
      console.error('Error updating fee config:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    }
  };

  // Delete fee config
  const deleteFeeConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('school_fee_config')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Type de frais supprimé');
      await fetchFeeConfigs();
    } catch (error) {
      console.error('Error deleting fee config:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  };

  // Generate monthly fees for all students
  const generateMonthlyFees = async (month: string) => {
    if (!schoolId) return;

    try {
      // Get all active students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('archived', false);

      if (studentsError) throw studentsError;

      // Get monthly fee configs
      const monthlyConfigs = feeConfigs.filter(c => c.frequency === 'monthly');

      const feesToCreate = [];
      for (const student of students || []) {
        for (const config of monthlyConfigs) {
          // Check if fee already exists
          const { data: existing } = await supabase
            .from('school_fees')
            .select('id')
            .eq('student_id', student.id)
            .eq('fee_config_id', config.id)
            .eq('due_month', month)
            .single();

          if (!existing) {
            feesToCreate.push({
              student_id: student.id,
              school_id: schoolId,
              fee_config_id: config.id,
              label: `${config.name} ${month}`,
              due_month: month,
              amount_due: config.amount_default,
              amount_paid: 0,
              status: 'pending' as const
            });
          }
        }
      }

      if (feesToCreate.length > 0) {
        const { error } = await supabase
          .from('school_fees')
          .insert(feesToCreate);

        if (error) throw error;
        
        toast.success(`${feesToCreate.length} frais générés avec succès`);
        await fetchSchoolFees();
      } else {
        toast.info('Tous les frais existent déjà pour ce mois');
      }
    } catch (error) {
      console.error('Error generating fees:', error);
      toast.error('Erreur lors de la génération des frais');
      throw error;
    }
  };

  // Record payment
  const recordPayment = async (payment: Omit<Payment, 'id' | 'created_at'>) => {
    try {
      // Insert payment
      const { error: paymentError } = await supabase
        .from('school_payments')
        .insert(payment);

      if (paymentError) throw paymentError;

      // Update fee status and amount
      const { data: fee, error: feeError } = await supabase
        .from('school_fees')
        .select('amount_due, amount_paid')
        .eq('id', payment.fee_id)
        .single();

      if (feeError) throw feeError;

      const newAmountPaid = (fee.amount_paid || 0) + payment.amount_paid;
      const newStatus = newAmountPaid >= fee.amount_due ? 'paid' : 
                       newAmountPaid > 0 ? 'partial' : 'pending';

      const { error: updateError } = await supabase
        .from('school_fees')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus
        })
        .eq('id', payment.fee_id);

      if (updateError) throw updateError;

      toast.success('Paiement enregistré avec succès');
      await Promise.all([fetchSchoolFees(), fetchPayments()]);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
      throw error;
    }
  };

  // Get financial summary
  const getFinancialSummary = () => {
    const totalDue = schoolFees.reduce((sum, fee) => sum + Number(fee.amount_due), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount_paid), 0);
    const totalRemaining = totalDue - totalPaid;
    const pendingCount = schoolFees.filter(f => f.status === 'pending').length;

    return {
      totalDue,
      totalPaid,
      totalRemaining,
      pendingCount
    };
  };

  return {
    feeConfigs,
    schoolFees,
    payments,
    loading,
    createFeeConfig,
    updateFeeConfig,
    deleteFeeConfig,
    generateMonthlyFees,
    recordPayment,
    getFinancialSummary,
    refetch: async () => {
      await Promise.all([
        fetchFeeConfigs(),
        fetchSchoolFees(),
        fetchPayments()
      ]);
    }
  };
};
