import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, UserPlus, Settings, Trash2, Edit } from 'lucide-react';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SchoolUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface SchoolSettingsProps {
  schoolId: string;
}

export function SchoolSettings({ schoolId }: SchoolSettingsProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('users');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  
  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'teacher' as UserRole,
    password: ''
  });

  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.password) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs"
      });
      return;
    }

    try {
      // Ici vous implémenteriez la création d'utilisateur via Supabase
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${newUser.first_name} ${newUser.last_name} a été créé avec succès`
      });
      
      setNewUser({ first_name: '', last_name: '', email: '', role: 'teacher', password: '' });
      setIsCreateUserOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer l'utilisateur"
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      global_admin: { label: 'Admin Global', variant: 'default' as const },
      school_admin: { label: 'Admin École', variant: 'secondary' as const },
      teacher: { label: 'Professeur', variant: 'outline' as const },
      student: { label: 'Étudiant', variant: 'outline' as const },
      parent: { label: 'Parent', variant: 'outline' as const }
    };
    return roleConfig[role] || { label: role, variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Paramètres de l'École</h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et les permissions de votre établissement
          </p>
        </div>
        <Badge variant="secondary">
          <Shield className="h-4 w-4 mr-1" />
          Admin École
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles">Rôles & Permissions</TabsTrigger>
          <TabsTrigger value="school">Paramètres École</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des Utilisateurs
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez et gérez les comptes utilisateurs de votre école
                  </p>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nouvel Utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Prénom</Label>
                          <Input
                            id="firstName"
                            value={newUser.first_name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                            placeholder="Prénom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Nom</Label>
                          <Input
                            id="lastName"
                            value={newUser.last_name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                            placeholder="Nom"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@exemple.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe temporaire</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Mot de passe"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Rôle</Label>
                        <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teacher">Professeur</SelectItem>
                            <SelectItem value="student">Étudiant</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            {profile?.role === 'global_admin' && (
                              <SelectItem value="school_admin">Admin École</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          L'utilisateur recevra un email avec ses identifiants de connexion.
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleCreateUser}>
                          Créer l'utilisateur
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simulation d'utilisateurs existants */}
                {[
                  { id: '1', first_name: 'Marie', last_name: 'Dupont', email: 'marie.dupont@ecole.fr', role: 'teacher' as UserRole, is_active: true, created_at: '2024-01-15' },
                  { id: '2', first_name: 'Pierre', last_name: 'Martin', email: 'pierre.martin@ecole.fr', role: 'teacher' as UserRole, is_active: true, created_at: '2024-01-20' },
                  { id: '3', first_name: 'Admin', last_name: 'École', email: 'admin@ecole.fr', role: 'school_admin' as UserRole, is_active: true, created_at: '2024-01-01' }
                ].map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                            <Badge variant={roleBadge.variant}>
                              {roleBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestion des Rôles et Permissions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Définissez les permissions pour chaque rôle dans votre école
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  {
                    role: 'teacher',
                    name: 'Professeur',
                    description: 'Peut gérer ses classes, noter les étudiants et prendre les présences',
                    permissions: ['Gestion des notes', 'Prise de présence', 'Vue des étudiants', 'Génération de rapports']
                  },
                  {
                    role: 'student',
                    name: 'Étudiant',
                    description: 'Peut voir ses notes et marquer sa présence',
                    permissions: ['Vue des notes personnelles', 'Marquage de présence', 'Vue du planning']
                  },
                  {
                    role: 'parent',
                    name: 'Parent',
                    description: 'Peut suivre la scolarité de son enfant',
                    permissions: ['Vue des notes de l\'enfant', 'Vue des présences de l\'enfant', 'Communication avec les professeurs']
                  }
                ].map((roleData) => (
                  <Card key={roleData.role}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{roleData.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{roleData.description}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {roleData.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres de l'École
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configurez les paramètres généraux de votre établissement
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nom de l'école</Label>
                  <Input id="schoolName" placeholder="Nom de l'établissement" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identifier">Identifiant</Label>
                  <Input id="identifier" placeholder="MUNDIA01" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" placeholder="Adresse de l'école" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" placeholder="+33 1 23 45 67 89" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}