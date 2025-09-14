import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setAuthToken, clearAuthData } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Brain, Users, Bot, Activity } from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);

  // Limpiar cualquier token inválido al cargar la página de login
  useEffect(() => {
    // Verificar si hay un token inválido y limpiarlo si es necesario
    try {
      const token = localStorage.getItem("gaia_token");
      if (token && token.length < 10) {
        clearAuthData();
      }
    } catch {
      // Ignorar errores de acceso a localStorage
      clearAuthData();
    }
  }, []);
  
  const authMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "¡Bienvenido a GaIA!",
        description: isLogin ? "Has iniciado sesión correctamente" : "Tu cuenta ha sido creada exitosamente",
      });
      // Redirigir al interior de la app tras login/registro
      navigate('/home', { replace: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("400") 
          ? "El usuario ya existe o los datos son incorrectos" 
          : "Error al procesar la solicitud",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      email: formData.email,
      password: formData.password,
    };
    if (!isLogin) {
      payload.name = formData.name;
    }
    authMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/40 to-blue-100/40 dark:from-purple-900/20 dark:to-blue-900/20" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200 mb-6">
                <Bot className="h-4 w-4" />
                <span className="text-sm">Asistente IA para cuidado de mayores</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Cuida y acompaña a tus seres queridos con <span className="text-purple-600">GaIA</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Monitoreo de salud, recordatorios inteligentes y comunicación segura, todo en una sola aplicación.
              </p>

              <div className="flex items-center gap-4">
                <Link href="#auth">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                    Empezar ahora
                  </Button>
                </Link>
                <Link href="/home">
                  <Button variant="outline" size="lg">
                    Ver demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-purple-200/40 via-blue-200/40 to-teal-200/40 blur-2xl rounded-3xl" />
              <div className="relative bg-white dark:bg-gray-900 border rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-2 w-2 bg-red-400 rounded-full" />
                  <div className="h-2 w-2 bg-yellow-400 rounded-full" />
                  <div className="h-2 w-2 bg-green-400 rounded-full" />
                </div>
                <img
                  src="/screenshots/gaia-dashboard.png"
                  alt="GaIA Dashboard preview"
                  className="rounded-lg border"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Auth */}
      <div id="auth" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{isLogin ? "Iniciar sesión" : "Crear cuenta"}</CardTitle>
              <CardDescription>
                {isLogin
                  ? "Accede a tu panel de control y gestiona el cuidado de tus mayores"
                  : "Crea tu cuenta para empezar a usar GaIA"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nombre y apellidos"
                      value={formData.name}
                      onChange={handleChange}
                      required={!isLogin}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={authMutation.isPending}
                >
                  {authMutation.isPending
                    ? (isLogin ? "Entrando…" : "Creando cuenta…")
                    : (isLogin ? "Entrar" : "Crear cuenta")}
                </Button>

                <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {isLogin ? (
                    <>
                      ¿No tienes cuenta?{" "}
                      <button
                        type="button"
                        className="text-purple-600 hover:underline"
                        onClick={() => setIsLogin(false)}
                      >
                        Regístrate
                      </button>
                    </>
                  ) : (
                    <>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        className="text-purple-600 hover:underline"
                        onClick={() => setIsLogin(true)}
                      >
                        Inicia sesión
                      </button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

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
                Seguimiento continuo de indicadores vitales y bienestar general
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seguridad</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Todos los datos están protegidos con los más altos estándares de seguridad. 
                Control total sobre quién puede acceder a la información del adulto mayor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
