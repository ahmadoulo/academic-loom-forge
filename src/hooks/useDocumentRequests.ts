import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DocumentRequest {
  id: string;
  school_id: string;
  student_id: string;
  document_type: string;
  reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  students?: {
    firstname: string;
    lastname: string;
    email?: string;
  };
}

export interface DocumentRequestTracking {
  id: string;
  request_id: string;
  school_id: string;
  student_id: string;
  status: string;
  comment: string | null;
  updated_by: string | null;
  created_at: string;
}

export const useDocumentRequests = (schoolId?: string, studentId?: string) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [tracking, setTracking] = useState<DocumentRequestTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('document_requests')
        .select(`
          *,
          students (
            firstname,
            lastname,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching document requests:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_request_tracking')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTracking(data || []);
    } catch (err) {
      console.error('Error fetching tracking:', err);
    }
  };

  const createRequest = async (requestData: {
    school_id: string;
    student_id: string;
    document_type: string;
    reason?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('document_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      // Create initial tracking entry
      await supabase
        .from('document_request_tracking')
        .insert([{
          request_id: data.id,
          school_id: requestData.school_id,
          student_id: requestData.student_id,
          status: 'pending',
          comment: 'Demande créée',
        }]);

      toast({
        title: "Demande envoyée",
        description: "Votre demande a été soumise avec succès",
      });

      await fetchRequests();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating request:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande",
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    newStatus: string,
    comment?: string
  ) => {
    try {
      // Update request status
      const { error: updateError } = await supabase
        .from('document_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get request details for tracking
      const { data: request } = await supabase
        .from('document_requests')
        .select('school_id, student_id')
        .eq('id', requestId)
        .single();

      if (request) {
        // Add tracking entry
        await supabase
          .from('document_request_tracking')
          .insert([{
            request_id: requestId,
            school_id: request.school_id,
            student_id: request.student_id,
            status: newStatus,
            comment: comment || `Statut changé à ${newStatus}`,
          }]);
      }

      toast({
        title: "Statut mis à jour",
        description: "Le statut de la demande a été modifié",
      });

      await fetchRequests();
      return { error: null };
    } catch (err) {
      console.error('Error updating request status:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      return { error: err };
    }
  };

  useEffect(() => {
    fetchRequests();

    // Setup realtime subscription
    const channel = supabase
      .channel('document-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, studentId]);

  return {
    requests,
    tracking,
    loading,
    createRequest,
    updateRequestStatus,
    fetchTracking,
    refetch: fetchRequests
  };
};
