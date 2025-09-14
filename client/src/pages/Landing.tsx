import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Heart, Activity, Users } from "lucide-react";

const AFTER_LOGIN_ROUTE = "/elderly";

export default function Landing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      // Importante: apiRequest ya debe incluir credentials:'include' internamente
      const res = await apiRequest("POST", "/api/login", body);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || "INVALID_CREDENTIALS";
        throw new Error(msg);
      }
      return data; // { ok:true, user:{...} }
    },
    onSuccess: () => {
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente.",
      });
      // ✅ Redirige al panel de perfiles
      navigate(AFTER_LOGIN_ROUTE, { replace: true });
    },
    onError: (err: any) => {
      const msg =
        err?.message === "INVALID_CREDENTIALS"
          ? "Credenciales inválidas"
          : "Error al procesar la solicitud";
      toast({ title: "No se pudo iniciar sesión", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Encabezado centrado con logo, como antes */}
      <header className="container mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <img src="/icons/gaia-512.png" alt="GaIA" className="h-10 w-10 rounded-full" />
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-purple-600">GaIA</span>
          </h1>
        </div>
        <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
          Sistema inteligente de monitoreo y cuidado para adultos mayores. Conectando familias,
          profesionales médicos y asistentes robóticos para un cuidado integral.
        </p>
      </header>

      {/* Beneficios (3 columnas) + Card de Login como en tu diseño anterior */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Columna izquierda: 3 beneficios */}
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <Heart className="h-10 w-10 text-rose-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Cuidado Emocional</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Análisis de sentimientos y estado de ánimo en tiempo real
              </p>
            </div>

            <div className="text-center">
              <Activity className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Monitoreo de Salud</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seguimiento continuo de indicadores vitales y bienestar
              </p>
            </div>

            <div className="text-center">
              <Users className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Red de Apoyo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conecta familias, médicos y cuidadores en una sola plataforma
              </p>
            </div>
          </div>

          {/* Columna derecha: formulario de inicio de sesión */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu panel de monitoreo GaIA</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando…" : "Iniciar Sesión"}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  ¿No tienes cuenta? <span className="text-purple-600">Regístrate</span>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
