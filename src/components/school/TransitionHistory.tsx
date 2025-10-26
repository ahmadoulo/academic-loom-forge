import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useYearTransition } from '@/hooks/useYearTransition';
import { Calendar, Users, School, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TransitionHistoryProps {
  schoolId: string;
}

export const TransitionHistory = ({ schoolId }: TransitionHistoryProps) => {
  const { getTransitionHistory, getTransitionDetails, loading } = useYearTransition(schoolId);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedPreparation, setExpandedPreparation] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getTransitionHistory();
    setHistory(data);
  };

  const handleToggleExpand = async (preparationId: string) => {
    if (expandedPreparation === preparationId) {
      setExpandedPreparation(null);
    } else {
      setExpandedPreparation(preparationId);
      
      // Charger les détails si pas déjà chargés
      if (!details[preparationId]) {
        const prepDetails = await getTransitionDetails(preparationId);
        setDetails(prev => ({ ...prev, [preparationId]: prepDetails }));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Brouillon', variant: 'secondary' },
      classes_created: { label: 'Classes créées', variant: 'outline' },
      mapping_done: { label: 'Mapping complété', variant: 'outline' },
      completed: { label: 'Terminé', variant: 'default' }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransitionTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      promoted: { label: 'Passage', variant: 'default' },
      retained: { label: 'Redoublement', variant: 'outline' },
      departed: { label: 'Départ', variant: 'destructive' },
      transferred: { label: 'Transfert', variant: 'secondary' }
    };
    
    const config = typeConfig[type] || { label: type, variant: 'secondary' };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Historique des Transitions</h2>
        <p className="text-muted-foreground mt-1">
          Consultez l'historique des préparations d'années scolaires
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">Chargement de l'historique...</p>
          </CardContent>
        </Card>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune transition enregistrée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((prep) => (
            <Card key={prep.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        {prep.from_year?.name} <ArrowRight className="inline h-4 w-4 mx-1" /> {prep.to_year?.name}
                      </CardTitle>
                      {getStatusBadge(prep.status)}
                    </div>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Créée le {format(new Date(prep.created_at), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      {prep.students_promoted_at && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Complétée le {format(new Date(prep.students_promoted_at), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleExpand(prep.id)}
                  >
                    {expandedPreparation === prep.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {expandedPreparation === prep.id && details[prep.id] && (
                <CardContent className="border-t pt-6">
                  <div className="space-y-6">
                    {/* Transitions de classes */}
                    {details[prep.id].classTransitions.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                          <School className="h-4 w-4" />
                          Mappings de classes ({details[prep.id].classTransitions.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {details[prep.id].classTransitions.map((ct: any) => (
                            <Card key={ct.id} className="bg-muted/30">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">{ct.from_class?.name}</span>
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="font-medium text-primary">{ct.to_class?.name}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transitions d'étudiants */}
                    {details[prep.id].studentTransitions.length > 0 && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-3">
                          <Users className="h-4 w-4" />
                          Étudiants transférés ({details[prep.id].studentTransitions.length})
                        </h4>
                        
                        {/* Stats par type */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {['promoted', 'retained', 'departed', 'transferred'].map(type => {
                            const count = details[prep.id].studentTransitions.filter((st: any) => st.transition_type === type).length;
                            if (count === 0) return null;
                            return (
                              <Card key={type} className="bg-muted/30">
                                <CardContent className="p-3 text-center">
                                  <div className="text-2xl font-bold">{count}</div>
                                  <div className="text-xs mt-1">{getTransitionTypeBadge(type)}</div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Liste détaillée */}
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {details[prep.id].studentTransitions.map((st: any) => (
                            <div
                              key={st.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-md text-sm"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {st.student?.firstname} {st.student?.lastname}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {st.from_class?.name} → {st.to_class?.name || '-'}
                                </p>
                              </div>
                              {getTransitionTypeBadge(st.transition_type)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
