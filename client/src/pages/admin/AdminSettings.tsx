import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'El nombre del sitio es requerido'),
  supportEmail: z.string().email('Email inválido'),
  maxFileSize: z.string().min(1, 'El tamaño máximo es requerido'),
  allowedFileTypes: z.string().min(1, 'Los tipos de archivo son requeridos'),
  maintenanceMode: z.boolean().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface AppSettings {
  siteName: string;
  supportEmail: string;
  maxFileSize: string;
  allowedFileTypes: string;
  maintenanceMode: boolean;
}

export default function AdminSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      siteName: settings.siteName,
      supportEmail: settings.supportEmail,
      maxFileSize: settings.maxFileSize,
      allowedFileTypes: settings.allowedFileTypes,
      maintenanceMode: settings.maintenanceMode,
    } : undefined,
  });

  const updateSettings = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const res = await apiRequest('PATCH', '/api/admin/settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios han sido guardados exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-settings">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Administra la configuración general de la aplicación
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Configuración General</CardTitle>
          </div>
          <CardDescription>
            Actualiza los parámetros básicos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Sitio</FormLabel>
                    <FormControl>
                      <Input placeholder="TecniFlux" {...field} data-testid="input-site-name" />
                    </FormControl>
                    <FormDescription>
                      Nombre que aparecerá en el navegador y encabezados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Soporte</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="soporte@tecniflux.com" 
                        {...field} 
                        data-testid="input-support-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Email de contacto para usuarios
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxFileSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamaño Máximo de Archivo</FormLabel>
                      <FormControl>
                        <Input placeholder="10MB" {...field} data-testid="input-max-file-size" />
                      </FormControl>
                      <FormDescription>
                        Límite para uploads de PDFs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowedFileTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipos de Archivo Permitidos</FormLabel>
                      <FormControl>
                        <Input placeholder="PDF" {...field} data-testid="input-allowed-file-types" />
                      </FormControl>
                      <FormDescription>
                        Formatos aceptados en uploads
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Modo de Mantenimiento</FormLabel>
                      <FormDescription>
                        Cuando está activo, los usuarios no podrán acceder al sistema
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-maintenance-mode"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={updateSettings.isPending}
                  data-testid="button-reset"
                >
                  Restablecer
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettings.isPending}
                  data-testid="button-save"
                >
                  {updateSettings.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
