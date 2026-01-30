import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MFASettingsProps {
  userId: string;
  userEmail: string;
}

export function MFASettings({ userId, userEmail }: MFASettingsProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  useEffect(() => {
    fetchMFAStatus();
  }, [userId]);

  const fetchMFAStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("mfa_enabled")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setMfaEnabled(data?.mfa_enabled || false);
    } catch (err) {
      // Silent error - default to false
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!enabled && mfaEnabled) {
      setShowDisableDialog(true);
      return;
    }

    await toggleMFA(enabled);
  };

  const toggleMFA = async (enabled: boolean) => {
    setToggling(true);

    try {
      const sessionToken = localStorage.getItem("app_session_token") || localStorage.getItem("sessionToken");

      if (!sessionToken) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("toggle-mfa", {
        body: {
          sessionToken,
          enabled,
          mfaType: "email",
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMfaEnabled(enabled);
      toast.success(data.message);
    } catch (err) {
      toast.error("Erreur lors de la modification des paramètres MFA");
    } finally {
      setToggling(false);
      setShowDisableDialog(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Authentification à deux facteurs</CardTitle>
                <CardDescription>
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </CardDescription>
              </div>
            </div>
            <Badge variant={mfaEnabled ? "default" : "secondary"} className="ml-4">
              {mfaEnabled ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Activé
                </>
              ) : (
                "Désactivé"
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Vérification par email</p>
                <p className="text-sm text-muted-foreground">
                  Recevez un code de vérification à chaque connexion
                </p>
              </div>
            </div>
            <Switch
              checked={mfaEnabled}
              onCheckedChange={handleToggle}
              disabled={toggling}
            />
          </div>

          {mfaEnabled && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Votre compte est protégé
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Un code sera envoyé à <strong>{userEmail}</strong> à chaque connexion.
                </p>
              </div>
            </div>
          )}

          {!mfaEnabled && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Sécurité recommandée
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  L'authentification à deux facteurs protège votre compte même si votre mot de passe est compromis.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l'authentification à deux facteurs ?</AlertDialogTitle>
            <AlertDialogDescription>
              La désactivation de la 2FA réduit la sécurité de votre compte. Êtes-vous sûr de vouloir continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleMFA(false)}
              disabled={toggling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
