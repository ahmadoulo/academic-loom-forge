import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Mail, Phone, MessageCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useSchools } from "@/hooks/useSchools";

export function SupportSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  
  const { users, loading: usersLoading } = useUsers();
  const { schools, loading: schoolsLoading } = useSchools();

  // Mock support tickets data
  const supportTickets = [
    {
      id: "1",
      user: "jean.dupont@lycee-hugo.fr",
      school: "Lycée Victor Hugo",
      type: "technical",
      status: "open",
      priority: "high",
      subject: "Problème de connexion",
      created: "2024-01-15T10:30:00Z"
    },
    {
      id: "2", 
      user: "marie.martin@college-pasteur.fr",
      school: "Collège Pasteur",
      type: "account",
      status: "in-progress",
      priority: "medium",
      subject: "Reset mot de passe",
      created: "2024-01-14T14:20:00Z"
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSchool = selectedSchool === "all" || user.school_id === selectedSchool;
    
    return matchesSearch && matchesSchool;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Ouvert</Badge>;
      case "in-progress":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case "resolved":
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Résolu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Haute</Badge>;
      case "medium":
        return <Badge variant="secondary">Moyenne</Badge>;
      case "low":
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Support Utilisateurs</h2>
        <p className="text-muted-foreground">Gérez le support et l'assistance aux utilisateurs des écoles</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tickets">Tickets Support</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rechercher des Utilisateurs</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer par école" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les écoles</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const school = schools.find(s => s.id === user.school_id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                          <Badge variant="outline">{user.role}</Badge>
                          {!user.is_active && <Badge variant="destructive">Inactif</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        {school && (
                          <p className="text-sm text-muted-foreground">
                            École: {school.name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Contacter
                        </Button>
                        <Button variant="outline" size="sm">
                          Réinitialiser MDP
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets de Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{ticket.subject}</h4>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <Mail className="h-3 w-3 inline mr-1" />
                          {ticket.user}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          École: {ticket.school}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Créé le {new Date(ticket.created).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Voir Détails
                        </Button>
                        <Button variant="outline" size="sm">
                          Répondre
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {supportTickets.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Aucun ticket de support</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}