import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Array<{ id: string; firstname: string; lastname: string; email?: string | null; name?: string }>;
  type: "student" | "teacher" | "parent";
  schoolId: string;
}

export function NotificationDialog({
  open,
  onOpenChange,
  recipients,
  type,
  schoolId,
}: NotificationDialogProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir l'objet et le message");
      return;
    }

    const validRecipients = recipients.filter(r => r.email);
    if (validRecipients.length === 0) {
      toast.error("Aucun destinataire avec une adresse email valide");
      return;
    }

    setSending(true);
    try {
      // Get current user for sent_by
      const { data: { user } } = await supabase.auth.getUser();

      const recipientsList = validRecipients.map(r => ({
        email: r.email!,
        name: r.name || `${r.firstname} ${r.lastname}`
      }));

      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: {
          recipients: recipientsList,
          subject: subject.trim(),
          message: message.trim(),
          schoolId: schoolId,
          recipientType: type,
          sentBy: user?.id || null
        },
      });

      if (error) throw error;

      toast.success(`Notification envoyée à ${data.sent} destinataire(s)`);
      setSubject("");
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Erreur lors de l'envoi de la notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Envoyer une notification</DialogTitle>
          <DialogDescription>
            Notification sera envoyée à {recipients.length}{" "}
            {type === "student" ? "étudiant(s)" : type === "teacher" ? "professeur(s)" : "parent(s)"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              placeholder="Objet de la notification"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Contenu du message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Destinataires:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {recipients.map((recipient) => (
                <p key={recipient.id} className="text-sm">
                  {recipient.firstname} {recipient.lastname}
                  {recipient.email && (
                    <span className="text-muted-foreground ml-2">({recipient.email})</span>
                  )}
                  {!recipient.email && (
                    <span className="text-destructive ml-2 text-xs">(Pas d'email)</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
