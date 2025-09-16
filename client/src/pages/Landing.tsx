import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Brain, Users, Activity } from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();

  // Limpiar tokens corruptos al cargar
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

  // ——— NUEVO: helper para, tras login/registro, ir al panel correcto ———
  const goToUserPanel = async () => {
    try {
      // 1) Intentar obtener el usuario autenticado (si existe el endpoint)
      let me: any = null;
      for (const path of ["/api/auth/me", "/api/auth/user"]) {
        try {
          const r = await apiRequest("GET", path);
          if (r.ok) {
            me = await r.json();
            break;
          }
        } catch {
          /* sigue probando */
        }
      }

      // 2) Buscar el primer perfil de adulto mayor del usuario (probando endpoints conocidos)
      const candidates = [
        "/api/elderly-users?limit=1",
        "/api/elderly?limit=1",
        "/api/patients?limit=1",
        "/api/residents?limit=1",
        "/api/seniors?limit=1",
      ];

      let firstId: string | null = null;

      for (const path of candidates) {
        try {
          const r = await apiRequest("GET", path);
          if (!r.ok) continue;
          const json = await r.json();

          // Aceptamos varios formatos (array o objeto con data)
          const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
          if (list.length > 0) {
            const item = list[0];
            // Intenta mapear posibles nombres de campo para ID
            firstId =
              item?.id ?? item?._id ?? item?.elderlyId ?? item?.uuid ?? null;
            if (firstId) break;
          }
        } catch {
          // sigue probando
        }
      }

      // 3) Redirigir
      if (firstId) {
        setLocation(`/elderly-users/${firstId}`);
      } else {
        // Si no hay perfiles aún, ve al Home (desde ahí el usuario crea uno)
        setLocation("/");
      }
    } catch {
      // Fallback
      setLocation("/");
    }
  };

  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const response = await apiRequest("POST", endpoint, data);
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        // Lanzamos error con el texto del backend para parsearlo abajo
        throw new Error(`${response.status}:${txt}`);
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Guardar token para siguientes peticiones
      if (data?.token) setAuthToken(data.token);

      // Refrescar caché de usuario
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "¡Bienvenido a GaIA!",
        description: isLogin
          ? "Has iniciado sesión correctamente"
          : "Tu cuenta ha sido creada exitosamente",
      });

      // ——— NUEVO: ir directo al panel del primer perfil ———
      await goToUserPanel();
    },
    onError: (error: Error) => {
      const msg = error.message || "";
      // Mensajes más claros según backend
      if (msg.startsWith("401:")) {
        return toast({
          title: "Credenciales inválidas",
          description: "Revisa tu email y contraseña.",
          variant: "destructive",
        });
      }
      if (msg.includes("FIELDS_REQUIRED") || msg.startsWith("400:")) {
        return toast({
          title: "Datos incompletos o usuario existente",
          description: "Revisa los campos. Si es registro, puede que el email ya exista.",
          variant: "destructive",
        });
      }
      if (msg.startsWith("409:")) {
        return toast({
          title: "El usuario ya existe",
          description: "Prueba con otro correo o inicia sesión.",
          variant: "destructive",
        });
      }
      toast({
        title: "Error",
        description: "Error al procesar la solicitud",
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
                    : (isLogin ? "Iniciar Sesión" : "Crear Cuenta")}
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
