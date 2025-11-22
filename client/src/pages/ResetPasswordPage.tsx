import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, params] = useRoute("/reset-password/:token");
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const { toast} = useToast();

  const token = params?.token || "";

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Basic token format validation (without backend call to prevent enumeration)
  // Only checks if token has minimum viable format (hexadecimal, min length)
  useEffect(() => {
    if (!token || token.length < 32 || !/^[a-f0-9]+$/i.test(token)) {
      setInvalidToken(true);
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Token inválido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al restablecer contraseña");
      }

      setResetSuccess(true);
      toast({
        title: "¡Éxito!",
        description: result.message,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al restablecer su contraseña",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Enlace Inválido</CardTitle>
            <CardDescription>
              El enlace de recuperación es inválido o tiene un formato incorrecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" data-testid="button-request-new">
              <Link href="/forgot-password">
                Solicitar nuevo enlace
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full" data-testid="button-back-login">
              <Link href="/login">
                Volver al inicio de sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" data-testid="icon-success" />
            </div>
            <CardTitle>¡Contraseña Restablecida!</CardTitle>
            <CardDescription>
              Su contraseña ha sido actualizada exitosamente. Será redirigido al inicio de sesión...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" data-testid="button-login-now">
              <Link href="/login">
                Ir al inicio de sesión
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle data-testid="heading-reset-password">Restablecer Contraseña</CardTitle>
          <CardDescription>
            Ingrese su nueva contraseña. Debe tener al menos 6 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          disabled={isSubmitting}
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          disabled={isSubmitting}
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <Button asChild variant="ghost" className="w-full" data-testid="link-back-login">
              <Link href="/login">
                Volver al inicio de sesión
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
