import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Save, Trash2, Building2 } from 'lucide-react';
import { settingsApi } from '@/api/settings.api';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CustomerSettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { branding } = useTheme();
  
  const [formData, setFormData] = useState({
    primary_color: '#0f172a',
    logo_url: '',
  });

  // Pre-fill form when branding is loaded
  useEffect(() => {
    if (branding) {
      setFormData({
        primary_color: branding.primary_color || '#0f172a',
        logo_url: branding.logo_url || '',
      });
    }
  }, [branding]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateBranding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantBranding'] });
      toast.success('Branding updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update branding', { description: error.message });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, logo_url: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Branding Settings</h1>
        <p className="text-slate-500 mt-1">Configure your portal's appearance and brand identity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
          <CardDescription>
            Update your company logo and primary brand color. These will be visible to all your customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                  {formData.logo_url ? (
                    <img src={formData.logo_url} alt="Logo" className="h-full w-full object-contain p-2" />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                    {formData.logo_url && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, or SVG up to 2MB</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3">
                <Input
                  id="primaryColor"
                  type="color"
                  className="h-10 w-20 cursor-pointer p-1"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                />
                <Input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="font-mono uppercase"
                  placeholder="#000000"
                />
              </div>
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
