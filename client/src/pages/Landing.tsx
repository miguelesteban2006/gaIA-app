import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiJson, apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Brain, Users, Activity } from "lucide-react";
import { useLocation } from "wouter";

// Candidatos de endpoints (si tu backend tiene otros, añade aquí)
const AUTH_USER_CANDIDATES = [
  "/api/auth/user",
  "/api/auth/me",
  "/api/me",
  "/api/users/me",
  "/api/auth/profile",
];

const ELDERLY_LIST_CANDIDATES = [
  "/api/elderly-users?limit=1",
  "/api/elderly?limit=1",
  "/api/patients?limit=1",
  "/api/residents?limit=1",
  "/api/seniors?limit=1",
];

async function probeFirstOkEndpoint(candidates: string) {
  // overload signature guard
  return null as never;
}

async function probeFirstOkEndpoint(
  candidates: string[]
): Promise<{ url: string; json: any } | null> {
  for (const url of candidates) {
    try {
      const res = await apiRequest("GET", url);
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      return { url, json };
    } catch (e: any) {
      // ignoramos 404/401/etc. y probamos el siguiente
      continue;
    }
  }
  return null;
}

function pickFirstIdFromListPayload(payload: any) {
  const list =
    (Array.isArray(payload) && payload) ||
    payload?.items ||
    payload?.results ||
    payload?.elderlyUsers ||
    payload?.data ||
    [];

  const first = Array.isArray(list) ? list[0] : undefined;
  return first?.id ?? first?._id ?? first?.uuid ?? null;
}

export default function Landing() {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();

  // Limpia tokens con formato inválido al cargar
  useEffect(() => {
    const KEY = "eldercompanion_token";
    const t = localStorage.getItem(KEY);
    if (t) {
      try {
        const parts = t.split(".");
        if (parts.length !== 3) localStorage.removeItem(KEY);
      } catch {
        localStorage.removeItem(KEY);
      }
    }
  }, []);

  // Decide a dónde ir: primer perfil si existe, si no al panel general
  async function redirectAfterAuth() {
    // Primero probamos la lista de adultos con autodetección
    const probe = await probeFirstOkEndpoint(ELDERLY_LIST_CANDIDATES);

    if (probe?.json) {
      const id = pickFirstIdFromListPayload(probe.json);
      if (id) {
        setLocation(`/elderly-users/${id}`);
        return;
      }
    }
    // Si no hay perfiles o no encontramos endpoint, vamos al panel general
    setLocation("/");
  }

  // Mutación de login/registro con soporte "token o cookie"
  const authMutation = useMutation({
    mutationFn: async (payload: any) => {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      return apiJson<{ ok?: boolean; token?: string; error?: string }>(
        "POST",
        endpoint,
        payload
      );
    },
    onSuccess: async (data) => {
      // Guarda token si viene en la respuesta (si no, puede ser sesión por cookie)
      if (data?.token) setAuthToken(data.token);

      // Limpia caché de React Query
      queryClient.clear();

      // Valida sesión (autodetectando endpoint de "usuario actual")
      try {
        await probeFirstOkEndpoint(AUTH_USER_CANDIDATES);
      } catch {
        // si falla, seguimos igualmente (puede ser cookie aún sin validar)
      }

      toast({
        title: "¡Bienvenido a GaIA!",
        description: isLogin
          ? "Has iniciado sesión correctamente"
          : "Tu cuenta ha sido creada exitosamente",
      });

      await redirectAfterAuth();
    },
    onError: (err: any) => {
      const msg = String(err?.message || "").toUpperCase();
      let human = "Error al procesar la solicitud";

      if (msg.includes("INVALID_CREDENTIALS") || msg.includes("401")) {
        human = "Credenciales inválidas";
      } else if (msg.includes("USER_EXISTS") || msg.includes("ALREADY") || msg.includes("409")) {
        human = "Ese email ya está registrado";
      } else if (msg.includes("FIELDS_REQUIRED") || msg.includes("400")) {
        human = "Faltan datos o hay datos inválidos";
      } else if (msg.includes("TIMEOUT")) {
        human = "El servidor tardó demasiado en responder";
      } else if (msg.includes("NOT FOUND") || msg.includes("404")) {
        human = "Ruta no encontrada en el servidor";
      }

      toast({
        title: "No se pudo completar",
        description: human,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const payload: any = {
      email: form.get("email"),
      password: form.get("password"),
    };

    if (!isLogin) {
      payload.firstName = form.get("firstName");
      payload.lastName = form.get("lastName");
      payload.role = form.get("role") || "family";
    }

    authMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-10 h-10 fill-white">
                <ellipse cx="18" cy="12" rx="6" ry="8" transform="rotate(-15 18 12)"/>
                <circle cx="14" cy="9" r="3"/>
                <path d="M15 10 Q16 11 17 12" stroke="white" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              GaIA
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Sistema inteligente de monitoreo y cuidado para adultos mayores. 
            Conectando familias, profesionales médicos y asistentes robóticos para un cuidado integral.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 px-4 md:px-0">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cuidado Emocional</h3>
              <p className="text-gray-600 dark:text-gray-400">Análisis de sentimientos y estado de ánimo en tiempo real</p>
            </div>
            <div className="text-center">
              <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Monitoreo de Salud</h3>
              <p className="text-gray-600 dark:text-gray-400">Seguimiento continuo de indicadores vitales y bienestar</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Red de Apoyo</h3>
              <p className="text-gray-600 dark:text-gray-400">Conecta familias, médicos y cuidadores en una sola plataforma</p>
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin ? "Accede a tu panel de monitoreo GaIA" : "Únete a la red de cuidado inteligente"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" name="firstName" type="text" required placeholder="Nombre" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" name="lastName" type="text" required placeholder="Apellido" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="role">Rol</Label>
                      <select
                        id="role"
                        name="role"
                        className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700"
                        defaultValue="family"
                      >
                        <option value="family">Familiar</option>
                        <option value="medical">Profesional Médico</option>
                        <option value="caregiver">Cuidador</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required placeholder="••••••••" />
                </div>

                <Button type="submit" className="w-full" disabled={authMutation.isPending}>
                  {authMutation.isPending ? "Procesando..." : (isLogin ? "Iniciar Sesión" : "Crear Cuenta")}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
                >
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Inteligencia Artificial Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Algoritmos de IA especializados en análisis de comportamiento y detección temprana 
                de cambios en el estado de salud y bienestar emocional.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Seguridad y Privacidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Todos los datos están protegidos con los más altos estándares de seguridad. 
                Control total sobre quién puede acceder a la información del adulto mayor.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
