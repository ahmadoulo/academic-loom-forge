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
import { Plus, BookOpen, Edit, Trash2, Calendar, Clock, BookMarked, FileText, Link2, MessageSquare } from 'lucide-react';
import { useTeacherTextbooks, useTextbookEntries, useTextbookNotes, Textbook, TextbookEntry } from '@/hooks/useTextbooks';
import { useAcademicYear } from '@/hooks/useAcademicYear';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
interface TeacherTextbooksSectionProps {
  teacherId: string;
  schoolId: string;
}

export const TeacherTextbooksSection = ({ teacherId, schoolId }: TeacherTextbooksSectionProps) => {
  const { currentYear } = useAcademicYear();
  const { textbooks, isLoading } = useTeacherTextbooks(teacherId, currentYear?.id);
  const [selectedTextbook, setSelectedTextbook] = useState<Textbook | null>(null);

  if (selectedTextbook) {
    return (
      <TextbookEntryManager 
        textbook={selectedTextbook}
        teacherId={teacherId}
        schoolId={schoolId}
        onBack={() => setSelectedTextbook(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Mes Cahiers de Texte
        </h2>
        <p className="text-muted-foreground">Consultez et remplissez les cahiers de texte de vos classes</p>
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
            <p className="text-muted-foreground">Aucun cahier de texte n'est assigné à vos classes pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {textbooks.map(textbook => (
            <Card 
              key={textbook.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTextbook(textbook)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{textbook.classes?.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {textbook.description || textbook.name}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Ouvrir le cahier
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

interface TextbookEntryManagerProps {
  textbook: Textbook;
  teacherId: string;
  schoolId: string;
  onBack: () => void;
}

const TextbookEntryManager = ({ textbook, teacherId, schoolId, onBack }: TextbookEntryManagerProps) => {
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useTextbookEntries(textbook.id, teacherId);
  const { notes } = useTextbookNotes(textbook.id, teacherId);
  const [teacherSubjects, setTeacherSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TextbookEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('entries');

  // Fetch subjects assigned to this teacher for this class
  useEffect(() => {
    const loadTeacherSubjectsForClass = async () => {
      if (!teacherId || !textbook.class_id) {
        setSubjectsLoading(false);
        return;
      }

      try {
        // Get subjects assigned to this class via class_subjects junction table
        const { data: classSubjects, error: classError } = await supabase
          .from('class_subjects')
          .select(`
            subject_id,
            subjects (
              id,
              name,
              teacher_id
            )
          `)
          .eq('class_id', textbook.class_id);

        if (classError) {
          console.error('Error loading class subjects:', classError);
          setSubjectsLoading(false);
          return;
        }

        // Filter to only show subjects assigned to this teacher
        const filteredSubjects = (classSubjects || [])
          .filter((cs: any) => cs.subjects?.teacher_id === teacherId)
          .map((cs: any) => ({
            id: cs.subjects.id,
            name: cs.subjects.name
          }));

        setTeacherSubjects(filteredSubjects);
      } catch (err) {
        console.error('Error fetching teacher subjects for class:', err);
      } finally {
        setSubjectsLoading(false);
      }
    };

    loadTeacherSubjectsForClass();
  }, [teacherId, textbook.class_id]);

  const [formData, setFormData] = useState({
    subject_id: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    chapter_title: '',
    lesson_content: '',
    objectives_covered: '',
    homework_given: '',
    homework_due_date: '',
    next_session_plan: '',
    resources_links: '',
    observations: '',
  });

  const resetForm = () => {
    setFormData({
      subject_id: '',
      session_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '',
      end_time: '',
      chapter_title: '',
      lesson_content: '',
      objectives_covered: '',
      homework_given: '',
      homework_due_date: '',
      next_session_plan: '',
      resources_links: '',
      observations: '',
    });
    setEditingEntry(null);
  };

  const openEditForm = (entry: TextbookEntry) => {
    setEditingEntry(entry);
    setFormData({
      subject_id: entry.subject_id,
      session_date: entry.session_date,
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      chapter_title: entry.chapter_title || '',
      lesson_content: entry.lesson_content,
      objectives_covered: entry.objectives_covered || '',
      homework_given: entry.homework_given || '',
      homework_due_date: entry.homework_due_date || '',
      next_session_plan: entry.next_session_plan || '',
      resources_links: entry.resources_links || '',
      observations: entry.observations || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      textbook_id: textbook.id,
      teacher_id: teacherId,
      subject_id: formData.subject_id,
      session_date: formData.session_date,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      chapter_title: formData.chapter_title || undefined,
      lesson_content: formData.lesson_content,
      objectives_covered: formData.objectives_covered || undefined,
      homework_given: formData.homework_given || undefined,
      homework_due_date: formData.homework_due_date || undefined,
      next_session_plan: formData.next_session_plan || undefined,
      resources_links: formData.resources_links || undefined,
      observations: formData.observations || undefined,
    };

    if (editingEntry) {
      updateEntry.mutate({ id: editingEntry.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          resetForm();
        }
      });
    } else {
      createEntry.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
          resetForm();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>← Retour</Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{textbook.name}</h2>
          <p className="text-muted-foreground">Classe: {textbook.classes?.name}</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle entrée
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée au cahier de texte'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Matière *</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(v) => setFormData(p => ({ ...p, subject_id: v }))}
                    disabled={subjectsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        subjectsLoading 
                          ? "Chargement..." 
                          : teacherSubjects.length === 0 
                            ? "Aucune matière assignée" 
                            : "Sélectionner une matière"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherSubjects.length === 0 ? (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          Aucune matière ne vous est assignée pour cette classe
                        </div>
                      ) : (
                        teacherSubjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!subjectsLoading && teacherSubjects.length === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Contactez l'administration pour assigner des matières
                    </p>
                  )}
                </div>
                <div>
                  <Label>Date de la séance *</Label>
                  <Input 
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData(p => ({ ...p, session_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de début</Label>
                  <Input 
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Heure de fin</Label>
                  <Input 
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData(p => ({ ...p, end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Titre du chapitre / Thème</Label>
                <Input 
                  value={formData.chapter_title}
                  onChange={(e) => setFormData(p => ({ ...p, chapter_title: e.target.value }))}
                  placeholder="Ex: Chapitre 3 - Les équations du second degré"
                />
              </div>

              <div>
                <Label>Contenu de la séance *</Label>
                <Textarea 
                  value={formData.lesson_content}
                  onChange={(e) => setFormData(p => ({ ...p, lesson_content: e.target.value }))}
                  placeholder="Décrivez ce qui a été fait pendant la séance..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Objectifs couverts</Label>
                <Textarea 
                  value={formData.objectives_covered}
                  onChange={(e) => setFormData(p => ({ ...p, objectives_covered: e.target.value }))}
                  placeholder="Objectifs pédagogiques atteints..."
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Devoirs / Travail à faire
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label>Devoirs donnés</Label>
                    <Textarea 
                      value={formData.homework_given}
                      onChange={(e) => setFormData(p => ({ ...p, homework_given: e.target.value }))}
                      placeholder="Ex: Exercices 5 et 6 page 42"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Date limite de rendu</Label>
                    <Input 
                      type="date"
                      value={formData.homework_due_date}
                      onChange={(e) => setFormData(p => ({ ...p, homework_due_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Programme prévu pour la prochaine séance</Label>
                <Textarea 
                  value={formData.next_session_plan}
                  onChange={(e) => setFormData(p => ({ ...p, next_session_plan: e.target.value }))}
                  placeholder="Ce qui sera abordé lors de la prochaine séance..."
                  rows={2}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Liens / Ressources
                </Label>
                <Textarea 
                  value={formData.resources_links}
                  onChange={(e) => setFormData(p => ({ ...p, resources_links: e.target.value }))}
                  placeholder="Liens vers des ressources, documents, vidéos..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Observations / Notes</Label>
                <Textarea 
                  value={formData.observations}
                  onChange={(e) => setFormData(p => ({ ...p, observations: e.target.value }))}
                  placeholder="Observations diverses, difficultés rencontrées..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={
                  subjectsLoading || 
                  teacherSubjects.length === 0 || 
                  !formData.subject_id || 
                  !formData.lesson_content || 
                  createEntry.isPending || 
                  updateEntry.isPending
                }
                className="w-full"
              >
                {editingEntry ? 'Mettre à jour' : 'Enregistrer l\'entrée'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries">
            <BookOpen className="h-4 w-4 mr-2" />
            Mes entrées ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-4 w-4 mr-2" />
            Notes admin ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24" />
                </Card>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Aucune entrée</h3>
                <p className="text-muted-foreground mb-4">Commencez à remplir votre cahier de texte</p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une entrée
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {entries.map(entry => (
                  <Card key={entry.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
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
                            <div className="mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Prochaine séance:</span>
                              <p className="text-sm">{entry.next_session_plan}</p>
                            </div>
                          )}

                          {entry.resources_links && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-muted-foreground">Ressources:</span>
                              <p className="text-sm text-primary break-all">{entry.resources_links}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(entry.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {notes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune note de l'administration</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <Card key={note.id} className="border-l-4 border-l-primary">
                  <CardContent className="py-4">
                    <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(note.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                      {note.user_credentials && (
                        <span>- {note.user_credentials.first_name} {note.user_credentials.last_name}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Supprimer l'entrée"
        description="Cette action est irréversible."
        onConfirm={() => {
          if (deleteId) {
            deleteEntry.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
};

export default TeacherTextbooksSection;
