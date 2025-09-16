import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Brain, Users, Activity } from "lucide-react";
import { useLocation } from "wouter";

// Helpers para interpretar respuestas de listados con formas distintas
function pickList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}
function pickId(item: any): string | undefined {
  return item?.id ?? item?._id ?? item?.uuid ?? item?.ID ?? item?.Id;
}

export default function Landing() {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();

  // Limpiar tokens corruptos al abrir
  useEffect(() => {
    const token = localStorage.getItem("eldercompanion_token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) localStorage.removeItem("eldercompanion_token");
      } catch {
        localStorage.removeItem("eldercompanion_token");
      }
    }
  }, []);

  // Tras login/registro: obtener usuario y redirigir a su primer perfil
  const afterAuthRedirectFlow = async () => {
    // 1) Refrescar datos de usuario (tolerante a diferentes endpoints)
    let me: any = null;
    const authCandidates = ["/api/auth/me", "/api/auth/user"];
    for (const p of authCandidates) {
      try {
        const r = await apiRequest("GET", p);
        if (r.ok) {
          me = await r.json();
          break;
        }
      } catch {
        // sigue probando
      }
    }

    // 2) Buscar el primer adulto mayor del usuario
    let elderlyId: string | undefined;
    const listCandidates = [
      "/api/elderly-users?limit=1",
      "/api/elderly?limit=1",
      "/api/patients?limit=1",
      "/api/residents?limit=1",
      "/api/seniors?limit=1",
    ];

    for (const p of listCandidates) {
      try {
        const r = await apiRequest("GET", p);
        if (r.ok) {
          const json = await r.json();
          const list = pickList(json);
          if (list.length > 0) {
            elderlyId = pickId(list[0]);
            if (elderlyId) break;
          }
        }
      } catch {
        // sigue probando
      }
    }

    // 3) Si no existe ninguno, crear uno básico para poder entrar
    if (!elderlyId) {
      try {
        const createCandidates = [
          "/api/elderly-users",
          "/api/elderly",
          "/api/patients",
          "/api/residents",
          "/api/seniors",
        ];
        const body = {
          firstName: "Mi familiar",
          lastName: "",
        };
        for (const p of createCandidates) {
          try {
            const r = await apiRequest("POST", p, body);
            if (r.ok) {
              const json = await r.json();
              const createdId = pickId(json) ?? pickId(json?.data);
              if (createdId) {
                elderlyId = createdId;
                break;
              }
            }
          } catch {
            // intenta el siguiente
          }
        }
      } catch {
        // sin crear, seguimos
      }
    }

    // 4) Invalidar cache de auth y redirigir
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

    if (elderlyId) {
      setLocation(`/elderly-users/${elderlyId}`);
    } else {
      // Si no tenemos id (API aún sin endpoints), como fallback ve al inicio autenticado (Home)
      setLocation("/");
    }
  };

  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const response = await apiRequest("POST", endpoint, data);
      // Si la API devuelve error con cuerpo JSON, apiRequest lanzará; aquí sólo ok
      return response.json();
    },
    onSuccess: async (data: any) => {
      // Guardar token si existe (si trabajas con cookie de sesión, puede no venir)
      if (data?.token) setAuthToken(data.token);

      toast({
        title: "¡Bienvenido a GaIA!",
        description: isLogin
          ? "Has iniciado sesión correctamente"
          : "Tu cuenta ha sido creada exitosamente",
      });

      // Pequeña pausa para asegurar persistencia de auth y cookies
      setTimeout(() => {
        afterAuthRedirectFlow().catch(() => {
          // como último recurso, recarga
          window.location.reload();
        });
      }, 300);
    },
    onError: (error: any) => {
      const msg = String(error?.message || "");
      let description = "Error al procesar la solicitud";
      if (msg.includes("USER_EXISTS") || msg.includes("already") || msg.includes("EXISTS")) {
        description = "Ese usuario ya existe";
      } else if (msg.includes("FIELDS_REQUIRED") || msg.includes("400")) {
        description = "Datos incompletos o inválidos";
      } else if (msg.includes("INVALID_CREDENTIALS") || msg.includes("401")) {
        description = "Credenciales inválidas";
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data: any = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    if (!isLogin) {
      data.firstName = formData.get("firstName");
      data.lastName = formData.get("lastName");
      data.role = formData.get("role") || "family";
    }

    authMutation.mutate(data);
  };

  // === Diseño anterior conservado ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-10 h-10 fill-white">
                <ellipse cx="18" cy="12" rx="6" ry="8" transform="rotate(-15 18 12)" />
                <circle cx="14" cy="9" r="3" />
                <path d="M15 10 Q16 11 17 12" stroke="white" strokeWidth="1" fill="none" />
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

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 px-4 md:px-0">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cuidado Emocional</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Análisis de sentimientos y estado de ánimo en tiempo real
              </p>
            </div>
            <div className="text-center">
              <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Monitoreo de Salud</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Seguimiento continuo de indicadores vitales y bienestar
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Red de Apoyo</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Conecta familias, médicos y cuidadores en una sola plataforma
              </p>
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
                {isLogin
                  ? "Accede a tu panel de monitoreo GaIA"
                  : "Únete a la red de cuidado inteligente"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          placeholder="Nombre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          placeholder="Apellido"
                        />
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
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-mobile"
                  disabled={authMutation.isPending}
                >
                  {authMutation.isPending
                    ? "Procesando..."
                    : isLogin
                    ? "Iniciar Sesión"
                    : "Crear Cuenta"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:underline"
                >
                  {isLogin
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
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
