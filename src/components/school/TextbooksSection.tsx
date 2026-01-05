import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, BookOpen, Eye, Trash2, MessageSquare, Calendar, Clock, User, BookMarked, Download } from 'lucide-react';
import { useTextbooks, useTextbookEntries, useTextbookNotes, Textbook, TextbookEntry } from '@/hooks/useTextbooks';
import { useClasses } from '@/hooks/useClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { exportTextbookToPdf } from '@/utils/textbookPdfExport';
import { imageUrlToBase64 } from '@/utils/imageToBase64';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TextbooksSectionProps {
  schoolId: string;
  canCreate?: boolean;
  canDelete?: boolean;
}

export const TextbooksSection = ({ schoolId, canCreate = true, canDelete = true }: TextbooksSectionProps) => {
  const { currentYear } = useAcademicYear();
  const { textbooks, isLoading, createTextbook, deleteTextbook } = useTextbooks(schoolId, currentYear?.id);
  const { classes } = useClasses(schoolId);
  const { teachers } = useTeachers(schoolId);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    class_id: '',
    name: '',
    description: '',
  });

  const currentYearClasses = classes.filter(c => (c as any).school_year_id === currentYear?.id && !(c as any).archived);

  const handleCreate = () => {
    if (!currentYear) return;
    createTextbook.mutate({
      school_id: schoolId,
      class_id: formData.class_id,
      school_year_id: currentYear.id,
      name: formData.name || `Cahier de texte - ${currentYearClasses.find(c => c.id === formData.class_id)?.name}`,
      description: formData.description || undefined,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ class_id: '', name: '', description: '' });
      }
    });
  };

  if (selectedTextbook) {
    return (
      <TextbookDetail 
        textbook={selectedTextbook} 
        teachers={teachers}
        onBack={() => setSelectedTextbook(null)} 
        schoolId={schoolId}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Cahiers de Texte
          </h2>
          <p className="text-muted-foreground">Gérez les cahiers de texte de vos classes</p>
        </div>
        
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Cahier
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un Cahier de Texte</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Classe *</Label>
                <Select value={formData.class_id} onValueChange={(v) => setFormData(p => ({ ...p, class_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentYearClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nom (optionnel)</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Cahier de texte - 1ère Année"
                />
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description du cahier de texte..."
                />
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={!formData.class_id || createTextbook.isPending}
                className="w-full"
              >
                Créer le cahier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : textbooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Aucun cahier de texte</h3>
            <p className="text-muted-foreground mb-4">Créez un cahier de texte pour commencer</p>
            {canCreate && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un cahier
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {textbooks.map(textbook => (
            <Card key={textbook.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{textbook.classes?.name}</CardTitle>
                  </div>
                  <Badge variant={textbook.is_active ? 'default' : 'secondary'}>
                    {textbook.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {textbook.description || textbook.name}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedTextbook(textbook)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Consulter
                  </Button>
                  {canDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDeleteId(textbook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Supprimer le cahier de texte"
        description="Cette action est irréversible. Toutes les entrées seront également supprimées."
        onConfirm={() => {
          if (deleteId) {
            deleteTextbook.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
};

interface TextbookDetailProps {
  textbook: Textbook;
  teachers: any[];
  onBack: () => void;
  schoolId: string;
}

const TextbookDetail = ({ textbook, teachers, onBack, schoolId }: TextbookDetailProps) => {
  const { entries, isLoading: entriesLoading } = useTextbookEntries(textbook.id);
  const { notes, createNote, deleteNote } = useTextbookNotes(textbook.id);
  const { currentYear } = useAcademicYear();
  const [activeTab, setActiveTab] = useState('entries');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<{ name: string; logo_url: string | null } | null>(null);
  const [noteForm, setNoteForm] = useState({
    note_content: '',
    target_teacher_id: '',
    is_visible_to_all: true,
  });

  // Fetch school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      const { data } = await supabase.from('schools').select('name, logo_url').eq('id', schoolId).single();
      if (data) setSchoolInfo(data);
    };
    loadSchoolInfo();
  }, [schoolId]);

  const handleExportPdf = async () => {
    if (!schoolInfo) return;
    
    setIsExporting(true);
    try {
      let logoBase64: string | undefined;
      if (schoolInfo.logo_url) {
        try {
          logoBase64 = await imageUrlToBase64(schoolInfo.logo_url);
        } catch (e) {
          console.error('Failed to load logo:', e);
        }
      }

      await exportTextbookToPdf({
        schoolName: schoolInfo.name,
        schoolLogoBase64: logoBase64,
        className: textbook.classes?.name || 'Classe',
        textbookName: textbook.name,
        academicYear: currentYear?.name || new Date().getFullYear().toString(),
        entries: entries,
        isTeacherExport: false,
      });
      
      toast.success('Cahier de texte exporté avec succès');
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'exportation");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateNote = () => {
    createNote.mutate({
      textbook_id: textbook.id,
      note_content: noteForm.note_content,
      target_teacher_id: noteForm.is_visible_to_all ? undefined : noteForm.target_teacher_id || undefined,
      is_visible_to_all: noteForm.is_visible_to_all,
    }, {
      onSuccess: () => {
        setIsNoteDialogOpen(false);
        setNoteForm({ note_content: '', target_teacher_id: '', is_visible_to_all: true });
      }
    });
  };

  // Group entries by teacher
  const entriesByTeacher = entries.reduce((acc, entry) => {
    const teacherName = entry.teachers ? `${entry.teachers.firstname} ${entry.teachers.lastname}` : 'Inconnu';
    if (!acc[teacherName]) acc[teacherName] = [];
    acc[teacherName].push(entry);
    return acc;
  }, {} as Record<string, TextbookEntry[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Retour</Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{textbook.name}</h2>
          <p className="text-muted-foreground">Classe: {textbook.classes?.name}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportPdf} 
          disabled={isExporting || entries.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Export...' : 'Exporter PDF'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries">
            <BookOpen className="h-4 w-4 mr-2" />
            Entrées ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes Admin ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          {entriesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24" />
                </Card>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune entrée dans ce cahier de texte</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(entriesByTeacher).map(([teacherName, teacherEntries]) => (
                <Card key={teacherName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5" />
                      {teacherName}
                      <Badge variant="outline">{teacherEntries.length} entrées</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-4">
                        {teacherEntries.map(entry => (
                          <EntryCard key={entry.id} entry={entry} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une note
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle note administrative</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Contenu de la note *</Label>
                      <Textarea 
                        value={noteForm.note_content}
                        onChange={(e) => setNoteForm(p => ({ ...p, note_content: e.target.value }))}
                        placeholder="Écrivez votre note ici..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="visible-all"
                        checked={noteForm.is_visible_to_all}
                        onChange={(e) => setNoteForm(p => ({ ...p, is_visible_to_all: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="visible-all">Visible par tous les professeurs</Label>
                    </div>
                    {!noteForm.is_visible_to_all && (
                      <div>
                        <Label>Professeur destinataire</Label>
                        <Select 
                          value={noteForm.target_teacher_id} 
                          onValueChange={(v) => setNoteForm(p => ({ ...p, target_teacher_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un professeur" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.filter(t => !t.archived).map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.firstname} {t.lastname}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button 
                      onClick={handleCreateNote}
                      disabled={!noteForm.note_content || createNote.isPending}
                      className="w-full"
                    >
                      Ajouter la note
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune note administrative</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <Card key={note.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                            {note.is_visible_to_all ? (
                              <Badge variant="outline" className="text-xs">Tous</Badge>
                            ) : note.teachers && (
                              <Badge variant="secondary" className="text-xs">
                                Pour: {note.teachers.firstname} {note.teachers.lastname}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteNote.mutate(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EntryCard = ({ entry }: { entry: TextbookEntry }) => {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Badge>{entry.subjects?.name}</Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(entry.session_date), 'EEEE dd MMMM yyyy', { locale: fr })}
        </div>
        {entry.start_time && entry.end_time && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
          </div>
        )}
      </div>

      {entry.chapter_title && (
        <div className="mb-2">
          <span className="text-xs font-medium text-muted-foreground">Chapitre:</span>
          <p className="font-medium">{entry.chapter_title}</p>
        </div>
      )}

      <div className="mb-3">
        <span className="text-xs font-medium text-muted-foreground">Contenu de la séance:</span>
        <p className="text-sm whitespace-pre-wrap">{entry.lesson_content}</p>
      </div>

      {entry.homework_given && (
        <div className="mb-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Devoirs donnés:</span>
          <p className="text-sm">{entry.homework_given}</p>
          {entry.homework_due_date && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              À rendre le: {format(new Date(entry.homework_due_date), 'dd/MM/yyyy')}
            </p>
          )}
        </div>
      )}

      {entry.next_session_plan && (
        <div className="mb-3">
          <span className="text-xs font-medium text-muted-foreground">Prochaine séance:</span>
          <p className="text-sm">{entry.next_session_plan}</p>
        </div>
      )}

      {entry.resources_links && (
        <div className="mb-3">
          <span className="text-xs font-medium text-muted-foreground">Ressources:</span>
          <p className="text-sm text-primary break-all">{entry.resources_links}</p>
        </div>
      )}

      {entry.observations && (
        <div className="text-xs text-muted-foreground italic">
          Note: {entry.observations}
        </div>
      )}
    </div>
  );
};

export default TextbooksSection;
