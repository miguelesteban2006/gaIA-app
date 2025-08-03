import { useState, useEffect } from "react";
import { useRoute } from "wouter";
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
import { Link } from "wouter";

interface Medication {
  name: string;
  dose: string;
  schedule: string;
  notes?: string;
}

interface ElderlyUser {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  address?: string;
  healthStatus?: string;
  medicalHistory?: string;
  diagnoses?: string[];
  medications?: Medication[];
  allergies?: string[];
  sensitivities?: string[];
  mobilityStatus?: string;
  mobilityAids?: string[];
  visionStatus?: string;
  hearingStatus?: string;
  speechStatus?: string;
  emergencyContact?: string;
  careInstructions?: string;
}

export default function ElderlyUserProfile() {
  const [match, params] = useRoute("/elderly-users/:id");
  const elderlyUserId = params?.id;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ElderlyUser>>({});

  // Fetch elderly user data
  const { data: elderlyUser, isLoading } = useQuery({
    queryKey: [`/api/elderly-users/${elderlyUserId}`],
    enabled: !!elderlyUserId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ElderlyUser>) => {
      const response = await apiRequest("PUT", `/api/elderly-users/${elderlyUserId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/elderly-users/${elderlyUserId}`] });
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (elderlyUser) {
      setFormData(elderlyUser as ElderlyUser);
    }
  }, [elderlyUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addMedication = () => {
    const newMedication: Medication = { name: "", dose: "", schedule: "", notes: "" };
    setFormData(prev => ({
      ...prev,
      medications: [...(prev.medications || []), newMedication]
    }));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications?.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications?.filter((_, i) => i !== index)
    }));
  };

  const addArrayItem = (arrayName: 'diagnoses' | 'allergies' | 'sensitivities' | 'mobilityAids', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), value.trim()]
    }));
  };

  const removeArrayItem = (arrayName: 'diagnoses' | 'allergies' | 'sensitivities' | 'mobilityAids', index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName]?.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!elderlyUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
            <p className="text-gray-600 mb-4">No se pudo encontrar el perfil solicitado.</p>
            <Link href="/">
              <Button>
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
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {(elderlyUser as ElderlyUser)?.firstName} {(elderlyUser as ElderlyUser)?.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Perfil médico completo</p>
          </div>
        </div>
        
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancelar" : "Editar perfil"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellidos</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth?.split('T')[0] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="gender">Género</Label>
                <Select 
                  value={formData.gender || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phoneNumber">Teléfono</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estado de Salud */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Estado de Salud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="healthStatus">Estado General de Salud</Label>
              <Input
                id="healthStatus"
                value={formData.healthStatus || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, healthStatus: e.target.value }))}
                disabled={!isEditing}
                placeholder="Ej: Estable, Requiere supervisión..."
              />
            </div>
            <div>
              <Label htmlFor="medicalHistory">Historial Médico</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                disabled={!isEditing}
                placeholder="Antecedentes médicos relevantes..."
              />
            </div>
            
            {/* Diagnósticos */}
            <div>
              <Label>Diagnósticos Relevantes</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.diagnoses?.map((diagnosis, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {diagnosis}
                    {isEditing && (
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeArrayItem('diagnoses', index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nuevo diagnóstico"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('diagnoses', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('diagnoses', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medicaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medicaciones Actuales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.medications?.map((medication, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Medicación {index + 1}</h4>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Nombre del medicamento"
                    />
                  </div>
                  <div>
                    <Label>Dosis</Label>
                    <Input
                      value={medication.dose}
                      onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Ej: 10mg"
                    />
                  </div>
                  <div>
                    <Label>Horario</Label>
                    <Input
                      value={medication.schedule}
                      onChange={(e) => updateMedication(index, 'schedule', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Ej: Cada 8 horas"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Input
                    value={medication.notes || ""}
                    onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            ))}
            
            {isEditing && (
              <Button type="button" variant="outline" onClick={addMedication}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Medicación
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Alergias y Sensibilidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alergias y Sensibilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alergias */}
            <div>
              <Label>Alergias</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.allergies?.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center gap-1">
                    {allergy}
                    {isEditing && (
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-700"
                        onClick={() => removeArrayItem('allergies', index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva alergia"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('allergies', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('allergies', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Sensibilidades */}
            <div>
              <Label>Sensibilidades</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.sensitivities?.map((sensitivity, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {sensitivity}
                    {isEditing && (
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeArrayItem('sensitivities', index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva sensibilidad"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('sensitivities', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('sensitivities', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Movilidad y Ayudas Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Movilidad y Ayudas Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mobilityStatus">Estado de Movilidad</Label>
              <Select 
                value={formData.mobilityStatus || ""} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, mobilityStatus: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado de movilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Independiente</SelectItem>
                  <SelectItem value="limited">Limitada</SelectItem>
                  <SelectItem value="assisted">Con asistencia</SelectItem>
                  <SelectItem value="wheelchair">Silla de ruedas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ayudas Técnicas */}
            <div>
              <Label>Ayudas Técnicas</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.mobilityAids?.map((aid, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {aid}
                    {isEditing && (
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => removeArrayItem('mobilityAids', index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva ayuda técnica (andador, bastón, etc.)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('mobilityAids', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addArrayItem('mobilityAids', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Limitaciones Sensoriales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Limitaciones Sensoriales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="visionStatus">Estado de Visión</Label>
                <Select 
                  value={formData.visionStatus || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, visionStatus: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado de visión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="corrected">Corregida (gafas/lentes)</SelectItem>
                    <SelectItem value="limited">Limitada</SelectItem>
                    <SelectItem value="blind">Ceguera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hearingStatus">Estado de Audición</Label>
                <Select 
                  value={formData.hearingStatus || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hearingStatus: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado de audición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="corrected">Corregida (audífono)</SelectItem>
                    <SelectItem value="limited">Limitada</SelectItem>
                    <SelectItem value="deaf">Sordera</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="speechStatus">Estado del Habla</Label>
                <Select 
                  value={formData.speechStatus || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, speechStatus: value }))}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado del habla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="limited">Limitada</SelectItem>
                    <SelectItem value="non_verbal">No verbal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones de Cuidado */}
        <Card>
          <CardHeader>
            <CardTitle>Instrucciones de Cuidado</CardTitle>
            <CardDescription>
              Instrucciones especiales, rutinas y consideraciones importantes para el cuidado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="careInstructions">Instrucciones Especiales</Label>
              <Textarea
                id="careInstructions"
                value={formData.careInstructions || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, careInstructions: e.target.value }))}
                disabled={!isEditing}
                placeholder="Rutinas especiales, precauciones, preferencias de cuidado..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFormData(elderlyUser as ElderlyUser);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}