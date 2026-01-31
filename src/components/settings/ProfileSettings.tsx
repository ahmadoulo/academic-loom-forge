import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, Save, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MFASettings } from "./MFASettings";

export function ProfileSettings() {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: "",
  });

  const handleSave = async () => {
    // TODO: Implement profile update
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
    });
    setIsEditing(false);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      global_admin: { label: "Admin Global", className: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
      school_admin: { label: "Admin École", className: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" },
      teacher: { label: "Professeur", className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white" },
      student: { label: "Étudiant", className: "bg-gradient-to-r from-orange-500 to-red-500 text-white" },
      parent: { label: "Parent", className: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Informations personnelles</h2>
        <p className="text-muted-foreground">
          Gérez vos informations de profil et vos préférences personnelles.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Photo de profil</CardTitle>
            <CardDescription>
              Mettez à jour votre photo de profil
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user?.avatar_url || ""} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Changer la photo
            </Button>
            {primaryRole && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Rôle actuel</p>
                {getRoleBadge(primaryRole)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de contact
              </CardDescription>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              ) : (
                "Modifier"
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biographie</Label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md resize-none"
                rows={3}
                placeholder="Quelques mots sur vous..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFA Settings */}
      {user?.id && user?.email && (
        <MFASettings userId={user.id} userEmail={user.email} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Zone de danger</CardTitle>
          <CardDescription>
            Actions irréversibles concernant votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">
            Supprimer le compte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}