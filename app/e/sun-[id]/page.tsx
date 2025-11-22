"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CosmicEntry from "@/components/cosmic-entry";

// Mock data - en producción vendría de BD
const mockEventData = {
  nombre: "Fiesta de Cumpleaños",
  descripcion: "Una celebración cósmica",
  anfitriones: "Juan, María",
  fecha: "2024-12-25",
  hora: "20:00",
  lugar: "Casa de Juan, Calle Principal 123",
  tieneAudio: false,
  opcionesTraer: ["Postres", "Bebidas", "Botana"],
  confirmados: 5,
};

const OPCIONES_PREDEFINIDAS = ["Postres", "Piñatas", "Botana", "Bebidas", "Dulces", "Fruta"];

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [showEntry, setShowEntry] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [nombreInvitado, setNombreInvitado] = useState("");
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<string[]>([]);
  const [haRespondido, setHaRespondido] = useState(false);
  const [respuesta, setRespuesta] = useState<"yes" | "no" | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState<"applause" | "party" | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Verificar si ya respondió (cookie)
  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`destello_response_${eventId}`));
    if (cookieValue) {
      const response = cookieValue.split("=")[1];
      setHaRespondido(true);
      setRespuesta(response as "yes" | "no");
      setShowEntry(false);
      setCurrentSection(4); // Ir a sección de gracias
    }
  }, [eventId]);

  // Auto-scroll por secciones después del entry
  useEffect(() => {
    if (!showEntry && currentSection < 4) {
      const timer = setTimeout(() => {
        sectionRefs.current[currentSection]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        if (currentSection < 3) {
          setCurrentSection(currentSection + 1);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showEntry, currentSection]);

  const handleAccept = () => {
    setRespuesta("yes");
    setHaRespondido(true);
    // Guardar en cookie
    document.cookie = `destello_response_${eventId}=yes; path=/; max-age=31536000`;
    // Animación de lluvia de estrellas
    setCurrentSection(4);
  };

  const handleReject = () => {
    setRespuesta("no");
    setHaRespondido(true);
    // Guardar en cookie
    document.cookie = `destello_response_${eventId}=no; path=/; max-age=31536000`;
    // Animación de vacío de estrellas
    setTimeout(() => {
      setCurrentSection(5); // Sección de agradecimiento por rechazo
    }, 2000);
  };

  const toggleOpcion = (opcion: string) => {
    if (opcionesSeleccionadas.includes(opcion)) {
      setOpcionesSeleccionadas(opcionesSeleccionadas.filter((o) => o !== opcion));
    } else {
      setOpcionesSeleccionadas([...opcionesSeleccionadas, opcion]);
      // Mostrar reacción
      setReactionType(Math.random() > 0.5 ? "applause" : "party");
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 2000);
      // Guardar en cookie
      document.cookie = `destello_opciones_${eventId}=${JSON.stringify([...opcionesSeleccionadas, opcion])}; path=/; max-age=31536000`;
    }
  };

  const handleSubmitNombre = () => {
    if (nombreInvitado.trim()) {
      // Guardar en cookie
      document.cookie = `destello_nombre_${eventId}=${nombreInvitado}; path=/; max-age=31536000`;
      setCurrentSection(6); // Sección final
    }
  };

  if (showEntry) {
    return (
      <CosmicEntry
        eventName={mockEventData.nombre}
        onComplete={() => {
          setShowEntry(false);
          setCurrentSection(0);
        }}
      />
    );
  }

  // Si rechazó, mostrar animación de vacío
  if (respuesta === "no" && currentSection === 5) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="absolute inset-0"
        >
          {/* Estrellas desapareciendo */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [1, 0],
                scale: [1, 0],
              }}
              transition={{
                duration: 2,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 z-10"
        >
          <h2 className="text-3xl font-bold">Gracias</h2>
          <p className="text-white/70">
            La invitación se ha perdido en el universo...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Sección 1: Header con nombre evento */}
      <section
        ref={(el) => (sectionRefs.current[0] = el)}
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/70 text-lg mb-4">
            Si puedes ver esto es porque alguien te ha invitado a:
          </p>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            {mockEventData.nombre}
          </h1>
          {mockEventData.anfitriones && (
            <div className="mt-4">
              <p className="text-white/60 text-sm">Anfitriones:</p>
              <p className="text-white/80">{mockEventData.anfitriones}</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-white/60 text-sm">Confirmados:</p>
            <p className="text-2xl font-bold text-purple-300">{mockEventData.confirmados}</p>
          </div>
        </motion.div>
      </section>

      {/* Sección 1.1: Audio */}
      {mockEventData.tieneAudio && (
        <section
          ref={(el) => (sectionRefs.current[1] = el)}
          className="min-h-screen flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <audio controls className="w-full max-w-md">
              <source src="/audio.mp3" type="audio/mpeg" />
            </audio>
          </motion.div>
        </section>
      )}

      {/* Sección 2: Detalles del evento */}
      <section
        ref={(el) => (sectionRefs.current[2] = el)}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl w-full space-y-6"
        >
          <h2 className="text-3xl font-bold mb-6">Detalles del evento</h2>
          <div className="space-y-4 p-6 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-white/60 text-sm">Fecha y hora</p>
              <p className="text-2xl font-bold mt-2">
                {new Date(`${mockEventData.fecha}T${mockEventData.hora}`).toLocaleString("es-ES", {
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
              <p className="text-white/60 text-sm">Coordenadas</p>
              <p className="text-lg mt-2">{mockEventData.lugar}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Sección 3: Confirmación */}
      {!haRespondido && (
        <section
          ref={(el) => (sectionRefs.current[3] = el)}
          className="min-h-screen flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-8 max-w-md"
          >
            <h2 className="text-3xl font-bold">¿Qué dices, te nos unes?</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAccept}
                className="flex-1 text-lg py-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Vale, me apunto
              </Button>
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1 text-lg py-6 rounded-xl border-white/20 hover:bg-white/10"
              >
                No puedo
              </Button>
            </div>
          </motion.div>
        </section>
      )}

      {/* Animación de lluvia de estrellas al aceptar */}
      {respuesta === "yes" && currentSection === 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, window.innerHeight + 100],
                opacity: [1, 0],
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                delay: Math.random() * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Sección 4: Gracias y nombre */}
      {respuesta === "yes" && (
        <section
          ref={(el) => (sectionRefs.current[4] = el)}
          className="min-h-screen flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full space-y-8"
          >
            <h2 className="text-3xl font-bold text-center">Gracias</h2>
            <div className="space-y-4">
              <Label htmlFor="nombre">Tu nombre</Label>
              <Input
                id="nombre"
                value={nombreInvitado}
                onChange={(e) => setNombreInvitado(e.target.value)}
                placeholder="¿Cómo te llamas?"
                className="text-lg py-4"
              />
              <Button
                onClick={handleSubmitNombre}
                disabled={!nombreInvitado.trim()}
                className="w-full text-lg py-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500"
              >
                Continuar
              </Button>
            </div>

            {/* Opciones para llevar */}
            {mockEventData.opcionesTraer && mockEventData.opcionesTraer.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold">¿Quieres llevar algo?</h3>
                <p className="text-white/70 text-sm">Aquí algunas opciones:</p>
                <div className="flex flex-wrap gap-3">
                  {mockEventData.opcionesTraer.map((opcion) => (
                    <button
                      key={opcion}
                      onClick={() => toggleOpcion(opcion)}
                      className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                        opcionesSeleccionadas.includes(opcion)
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
                      }`}
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reacción tipo Zoom/Meet */}
            <AnimatePresence>
              {showReaction && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: -100 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-6xl pointer-events-none"
                >
                  {reactionType === "applause" ? "👏" : "🎉"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* Sección 6: Nos vemos */}
      {nombreInvitado && currentSection === 6 && (
        <section className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-2xl"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Es todo, nos vemos el{" "}
              {new Date(`${mockEventData.fecha}T${mockEventData.hora}`).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="text-2xl text-white/80">en</p>
            <p className="text-3xl font-semibold">{mockEventData.lugar}</p>
          </motion.div>
        </section>
      )}
    </div>
  );
}

