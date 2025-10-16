import { useState } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Pin } from "lucide-react";
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

export function AnnouncementsSection() {
  const { user } = useCustomAuth();
  const { announcements, loading, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements(user?.school_id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  
  const isAdmin = user?.role === "school_admin" || user?.role === "admin_school" || user?.role === "global_admin" || user?.role === "admin";

  console.log("👤 AnnouncementsSection - User:", { role: user?.role, school_id: user?.school_id, isAdmin });
  console.log("📢 AnnouncementsSection - Annonces:", announcements.length);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    visibility: "all",
    pinned: false,
    starts_at: null as string | null,
    ends_at: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const announcementData = {
      ...formData,
      created_by: user?.id || null,
      class_id: null,
      school_id: user?.school_id || null,
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
        visibility: "all",
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">📢 Annonces</h2>
          <p className="text-muted-foreground mt-1">
            Toutes les annonces importantes
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer une annonce
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune annonce pour le moment
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={`hover:shadow-lg transition-shadow ${announcement.pinned ? 'border-primary' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {announcement.pinned && (
                        <Pin className="w-4 h-4 text-primary" />
                      )}
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      {format(new Date(announcement.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{announcement.visibility}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap mb-4">
                  {announcement.body}
                </p>

                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      className="flex-1"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Modifier l'annonce" : "Créer une annonce"}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'annonce
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="body">Contenu *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="visibility">Visibilité</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="students">Étudiants seulement</SelectItem>
                  <SelectItem value="teachers">Professeurs seulement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="pinned"
                checked={formData.pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked })}
              />
              <Label htmlFor="pinned" className="cursor-pointer">
                Épingler cette annonce
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingAnnouncement ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
