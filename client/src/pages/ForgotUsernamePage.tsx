import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

const forgotUsernameSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotUsernameFormValues = z.infer<typeof forgotUsernameSchema>;

export default function ForgotUsernamePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotUsernameFormValues>({
    resolver: zodResolver(forgotUsernameSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotUsernameFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/request-username-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al solicitar recordatorio");
      }

      setEmailSent(true);
      toast({
        title: "Solicitud enviada",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar su solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" data-testid="icon-success" />
            </div>
            <CardTitle>Revise su correo electrónico</CardTitle>
            <CardDescription>
              Si encontramos información válida, enviaremos un mensaje a su correo registrado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>📧 Revise su bandeja de entrada (y carpeta de spam)</p>
              <p>🔒 Su usuario será enviado de forma segura</p>
              <p>❓ Si no recibe el correo, verifique que el email sea correcto</p>
            </div>
            <Button asChild className="w-full" data-testid="button-back-login">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
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
          <CardTitle data-testid="heading-forgot-username">Recuperar Usuario</CardTitle>
          <CardDescription>
            Ingrese el email de su cuenta y le enviaremos su nombre de usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="tu@email.com"
                          className="pl-10"
                          disabled={isSubmitting}
                          data-testid="input-email"
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
                {isSubmitting ? "Enviando..." : "Enviar recordatorio de usuario"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-3">
            <Button asChild variant="ghost" className="w-full" data-testid="link-back-login">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Link>
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              ¿Olvidó su contraseña?{" "}
              <Link href="/forgot-password" className="text-primary hover:underline" data-testid="link-forgot-password">
                Recuperar contraseña
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
