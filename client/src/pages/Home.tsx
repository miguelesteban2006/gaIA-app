import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Heart, 
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Settings,
  Bell,
  Brain,
  Shield,
  Bot,
  BarChart3,
  MessageSquare,
  CheckCircle,
  XCircle,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { ElderlyUser, HealthAlert } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedElderlyUser, setSelectedElderlyUser] = useState<ElderlyUser | null>(null);
  const [isAddElderlyDialogOpen, setIsAddElderlyDialogOpen] = useState(false);

  const { data: elderlyUsers = [], isLoading: isLoadingElderlyUsers } = useQuery({
    queryKey: ["/api/elderly-users"],
    enabled: isAuthenticated,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: [`/api/elderly-users/${selectedElderlyUser?.id}/alerts`],
    enabled: !!selectedElderlyUser,
  });

  const { data: stats = { totalInteractions: 0, avgMoodScore: 0, avgSentiment: 0, totalDuration: 0, alertsCount: 0 } } = useQuery({
    queryKey: [`/api/elderly-users/${selectedElderlyUser?.id}/stats`],
    enabled: !!selectedElderlyUser,
  });

  const { data: sentimentData = [] } = useQuery({
    queryKey: [`/api/elderly-users/${selectedElderlyUser?.id}/sentiment-data`],
    enabled: !!selectedElderlyUser,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: [`/api/elderly-users/${selectedElderlyUser?.id}/interactions`],
    enabled: !!selectedElderlyUser,
  });

  const addElderlyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/elderly-users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elderly-users"] });
      setIsAddElderlyDialogOpen(false);
      toast({
        title: "Adulto mayor agregado",
        description: "Se ha creado el perfil exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el perfil",
        variant: "destructive",
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await apiRequest("PATCH", `/api/alerts/${alertId}/resolve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/elderly-users", selectedElderlyUser?.id, "alerts"] });
      toast({
        title: "Alerta resuelta",
        description: "La alerta ha sido marcada como resuelta",
      });
    },
  });

  const handleAddElderly = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dateOfBirth: formData.get("dateOfBirth"),
      medicalConditions: formData.get("medicalConditions"),
      emergencyContact: formData.get("emergencyContact"),
    };

    addElderlyMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Cargando ElderCompanion...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              GaIA
            </h1>
            <Badge variant="secondary" className="ml-2 sm:ml-3 text-xs hidden sm:inline-flex">
              {(user as any)?.role === 'family' ? 'Familiar' : (user as any)?.role === 'medical' ? 'Médico' : 'Cuidador'}
            </Badge>
          </div>
          
          <div className="flex items-center">
            <div className="text-xs hidden lg:block mr-3">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {(user as any)?.firstName}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="text-xs px-3 py-2">
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Elderly Users Selection */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Panel de Monitoreo
              </h2>

            </div>
            <Dialog open={isAddElderlyDialogOpen} onOpenChange={setIsAddElderlyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agregar Adulto Mayor</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[85vh] overflow-y-auto p-4">
                <DialogHeader className="pb-4">
                  <DialogTitle className="text-lg">Nuevo Perfil</DialogTitle>
                  <DialogDescription className="text-sm">
                    Agrega un adulto mayor al sistema
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddElderly} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm">Nombre</Label>
                      <Input id="firstName" name="firstName" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm">Apellido</Label>
                      <Input id="lastName" name="lastName" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm">Fecha de Nacimiento</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="medicalConditions" className="text-sm">Condiciones Médicas</Label>
                      <Input id="medicalConditions" name="medicalConditions" placeholder="Diabetes, etc." className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact" className="text-sm">Contacto de Emergencia</Label>
                      <Input id="emergencyContact" name="emergencyContact" placeholder="Teléfono" className="mt-1" />
                    </div>
                  </div>
                  <Button type="submit" disabled={addElderlyMutation.isPending} className="w-full mt-6">
                    {addElderlyMutation.isPending ? "Creando..." : "Crear Perfil"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Elderly Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {Array.isArray(elderlyUsers) ? elderlyUsers.map((elderlyUser: ElderlyUser) => (
              <Card 
                key={elderlyUser.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedElderlyUser?.id === elderlyUser.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedElderlyUser(elderlyUser)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link href={`/elderly-users/${elderlyUser.id}`}>
                      <CardTitle className="text-lg hover:text-purple-600 cursor-pointer transition-colors">
                        {elderlyUser.firstName} {elderlyUser.lastName}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-500">Activo</span>
                    </div>
                  </div>
                  <CardDescription>
                    {elderlyUser.medicalConditions || "Sin condiciones registradas"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Última interacción:</span>
                    <span className="font-medium">Hace 2 horas</span>
                  </div>
                </CardContent>
              </Card>
            )) : null}
          </div>
        </div>

        {selectedElderlyUser ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
              <Card className="p-3 lg:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Interacciones
                  </CardTitle>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-lg sm:text-2xl font-bold">{(stats as any)?.totalInteractions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 desde ayer
                  </p>
                </CardContent>
              </Card>
              
              <Card className="p-3 lg:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Ánimo
                  </CardTitle>
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-lg sm:text-2xl font-bold">{(stats as any)?.avgMoodScore || '--'}/10</div>
                  <p className="text-xs text-muted-foreground">
                    Promedio
                  </p>
                </CardContent>
              </Card>
              
              <Card className="p-3 lg:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Alertas
                  </CardTitle>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{(stats as any)?.alertsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Activas
                  </p>
                </CardContent>
              </Card>
              
              <Card className="p-3 lg:p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Tiempo
                  </CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <div className="text-lg sm:text-2xl font-bold">{Math.round(((stats as any)?.totalDuration || 0) / 60)}min</div>
                  <p className="text-xs text-muted-foreground">
                    Total hoy
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
              {/* Sentiment Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolución del Estado de Ánimo</CardTitle>
                  <CardDescription>Últimos 30 días</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={(sentimentData as any) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis domain={[0, 10]} fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Estado de Ánimo"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="Sentimiento"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Health Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertas de Salud</CardTitle>
                  <CardDescription>Notificaciones recientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {Array.isArray(alerts) ? alerts.map((alert: HealthAlert) => (
                      <div key={alert.id} className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                              {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(alert.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                        </div>
                        {alert.isResolved === "false" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )) : null}
                    {(!Array.isArray(alerts) || alerts.length === 0) && (
                      <p className="text-center text-gray-500 py-8">No hay alertas recientes</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Interactions */}
            <Card>
              <CardHeader>
                <CardTitle>Interacciones Recientes</CardTitle>
                <CardDescription>Historial de conversaciones con el robot ElderCompanion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(interactions) ? interactions.map((interaction: any) => (
                    <div key={interaction.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{interaction.interactionType}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(interaction.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {interaction.moodScore && (
                            <Badge variant={interaction.moodScore >= 7 ? 'default' : interaction.moodScore >= 4 ? 'secondary' : 'destructive'}>
                              Ánimo: {interaction.moodScore}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                      {interaction.transcription && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Usuario:</strong> "{interaction.transcription}"
                        </p>
                      )}
                      {interaction.robotResponse && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>ElderCompanion:</strong> "{interaction.robotResponse}"
                        </p>
                      )}
                      {interaction.notes && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Notas:</strong> {interaction.notes}
                        </p>
                      )}
                    </div>
                  )) : null}
                  {(!Array.isArray(interactions) || interactions.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No hay interacciones registradas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Selecciona un Adulto Mayor
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                Elige un perfil de adulto mayor para ver su información de monitoreo, 
                interacciones con el robot GaIA y alertas de salud.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}