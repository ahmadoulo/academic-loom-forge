import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchools } from '@/hooks/useSchools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Upload, Loader2, Calendar } from 'lucide-react';
import { SchoolYearManagement } from './SchoolYearManagement';

interface SchoolSettingsProps {
  schoolId: string;
}

export function SchoolSettings({ schoolId }: SchoolSettingsProps) {
  const { getSchoolById, updateSchool } = useSchools();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [schoolData, setSchoolData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: 'Maroc',
    website: '',
    academic_year: '2024-2025',
    logo_url: '',
  });

  useEffect(() => {
    loadSchoolData();
  }, [schoolId]);

  const loadSchoolData = async () => {
    try {
      const school = await getSchoolById(schoolId);
      if (school) {
        setSchoolData({
          name: school.name || '',
          phone: school.phone || '',
          address: school.address || '',
          city: school.city || '',
          country: school.country || 'Maroc',
          website: school.website || '',
          academic_year: school.academic_year || '2024-2025',
          logo_url: school.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG, PNG ou WEBP');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2097152) {
      toast.error('Le fichier est trop volumineux (max 2MB)');
      return;
    }

    try {
      setUploading(true);

      // Delete old logo if exists
      if (schoolData.logo_url) {
        const oldPath = schoolData.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('school-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${schoolId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('school-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('school-logos')
        .getPublicUrl(fileName);

      // Update school with new logo URL
      await updateSchool(schoolId, { logo_url: publicUrl });
      
      setSchoolData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload du logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await updateSchool(schoolId, schoolData);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Paramètres de l'école
        </h2>
        <p className="text-muted-foreground">
          Gérez les informations et paramètres de votre établissement
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            Informations générales
          </TabsTrigger>
          <TabsTrigger value="years" className="gap-2">
            <Calendar className="h-4 w-4" />
            Années scolaires
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Informations de base de votre établissement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <Label>Logo de l'école</Label>
            <div className="flex items-center gap-4">
              {schoolData.logo_url ? (
                <div className="w-32 h-32 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={schoolData.logo_url}
                    alt="Logo de l'école"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <Label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Changer le logo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG ou WEBP. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* School Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'école *</Label>
              <Input
                id="name"
                value={schoolData.name}
                onChange={(e) => setSchoolData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de l'établissement"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={schoolData.phone}
                onChange={(e) => setSchoolData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+212 XXX XXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={schoolData.address}
                onChange={(e) => setSchoolData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse complète"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={schoolData.city}
                onChange={(e) => setSchoolData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ville"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                value={schoolData.country}
                onChange={(e) => setSchoolData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Pays"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                value={schoolData.website}
                onChange={(e) => setSchoolData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year">Année scolaire (Legacy)</Label>
              <Input
                id="academic_year"
                value={schoolData.academic_year}
                onChange={(e) => setSchoolData(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="2024-2025"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Gérez les années scolaires dans l'onglet "Années scolaires"
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              onClick={handleSaveSettings}
              disabled={loading || !schoolData.name}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="years">
          <SchoolYearManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
