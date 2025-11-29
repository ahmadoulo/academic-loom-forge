import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, User, FileText } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GradeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: {
    grade: number;
    bonus?: number;
    bonus_reason?: string;
    bonus_given_at?: string;
    bonus_given_by_credential?: {
      first_name: string;
      last_name: string;
    } | null;
    teachers?: {
      firstname: string;
      lastname: string;
    };
    grade_type: string;
    comment?: string;
    exam_date?: string;
    created_at: string;
  };
  studentName: string;
  subjectName: string;
}

export function GradeDetailDialog({
  open,
  onOpenChange,
  grade,
  studentName,
  subjectName
}: GradeDetailDialogProps) {
  const finalGrade = Number(grade.grade) + (grade.bonus || 0);
  const hasBonus = grade.bonus && grade.bonus > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Détails de la Note
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info étudiant et matière */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Étudiant</p>
              <p className="font-semibold text-lg">{studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Matière</p>
              <p className="font-semibold text-lg">{subjectName}</p>
            </div>
          </div>

          {/* Type et date */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Type d'évaluation</p>
              <Badge variant="secondary" className="mt-1">
                {grade.grade_type === 'examen' ? 'Examen' : 
                 grade.grade_type === 'controle' ? 'Contrôle' : 
                 'Devoir'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {grade.exam_date 
                  ? format(new Date(grade.exam_date), 'dd MMM yyyy', { locale: fr })
                  : format(new Date(grade.created_at), 'dd MMM yyyy', { locale: fr })
                }
              </p>
            </div>
          </div>

          {/* Note et bonus */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Note initiale</p>
                <p className="text-4xl font-bold text-primary">{Number(grade.grade).toFixed(1)}</p>
              </div>
              
              {hasBonus && (
                <>
                  <div className="text-4xl font-bold text-muted-foreground">+</div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Bonus</p>
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                      <p className="text-4xl font-bold text-yellow-600">{grade.bonus}</p>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-muted-foreground">=</div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Note finale</p>
                    <p className="text-4xl font-bold text-emerald-600">{finalGrade.toFixed(1)}</p>
                  </div>
                </>
              )}
              
              {!hasBonus && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Note finale</p>
                  <p className="text-4xl font-bold">{finalGrade.toFixed(1)}/20</p>
                </div>
              )}
            </div>

            {/* Justification du bonus */}
            {hasBonus && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Justification du bonus
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 italic">
                      "{grade.bonus_reason}"
                    </p>
                    {(grade.bonus_given_by_credential || grade.teachers) && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-yellow-700 dark:text-yellow-300">
                        <User className="h-3.5 w-3.5" />
                        <span>
                          Attribué par: {grade.bonus_given_by_credential
                            ? `${grade.bonus_given_by_credential.first_name} ${grade.bonus_given_by_credential.last_name}`
                            : `${grade.teachers?.firstname} ${grade.teachers?.lastname}`}
                        </span>
                      </div>
                    )}
                    {grade.bonus_given_at && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Le {format(new Date(grade.bonus_given_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Commentaire */}
            {grade.comment && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Commentaire</p>
                <p className="text-sm italic">"{grade.comment}"</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
