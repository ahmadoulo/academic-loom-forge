import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Video, 
  Plus, 
  Search, 
  MapPin, 
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  VideoOff,
  Camera
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useSchoolCameras, SchoolCamera } from "@/hooks/useSchoolCameras";
import { CameraFormDialog, CameraFormData } from "./CameraFormDialog";
import { CameraViewDialog } from "./CameraViewDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface CamerasSectionProps {
  schoolId: string;
}

export function CamerasSection({ schoolId }: CamerasSectionProps) {
  const { cameras, isLoading, createCamera, updateCamera, deleteCamera } = useSchoolCameras(schoolId);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCamera, setEditingCamera] = useState<SchoolCamera | null>(null);
  const [viewingCamera, setViewingCamera] = useState<SchoolCamera | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<SchoolCamera | null>(null);

  const filteredCameras = cameras.filter((camera) =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCameras = cameras.filter((c) => c.is_active).length;

  const handleCreateCamera = (data: CameraFormData) => {
    createCamera.mutate(
      { school_id: schoolId, ...data },
      { onSuccess: () => setShowAddDialog(false) }
    );
  };

  const handleUpdateCamera = (data: CameraFormData) => {
    if (!editingCamera) return;
    updateCamera.mutate(
      { id: editingCamera.id, ...data },
      { onSuccess: () => setEditingCamera(null) }
    );
  };

  const handleDeleteCamera = () => {
    if (!deletingCamera) return;
    deleteCamera.mutate(deletingCamera.id, {
      onSuccess: () => setDeletingCamera(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            Caméras de surveillance
          </h2>
          <p className="text-muted-foreground mt-1">
            {cameras.length} caméra{cameras.length > 1 ? "s" : ""} configurée{cameras.length > 1 ? "s" : ""} 
            {activeCameras > 0 && ` • ${activeCameras} active${activeCameras > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une caméra
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une caméra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cameras Grid */}
      {filteredCameras.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <VideoOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">
              {searchQuery ? "Aucune caméra trouvée" : "Aucune caméra configurée"}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              {searchQuery 
                ? "Modifiez votre recherche pour trouver des caméras." 
                : "Ajoutez des caméras pour surveiller votre établissement en temps réel."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter votre première caméra
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map((camera) => (
            <Card 
              key={camera.id} 
              className={`group hover:shadow-md transition-all cursor-pointer ${
                !camera.is_active ? "opacity-60" : ""
              }`}
              onClick={() => setViewingCamera(camera)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      camera.is_active 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{camera.name}</CardTitle>
                      {camera.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {camera.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setViewingCamera(camera);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le flux
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditingCamera(camera);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCamera(camera);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Preview Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:from-zinc-200 group-hover:to-zinc-300 dark:group-hover:from-zinc-700 dark:group-hover:to-zinc-800 transition-colors">
                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="p-3 rounded-full bg-background/80">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">Cliquer pour voir</span>
                    </div>
                    {/* Status indicator - shows active/configured status, not live status */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${camera.is_active ? 'bg-green-500' : 'bg-zinc-400'}`}></span>
                      <span className={`text-xs font-medium ${camera.is_active ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                        {camera.is_active ? 'Prête' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Description */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={camera.is_active ? "default" : "secondary"} 
                      className={`text-xs ${camera.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100' : ''}`}
                    >
                      {camera.is_active ? "Configurée" : "Désactivée"}
                    </Badge>
                    {camera.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {camera.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <CameraFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleCreateCamera}
        isLoading={createCamera.isPending}
      />

      {/* Edit Dialog */}
      <CameraFormDialog
        open={!!editingCamera}
        onOpenChange={(open) => !open && setEditingCamera(null)}
        onSubmit={handleUpdateCamera}
        isLoading={updateCamera.isPending}
        camera={editingCamera}
      />

      {/* View Dialog */}
      <CameraViewDialog
        open={!!viewingCamera}
        onOpenChange={(open) => !open && setViewingCamera(null)}
        camera={viewingCamera}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCamera} onOpenChange={(open) => !open && setDeletingCamera(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la caméra ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la caméra "{deletingCamera?.name}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCamera}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
