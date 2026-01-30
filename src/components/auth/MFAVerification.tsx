import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Mail, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MFAVerificationProps {
  userId: string;
  pendingSessionToken: string;
  userEmail: string;
  onSuccess: (authData: any) => void;
  onCancel: () => void;
}

export function MFAVerification({
  userId,
  pendingSessionToken,
  userEmail,
  onSuccess,
  onCancel,
}: MFAVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Veuillez entrer le code complet");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-mfa-code", {
        body: {
          userId,
          code,
          pendingSessionToken,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setCode("");
        return;
      }

      if (data.success) {
        toast.success("Connexion réussie !");
        onSuccess(data);
      }
    } catch (err) {
      toast.error("Erreur lors de la vérification du code");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);

    try {
      const { data, error } = await supabase.functions.invoke("resend-mfa-code", {
        body: {
          userId,
          pendingSessionToken,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Un nouveau code a été envoyé");
      setCountdown(60);
      setCode("");
    } catch (err) {
      toast.error("Erreur lors de l'envoi du code");
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify();
    }
  }, [code]);

  // Mask email for display
  const maskedEmail = userEmail.replace(
    /(.{2})(.*)(@.*)/,
    (_, start, middle, end) => start + "*".repeat(Math.min(middle.length, 5)) + end
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-0 shadow-xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-4 p-4 rounded-full bg-primary/10"
          >
            <Shield className="h-8 w-8 text-primary" />
          </motion.div>
          <CardTitle className="text-2xl font-bold">Vérification en deux étapes</CardTitle>
          <CardDescription className="text-base">
            Un code de vérification a été envoyé à
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="font-medium">{maskedEmail}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Entrez le code à 6 chiffres pour continuer
            </p>

            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-12 text-xl font-semibold" />
                <InputOTPSlot index={1} className="h-14 w-12 text-xl font-semibold" />
                <InputOTPSlot index={2} className="h-14 w-12 text-xl font-semibold" />
                <InputOTPSlot index={3} className="h-14 w-12 text-xl font-semibold" />
                <InputOTPSlot index={4} className="h-14 w-12 text-xl font-semibold" />
                <InputOTPSlot index={5} className="h-14 w-12 text-xl font-semibold" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            className="w-full h-12 text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </Button>

          <div className="flex flex-col items-center space-y-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="text-muted-foreground hover:text-foreground"
            >
              {resending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : "Renvoyer le code"}
            </Button>

            <Button
              variant="link"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Le code expire dans 10 minutes. Vérifiez votre dossier spam si vous ne le recevez pas.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
