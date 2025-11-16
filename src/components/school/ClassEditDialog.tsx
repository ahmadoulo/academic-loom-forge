import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClassForm } from "./ClassForm";
import { Class } from "@/hooks/useClasses";

interface ClassEditDialogProps {
  classToEdit: (Class & { cycle_id?: string; option_id?: string; year_level?: number; is_specialization?: boolean }) | null;
  schoolId: string;
  onClose: () => void;
  onUpdate: (classData: {
    name: string;
    cycle_id?: string;
    option_id?: string;
    year_level?: number;
    is_specialization?: boolean;
  }) => void;
}

export const ClassEditDialog = ({ classToEdit, schoolId, onClose, onUpdate }: ClassEditDialogProps) => {
  if (!classToEdit) return null;

  return (
    <Dialog open={!!classToEdit} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
        </DialogHeader>
        <ClassForm
          schoolId={schoolId}
          classToEdit={classToEdit}
          onSubmit={onUpdate}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
