"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import TimePicker from "@/components/time-picker";
import AudioRecorder from "@/components/audio-recorder";
import FormBackground from "@/components/form-background";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormData = {
  tuNombre: string;
  nombreEvento: string;
  descripcion: string;
  audioBlob: Blob | null;
  limiteTotal: number;
  anfitriones: string; // Lista separada por comas
  fecha: string;
  hora: string;
  lugar: string;
  agregarOpciones: boolean;
  opcionesTraer: string[]; // Chips predefinidos + personalizados
  opcionPersonalizada: string;
};

const OPCIONES_PREDEFINIDAS = ["Postres", "Piñatas", "Botana", "Bebidas", "Dulces", "Fruta"];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    tuNombre: "",
    nombreEvento: "",
    descripcion: "",
    audioBlob: null,
    limiteTotal: 20,
    anfitriones: "",
    fecha: new Date().toISOString().split('T')[0],
    hora: "",
    lugar: "",
    agregarOpciones: false,
    opcionesTraer: [],
    opcionPersonalizada: "",
  });
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [ownerNip, setOwnerNip] = useState<string>("");

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleOpcionPredefinida = (opcion: string) => {
    setFormData((prev) => {
      const opciones = prev.opcionesTraer.includes(opcion)
        ? prev.opcionesTraer.filter((o) => o !== opcion)
        : [...prev.opcionesTraer, opcion];
      return { ...prev, opcionesTraer: opciones };
    });
  };

  const agregarOpcionPersonalizada = () => {
    if (formData.opcionPersonalizada.trim()) {
      updateFormData("opcionesTraer", [
        ...formData.opcionesTraer,
        formData.opcionPersonalizada.trim(),
      ]);
      updateFormData("opcionPersonalizada", "");
    }
  };

  const removerOpcion = (opcion: string) => {
    updateFormData(
      "opcionesTraer",
      formData.opcionesTraer.filter((o) => o !== opcion)
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.tuNombre.trim() && formData.nombreEvento.trim();
      case 2:
        return formData.limiteTotal > 0;
      case 3:
        return formData.fecha && formData.hora && formData.lugar.trim();
      case 4:
        return true; // Opcional
      case 5:
        return true; // Preview
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step === 5) {
      // Generar eventId y NIP (solo UI, sin BD)
      const newEventId = `sun-${Math.random().toString(36).substring(2, 11)}`;
      const nip = Math.floor(1000 + Math.random() * 9000).toString();
      setEventId(newEventId);
      setOwnerNip(nip);
      // Guardar en cookie que es owner
      document.cookie = `destello_owner_${newEventId}=${nip}; path=/; max-age=31536000`;
    }
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <FormBackground />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            ← Volver
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Crear Evento
          </h1>
          <p className="text-white/60 mt-2">Paso {step} de 5</p>
        </div>

        {/* Steps */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {/* Step 1: Detalles del evento */}
            {step === 1 && (
              <motion.div
                key={1}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Detalles del evento</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tuNombre">Tu nombre</Label>
                    <Input
                      id="tuNombre"
                      value={formData.tuNombre}
                      onChange={(e) => updateFormData("tuNombre", e.target.value)}
                      placeholder="¿Cómo te llamas?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreEvento">Nombre del Evento</Label>
                    <Input
                      id="nombreEvento"
                      value={formData.nombreEvento}
                      onChange={(e) => updateFormData("nombreEvento", e.target.value)}
                      placeholder="Ej: Fiesta de cumpleaños"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción (opcional)</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => updateFormData("descripcion", e.target.value)}
                      placeholder="Cuéntanos sobre tu evento..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje de audio (opcional)</Label>
                    <AudioRecorder
                      onRecordingComplete={(blob) => updateFormData("audioBlob", blob)}
                      onDelete={() => updateFormData("audioBlob", null)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Invitados */}
            {step === 2 && (
              <motion.div
                key={2}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Invitados</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="limiteTotal">Límite total de invitados</Label>
                      <span className="text-2xl font-bold text-purple-300">
                        {formData.limiteTotal}
                      </span>
                    </div>
                    <Input
                      id="limiteTotal"
                      type="number"
                      min="1"
                      value={formData.limiteTotal}
                      onChange={(e) =>
                        updateFormData("limiteTotal", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anfitriones">Anfitriones (opcional)</Label>
                    <Textarea
                      id="anfitriones"
                      value={formData.anfitriones}
                      onChange={(e) => updateFormData("anfitriones", e.target.value)}
                      placeholder="Separa los nombres por comas. Ej: Juan, María, Pedro"
                      rows={3}
                    />
                    <p className="text-xs text-white/50">
                      Los anfitriones pueden invitar a sus propios invitados
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Coordenadas */}
            {step === 3 && (
              <motion.div
                key={3}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Coordenadas</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => updateFormData("fecha", e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <TimePicker
                        value={formData.hora}
                        onChange={(value) => updateFormData("hora", value)}
                        label="Hora"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lugar">Lugar</Label>
                    <Input
                      id="lugar"
                      value={formData.lugar}
                      onChange={(e) => updateFormData("lugar", e.target.value)}
                      placeholder="Dirección o lugar del evento"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Más detalles */}
            {step === 4 && (
              <motion.div
                key={4}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Más detalles</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>¿Agregar opciones para que tus invitados puedan participar llevando algo a tu evento?</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={formData.agregarOpciones ? "default" : "outline"}
                        onClick={() => updateFormData("agregarOpciones", true)}
                        className="flex-1"
                      >
                        Sí
                      </Button>
                      <Button
                        type="button"
                        variant={!formData.agregarOpciones ? "default" : "outline"}
                        onClick={() => updateFormData("agregarOpciones", false)}
                        className="flex-1"
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {formData.agregarOpciones && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <Label>Opciones predefinidas</Label>
                      <div className="flex flex-wrap gap-2">
                        {OPCIONES_PREDEFINIDAS.map((opcion) => (
                          <button
                            key={opcion}
                            type="button"
                            onClick={() => toggleOpcionPredefinida(opcion)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              formData.opcionesTraer.includes(opcion)
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            {opcion}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opcionPersonalizada">Agregar opción personalizada</Label>
                        <div className="flex gap-2">
                          <Input
                            id="opcionPersonalizada"
                            value={formData.opcionPersonalizada}
                            onChange={(e) =>
                              updateFormData("opcionPersonalizada", e.target.value)
                            }
                            onKeyPress={(e) => e.key === "Enter" && agregarOpcionPersonalizada()}
                            placeholder="Escribe una opción..."
                          />
                          <Button
                            type="button"
                            onClick={agregarOpcionPersonalizada}
                            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      {formData.opcionesTraer.length > 0 && (
                        <div className="space-y-2">
                          <Label>Opciones seleccionadas</Label>
                          <div className="flex flex-wrap gap-2">
                            {formData.opcionesTraer.map((opcion, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-sm flex items-center gap-2 text-purple-200"
                              >
                                {opcion}
                                <button
                                  type="button"
                                  onClick={() => removerOpcion(opcion)}
                                  className="hover:text-red-400 transition-colors text-lg leading-none"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <motion.div
                key={5}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6">Preview</h2>
                <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <div>
                    <p className="text-white/60 text-sm">Creado por</p>
                    <p className="text-lg font-semibold">{formData.tuNombre}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Evento</p>
                    <p className="text-2xl font-bold">{formData.nombreEvento}</p>
                  </div>
                  {formData.descripcion && (
                    <div>
                      <p className="text-white/60 text-sm">Descripción</p>
                      <p className="text-white/80">{formData.descripcion}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-white/60 text-sm">Fecha y hora</p>
                    <p className="text-white/80">
                      {new Date(`${formData.fecha}T${formData.hora}`).toLocaleString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Lugar</p>
                    <p className="text-white/80">{formData.lugar}</p>
                  </div>
                  {formData.anfitriones && (
                    <div>
                      <p className="text-white/60 text-sm">Anfitriones</p>
                      <p className="text-white/80">{formData.anfitriones}</p>
                    </div>
                  )}
                  {formData.opcionesTraer.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm">Opciones para llevar</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.opcionesTraer.map((opcion, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-500/20 rounded-full text-sm"
                          >
                            {opcion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {eventId && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30"
                  >
                    <div>
                      <Label className="text-base">Link del evento</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventId}`}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventId}`
                            );
                            alert("¡Link copiado!");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base">NIP (guárdalo, no se puede recuperar)</Label>
                      <div className="flex gap-2 mt-2">
                        <Input value={ownerNip} readOnly className="font-mono text-2xl text-center font-bold" />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(ownerNip);
                            alert("¡NIP copiado!");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                      <p className="text-xs text-yellow-400/80 mt-2">
                        ⚠️ Guarda este NIP. Te permitirá modificar el evento más tarde.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mt-8 sticky bottom-4 z-20">
          <Button
            variant="outline"
            onClick={handleBack}
            className="rounded-xl border-white/20 text-gray-300 hover:bg-white/5"
          >
            ← {step === 1 ? "Volver" : "Anterior"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg shadow-purple-500/30 disabled:opacity-50"
          >
            {loading
              ? "Creando..."
              : step === 5
              ? "Confirmar"
              : step === 4
              ? "Continuar"
              : "Siguiente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
