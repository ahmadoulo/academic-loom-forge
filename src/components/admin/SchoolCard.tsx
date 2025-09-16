import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, Users, Calendar, ExternalLink } from "lucide-react";

interface SchoolCardProps {
  school: {
    id: string;
    name: string;
    identifier: string;
    studentsCount: number;
    teachersCount: number;
    classesCount: number;
    createdAt: string;
  };
  onView: (schoolId: string) => void;
  onEdit: (schoolId: string) => void;
}

export const SchoolCard = ({ school, onView, onEdit }: SchoolCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{school.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {school.identifier}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{school.studentsCount}</div>
              <div className="text-xs text-muted-foreground">Étudiants</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{school.teachersCount}</div>
              <div className="text-xs text-muted-foreground">Professeurs</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{school.classesCount}</div>
              <div className="text-xs text-muted-foreground">Classes</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Créée le {new Date(school.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onView(school.id)}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Accéder
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => onEdit(school.id)}
          className="flex-1"
        >
          Modifier
        </Button>
      </CardFooter>
    </Card>
  );
};