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
import { AttachmentUploader } from "./AttachmentUploader";
import { AttachmentDisplay } from "./AttachmentDisplay";

interface AnnouncementsSectionProps {
  schoolId: string;
  isAdmin?: boolean;
  userRole?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AnnouncementsSection({ 
  schoolId, 
  isAdmin = false, 
  userRole,
  canCreate = isAdmin,
  canEdit = isAdmin,
  canDelete = isAdmin
}: AnnouncementsSectionProps) {
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
    links: [] as string[],
    attachments: [] as string[],
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
        links: [],
        attachments: [],
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
      links: announcement.links || [],
      attachments: announcement.attachments || [],
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
        
        {canCreate && (
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
                {canCreate 
                  ? "Commencez par créer votre première annonce pour informer votre communauté."
                  : "Aucune annonce n'a été publiée pour le moment. Revenez plus tard !"}
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Créer une annonce
              </Button>
            )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => {
            const hasImages = announcement.attachments?.some((a: string) => 
              ["jpg", "jpeg", "png", "gif", "webp"].includes(a.split(".").pop()?.toLowerCase() || "")
            );
            
            return (
              <Card 
                key={announcement.id} 
                className={`group hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${
                  announcement.pinned 
                    ? 'ring-2 ring-orange-500/50 bg-gradient-to-br from-orange-50/30 dark:from-orange-950/20' 
                    : 'hover:border-primary/50'
                }`}
              >
                {/* Featured Image */}
                {hasImages && (
                  <div className="relative">
                    <AttachmentDisplay 
                      links={[]} 
                      attachments={announcement.attachments?.filter((a: string) => 
                        ["jpg", "jpeg", "png", "gif", "webp"].includes(a.split(".").pop()?.toLowerCase() || "")
                      ) || []} 
                    />
                  </div>
                )}
                
                <CardHeader className="pb-2 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {announcement.pinned && (
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                        <Pin className="w-3 h-3" />
                        Épinglée
                      </Badge>
                    )}
                    <Badge variant="outline" className={getVisibilityColor(announcement.visibility)}>
                      <Eye className="w-3 h-3 mr-1" />
                      {getVisibilityLabel(announcement.visibility)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                    {announcement.title}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(announcement.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col pt-0">
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 flex-1">
                    {announcement.body}
                  </p>

                  {/* Links & Documents (not images) */}
                  {(announcement.links?.length > 0 || announcement.attachments?.some((a: string) => 
                    !["jpg", "jpeg", "png", "gif", "webp"].includes(a.split(".").pop()?.toLowerCase() || "")
                  )) && (
                    <div className="mt-3">
                      <AttachmentDisplay 
                        links={announcement.links || []} 
                        attachments={announcement.attachments?.filter((a: string) => 
                          !["jpg", "jpeg", "png", "gif", "webp"].includes(a.split(".").pop()?.toLowerCase() || "")
                        ) || []} 
                      />
                    </div>
                  )}

                  {(canEdit || canDelete) && (
                    <div className="flex gap-2 pt-4 mt-4 border-t">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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

            {/* Attachments Section */}
            <div className="pt-4 border-t">
              <AttachmentUploader
                type="annonces"
                schoolId={schoolId}
                links={formData.links}
                attachments={formData.attachments}
                onLinksChange={(links) => setFormData({ ...formData, links })}
                onAttachmentsChange={(attachments) => setFormData({ ...formData, attachments })}
              />
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