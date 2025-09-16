import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Save, Edit, User, Heart, Pill, AlertTriangle, Eye, Accessibility } from "lucide-react";

interface Medication {
  name: string;
  dose: string;
  schedule: string;
  notes?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface HealthInfo {
  bloodType?: string;
  chronicDiseases?: string[];
  allergies?: string[];
  medications?: Medication[];
  disabilities?: string[];
  mobilityLevel?: "independent" | "assisted" | "dependent";
  fallRisk?: "low" | "medium" | "high";
  careNotes?: string;
}

interface ElderlyUser {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  age?: number;
  gender?: "male" | "female" | "other";
  photoUrl?: string;
  conditions?: string[];
  medications?: Medication[];
  emergencyContact?: EmergencyContact;
  healthInfo?: HealthInfo;
  diagnoses?: string[];
  allergies?: string[];
  sensitivities?: string[];
  mobilityAids?: string[];
}

export default function ElderlyUserProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/elderly-users/:id");
  const elderlyUserId = params?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [resourceBase, setResourceBase] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ElderlyUser>>({});

  useEffect(() => {
    // si no hay id en la ruta, volvemos al listado
    if (!match || !elderlyUserId) {
      setLocation("/");
    }
  }, [match, elderlyUserId, setLocation]);

  const { data: elderlyUser, isLoading } = useQuery({
    queryKey: ["elderly-user", elderlyUserId],
    enabled: !!elderlyUserId,
    queryFn: async () => {
      const id = elderlyUserId as string;
      const candidates = [
        `/api/elderly-users/${id}`,
        `/api/elderly/${id}`,
        `/api/patients/${id}`,
        `/api/residents/${id}`,
        `/api/seniors/${id}`,
      ];
      for (const path of candidates) {
        try {
          const res = await apiRequest("GET", path);
          if (res.ok) {
            const json = await res.json();
            const base = path.replace(`/${id}`, "");
            setResourceBase(base);
            return json;
          }
        } catch {
          // probar siguiente
        }
      }
      throw new Error("NOT_FOUND");
    },
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ElderlyUser>) => {
      const base = resourceBase || "/api/elderly-users";
      const response = await apiRequest("PUT", `${base}/${elderlyUserId}`, data);
      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        throw new Error(msg || "No se pudo guardar");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elderly-user", elderlyUserId] });
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (elderlyUser) setFormData(elderlyUser as ElderlyUser);
  }, [elderlyUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addMedication = () => {
    const newMedication: Medication = { name: "", dose: "", schedule: "", notes: "" };
    setFormData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), newMedication],
    }));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setFormData(prev => {
      const meds = [...(prev.medications || [])];
      meds[index] = { ...meds[index], [field]: value };
      return { ...prev, medications: meds };
    });
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications?.filter((_, i) => i !== index),
    }));
  };

  const addArrayItem = (
    arrayName: "diagnoses" | "allergies" | "sensitivities" | "mobilityAids",
    value: string
  ) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), value.trim()],
    }));
  };

  const removeArrayItem = (
    arrayName: "diagnoses" | "allergies" | "sensitivities" | "mobilityAids",
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName]?.filter((_, i) => i !== index),
    }));
  };

  // ======= UI =======
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/4 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-100 rounded" />
            <div className="h-40 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!elderlyUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil no encontrado</CardTitle>
            <CardDescription>El perfil solicitado no existe o no se pudo cargar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {elderlyUser.firstName?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              {elderlyUser.firstName} {elderlyUser.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {elderlyUser.age ? `${elderlyUser.age} años` : "Edad no indicada"}
              {elderlyUser.gender ? ` • ${elderlyUser.gender === "male" ? "Hombre" : elderlyUser.gender === "female" ? "Mujer" : "Otro"}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          )}
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información básica</CardTitle>
          <CardDescription>Datos generales del adulto mayor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.firstName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Apellidos</Label>
              <Input
                value={formData.lastName || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Edad</Label>
              <Input
                type="number"
                min={0}
                value={formData.age ?? ""}
                onChange={(e) => setFormData(prev => ({ ...prev, age: Number(e.target.value) || undefined }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Género</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val as ElderlyUser["gender"] }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Foto (URL)</Label>
              <Input
                value={formData.photoUrl || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de salud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Estado de salud
          </CardTitle>
          <CardDescription>Condiciones, alergias y diagnósticos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnósticos */}
          <div>
            <Label>Diagnósticos</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Añadir diagnóstico"
                disabled={!isEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value;
                    addArrayItem("diagnoses", value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.diagnoses || []).map((d, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {d}
                  {isEditing && (
                    <button onClick={() => removeArrayItem("diagnoses", i)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Alergias */}
          <div>
            <Label>Alergias</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Añadir alergia"
                disabled={!isEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value;
                    addArrayItem("allergies", value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.allergies || []).map((a, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {a}
                  {isEditing && (
                    <button onClick={() => removeArrayItem("allergies", i)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Limitaciones sensoriales */}
          <div>
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Limitaciones sensoriales
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Añadir limitación sensorial"
                disabled={!isEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value;
                    addArrayItem("sensitivities", value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.sensitivities || []).map((s, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {s}
                  {isEditing && (
                    <button onClick={() => removeArrayItem("sensitivities", i)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ayudas de movilidad */}
          <div>
            <Label className="flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-green-600" />
              Ayudas de movilidad
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Añadir ayuda de movilidad"
                disabled={!isEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value;
                    addArrayItem("mobilityAids", value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.mobilityAids || []).map((m, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {m}
                  {isEditing && (
                    <button onClick={() => removeArrayItem("mobilityAids", i)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            Medicación
          </CardTitle>
          <CardDescription>Tratamientos y dosis actuales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.medications || []).map((med, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={med.name}
                  onChange={(e) => updateMedication(idx, "name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Dosis</Label>
                <Input
                  value={med.dose}
                  onChange={(e) => updateMedication(idx, "dose", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Horario</Label>
                <Input
                  value={med.schedule}
                  onChange={(e) => updateMedication(idx, "schedule", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMedication(idx)}
                  disabled={!isEditing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Quitar
                </Button>
              </div>
              <div className="md:col-span-4">
                <Label>Notas</Label>
                <Textarea
                  value={med.notes || ""}
                  onChange={(e) => updateMedication(idx, "notes", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          ))}

          {isEditing && (
            <Button type="button" variant="secondary" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir medicación
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contacto de emergencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Contacto de emergencia
          </CardTitle>
          <CardDescription>Persona de contacto en caso de emergencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.emergencyContact?.name || ""}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...(prev.emergencyContact || { relationship: "", phone: "" }), name: e.target.value },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Relación</Label>
              <Input
                value={formData.emergencyContact?.relationship || ""}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...(prev.emergencyContact || { name: "", phone: "" }), relationship: e.target.value },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.emergencyContact?.phone || ""}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...(prev.emergencyContact || { name: "", relationship: "" }), phone: e.target.value },
                  }))
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
