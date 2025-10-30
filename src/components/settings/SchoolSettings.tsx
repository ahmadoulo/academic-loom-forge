import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSchools } from '@/hooks/useSchools';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Upload, Loader2 } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Informations de l'école
            </h2>
            <p className="text-muted-foreground mt-1">
              Gérez les informations et paramètres de votre établissement
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Logo Section */}
        <div className="p-6 bg-gradient-subtle rounded-xl border border-border space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Logo de l'école</Label>
            <p className="text-sm text-muted-foreground">
              JPG, PNG ou WEBP. Taille maximale : 2MB
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {schoolData.logo_url ? (
              <div className="w-32 h-32 border-2 border-border rounded-xl overflow-hidden bg-background flex items-center justify-center shadow-soft">
                <img
                  src={schoolData.logo_url}
                  alt="Logo de l'école"
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-border rounded-xl bg-secondary flex items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-3">
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
                  className="w-full sm:w-auto"
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
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* School Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Informations générales</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom de l'école <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={schoolData.name}
                onChange={(e) => setSchoolData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom de l'établissement"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
              <Input
                id="phone"
                value={schoolData.phone}
                onChange={(e) => setSchoolData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+212 XXX XXXXXX"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Adresse</Label>
              <Input
                id="address"
                value={schoolData.address}
                onChange={(e) => setSchoolData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Adresse complète"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">Ville</Label>
              <Input
                id="city"
                value={schoolData.city}
                onChange={(e) => setSchoolData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ville"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">Pays</Label>
              <Input
                id="country"
                value={schoolData.country}
                onChange={(e) => setSchoolData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Pays"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Site web</Label>
              <Input
                id="website"
                value={schoolData.website}
                onChange={(e) => setSchoolData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.example.com"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic_year" className="text-sm font-medium">Année scolaire</Label>
              <Input
                id="academic_year"
                value={schoolData.academic_year}
                onChange={(e) => setSchoolData(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="2024-2025"
                className="h-11"
              />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={loadSchoolData}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={loading || !schoolData.name}
            className="px-8"
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
      </div>
    </div>
  );
}
