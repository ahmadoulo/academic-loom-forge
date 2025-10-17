import { useState } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Pin, Megaphone, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AnnouncementsSectionProps {
  schoolId: string;
  isAdmin?: boolean;
  userRole?: string;
}

export function AnnouncementsSection({ schoolId, isAdmin = false, userRole }: AnnouncementsSectionProps) {
  const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements(schoolId, userRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    visibility: "tous",
    pinned: false,
    starts_at: null as string | null,
    ends_at: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const announcementData = {
      ...formData,
      created_by: null,
      class_id: null,
      school_id: schoolId,
    };

    const success = editingAnnouncement
      ? await updateAnnouncement(editingAnnouncement.id, announcementData)
      : await createAnnouncement(announcementData);

    if (success) {
      setIsModalOpen(false);
      setEditingAnnouncement(null);
      setFormData({
        title: "",
        body: "",
        visibility: "tous",
        pinned: false,
        starts_at: null,
        ends_at: null,
      });
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      visibility: announcement.visibility,
      pinned: announcement.pinned,
      starts_at: announcement.starts_at,
      ends_at: announcement.ends_at,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      await deleteAnnouncement(id);
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'professeurs':
      case 'teachers':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'etudiants':
      case 'students':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'professeurs':
      case 'teachers':
        return 'Professeurs';
      case 'etudiants':
      case 'students':
        return 'Étudiants';
      default:
        return 'Tous';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800">
              <Megaphone className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Annonces</h2>
          </div>
          <p className="text-muted-foreground ml-[52px]">
            Restez informé des actualités importantes
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2 shadow-md">
            <Plus className="w-4 h-4" />
            Nouvelle annonce
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Megaphone className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Aucune annonce</h3>
                <p className="text-muted-foreground max-w-md">
                  {isAdmin 
                    ? "Commencez par créer votre première annonce pour informer votre communauté."
                    : "Aucune annonce n'a été publiée pour le moment. Revenez plus tard !"}
                </p>
              </div>
              {isAdmin && (
                <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une annonce
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`group hover:shadow-xl transition-all duration-300 ${
                announcement.pinned 
                  ? 'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 dark:from-orange-950/20 to-transparent' 
                  : 'hover:border-primary/50'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      {announcement.pinned && (
                        <Pin className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                      )}
                      <CardTitle className="text-2xl font-bold leading-tight">
                        {announcement.title}
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground ml-8">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(announcement.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </div>
                      <Badge variant="outline" className={getVisibilityColor(announcement.visibility)}>
                        <Eye className="w-3 h-3 mr-1" />
                        {getVisibilityLabel(announcement.visibility)}
                      </Badge>
                      {announcement.pinned && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                          Épinglée
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed pl-8">
                  {announcement.body}
                </p>

                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t pl-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      className="flex-1 group-hover:border-primary/50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingAnnouncement ? "Modifier l'annonce" : "Créer une annonce"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre annonce
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Fermeture exceptionnelle"
                className="text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body" className="text-base font-semibold">Contenu *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Rédigez votre annonce..."
                rows={8}
                className="text-base resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-base font-semibold">Visibilité</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Tous (professeurs et étudiants)
                    </div>
                  </SelectItem>
                  <SelectItem value="etudiants">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Étudiants uniquement
                    </div>
                  </SelectItem>
                  <SelectItem value="professeurs">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Professeurs uniquement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Switch
                id="pinned"
                checked={formData.pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked })}
              />
              <div className="flex-1">
                <Label htmlFor="pinned" className="cursor-pointer text-base font-medium">
                  Épingler cette annonce
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Les annonces épinglées s'affichent en haut de la liste
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                size="lg"
              >
                Annuler
              </Button>
              <Button type="submit" size="lg">
                {editingAnnouncement ? "Mettre à jour" : "Publier l'annonce"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
