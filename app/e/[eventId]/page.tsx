"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CosmicEntry from "@/components/cosmic-entry";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";

interface EventData {
  nombre: string;
  descripcion: string | null;
  anfitriones: string | null;
  fecha: string;
  lugar: string;
  audio_url: string | null;
  opciones_traer: string[];
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;
  
  const [showEntry, setShowEntry] = useState(false); // Removed: cosmic entry animation is redundant
  const [currentSection, setCurrentSection] = useState(0);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [confirmados, setConfirmados] = useState(0);
  const [guestsWithOptions, setGuestsWithOptions] = useState<Array<{nombre: string; opciones_seleccionadas: string[]}>>([]);
  const [nombreInvitado, setNombreInvitado] = useState("");
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<string[]>([]);
  const [haRespondido, setHaRespondido] = useState(false);
  const [haContinuado, setHaContinuado] = useState(false); // Controla si presionó "Continuar"
  const [respuesta, setRespuesta] = useState<"yes" | "no" | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState<"applause" | "party" | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerNip, setOwnerNip] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [currentVisibleSection, setCurrentVisibleSection] = useState(0);
  
  // Función para hacer scroll a una sección específica
  const scrollToSection = (sectionIndex: number) => {
    const section = sectionRefs.current[sectionIndex];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentVisibleSection(sectionIndex);
    }
  };
  
  // Función para ir a la siguiente sección
  const goToNextSection = () => {
    let nextSection = currentVisibleSection + 1;
    
    // Saltar secciones según el estado
    if (!eventData?.audio_url && nextSection === 1) {
      nextSection = 2; // Saltar sección de audio si no existe
    }
    
    if (haRespondido && nextSection === 3) {
      // Si ya respondió, ir a la sección correspondiente
      if (respuesta === "yes") {
        nextSection = 4; // Ir a sección de nombre si aceptó
      } else {
        return; // No hay siguiente si rechazó
      }
    }
    
    if (respuesta === "no") {
      return; // No hay siguiente sección si rechazó
    }
    
    // Validar que la sección existe
    if (nextSection < sectionRefs.current.length && sectionRefs.current[nextSection]) {
      scrollToSection(nextSection);
    }
  };
  
  // Función para ir a la sección anterior
  const goToPreviousSection = () => {
    let prevSection = currentVisibleSection - 1;
    
    // Saltar secciones según el estado
    if (!eventData?.audio_url && prevSection === 1) {
      prevSection = 0; // Saltar sección de audio si no existe
    }
    
    if (haRespondido && prevSection === 3) {
      prevSection = 2; // Saltar confirmación si ya respondió
    }
    
    if (respuesta === "yes" && haContinuado && prevSection === 6) {
      // Si está en "Nos vemos" y ya tiene nombre, no puede ir atrás fácilmente
      // Pero si quiere, puede ir a la sección 4 (nombre)
      prevSection = 4;
    }
    
    if (prevSection >= 0 && sectionRefs.current[prevSection]) {
      scrollToSection(prevSection);
    }
  };
  
  // Detectar sección visible con Intersection Observer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    sectionRefs.current.forEach((section, index) => {
      if (!section) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              setCurrentVisibleSection(index);
            }
          });
        },
        { threshold: 0.5, rootMargin: "-10% 0px -10% 0px" }
      );
      
      observer.observe(section);
      observers.push(observer);
    });
    
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [eventData, haRespondido, respuesta, nombreInvitado, haContinuado]);

  // Cargar evento desde BD
  useEffect(() => {
    let cancelled = false;
    
    const loadEvent = async () => {
      try {
        // Cargar evento
        const { data: event, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (cancelled) return;

        if (error || !event) {
          console.error("Error loading event:", error);
          if (!cancelled) {
            setEventData(null);
            setLoading(false);
          }
          return;
        }

        // Calcular confirmados (owner + anfitriones + invitados que aceptaron)
        let count = 1; // Owner
        if (event.anfitriones) {
          count += event.anfitriones.split(",").filter((a: string) => a.trim()).length;
        }
        
        // Cargar invitados con opciones (para vista del owner)
        const { data: guestsData } = await supabase
          .from("guests")
          .select("nombre, opciones_seleccionadas")
          .eq("event_id", eventId)
          .eq("response", "yes");

        const acceptedCount = guestsData?.length || 0;

        if (!cancelled) {
          setConfirmados(count + acceptedCount);
          // Guardar invitados con opciones para mostrar en vista del owner
          if (guestsData) {
            setGuestsWithOptions(guestsData.map((g: any) => ({
              nombre: g.nombre,
              opciones_seleccionadas: g.opciones_seleccionadas || []
            })));
          }

          // Formatear fecha/hora
          const fechaHora = new Date(event.fecha);
          setEventData({
            nombre: event.nombre,
            descripcion: event.descripcion,
            anfitriones: event.anfitriones,
            fecha: fechaHora.toISOString().split('T')[0],
            lugar: event.lugar,
            audio_url: event.audio_url,
            opciones_traer: event.opciones_traer || [],
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading event:", error);
          setEventData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (eventId) {
      loadEvent();
    }

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Verificar cookies cuando el componente se monta y cuando eventData cambia
  useEffect(() => {
    if (!eventId) return;
    
    // Función para verificar cookies
    const checkCookies = () => {
      const allCookies = document.cookie.split("; ");
      
      // Verificar si es el creador
      const ownerCookie = allCookies.find((row) => row.startsWith(`destello_owner_${eventId}`));
      if (ownerCookie) {
        // Es el creador - extraer el NIP de la cookie
        const nipValue = ownerCookie.split("=")[1];
        setIsOwner(true);
        setOwnerNip(nipValue);
        // No redirigir, mostrar vista especial para owner
        return;
      }
      
      // Verificar si ya confirmó CON NOMBRE (la cookie de nombre es la que importa)
      const nombreCookie = allCookies.find((row) => {
        const trimmed = row.trim();
        return trimmed.startsWith(`destello_nombre_${eventId}=`);
      });
      
      if (nombreCookie) {
        // Si tiene nombre guardado, significa que ya confirmó completamente
        // Decodificar el nombre en caso de que tenga caracteres especiales
        const nombreValue = decodeURIComponent(nombreCookie.split("=").slice(1).join("="));
        setNombreInvitado(nombreValue);
        setHaRespondido(true);
        setRespuesta("yes");
        
        // Si ya confirmó con nombre, redirigir inmediatamente a /people
        // Usar window.location para forzar recarga completa y asegurar cookies
        window.location.href = `/e/${eventId}/people`;
        return;
      }
      
      // Si NO tiene nombre, NO guardar ningún estado de respuesta anterior
      // Esto permite que vea todo el flujo como si fuera primera vez
      // incluso si anteriormente aceptó pero no puso nombre
    };
    
    // Verificar cookies inmediatamente
    checkCookies();
  }, [eventId, router]);

  // Prevenir back button cuando el invitado ya confirmó CON NOMBRE
  useEffect(() => {
    if (!eventId || isOwner) return;
    
    // Verificar si ya confirmó CON NOMBRE (la cookie de nombre indica confirmación completa)
    const checkIfConfirmed = () => {
      if (typeof window === 'undefined') return false;
      const allCookies = document.cookie.split('; ');
      const nombreCookie = allCookies.find((row) => {
        const trimmed = row.trim();
        return trimmed.startsWith(`destello_nombre_${eventId}=`);
      });
      return !!nombreCookie;
    };
    
    const isConfirmed = checkIfConfirmed();
    
    if (isConfirmed && !isOwner) {
      // Agregar una entrada al historial para interceptar el back
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = () => {
        // Si se detecta back y ya confirmó, redirigir según el estado
        
        // Verificar cookies actuales
        const allCookies = document.cookie.split('; ');
        const responseCookie = allCookies.find((row) => row.startsWith(`destello_response_${eventId}`));
        const continuadoCookie = allCookies.find((row) => row.startsWith(`destello_continuado_${eventId}`));
        
        if (responseCookie) {
          const response = responseCookie.split("=")[1];
          
          if (response === "yes" && continuadoCookie) {
            // Si aceptó y ya continuó, redirigir a /people
            router.push(`/e/${eventId}/people`);
          } else if (response === "yes") {
            // Si aceptó pero no continuó, quedarse en la página actual (sección de nombre)
            // No redirigir, solo prevenir el back
            window.history.pushState(null, '', window.location.href);
          } else {
            // Si rechazó, quedarse en la página de "Gracias"
            // No redirigir, solo prevenir el back
            window.history.pushState(null, '', window.location.href);
          }
        } else {
          // Si no hay cookie de respuesta, redirigir al home
          router.push('/');
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [eventId, haRespondido, isOwner, router]);

  // Prevenir back button cuando el invitado ya confirmó
  useEffect(() => {
    if (!eventId || isOwner) return;
    
    // Verificar si ya respondió (aceptó o rechazó) o si ya continuó
    const checkIfConfirmed = () => {
      if (typeof window === 'undefined') return false;
      const allCookies = document.cookie.split('; ');
      const responseCookie = allCookies.find((row) => row.startsWith(`destello_response_${eventId}`));
      const continuadoCookie = allCookies.find((row) => row.startsWith(`destello_continuado_${eventId}`));
      return !!responseCookie || !!continuadoCookie;
    };
    
    const isConfirmed = haRespondido || checkIfConfirmed();
    
    if (isConfirmed) {
      // Agregar una entrada al historial para interceptar el back
      window.history.pushState(null, '', window.location.href);
      
      const handlePopState = (e: PopStateEvent) => {
        // Verificar cookies actuales para saber a dónde redirigir
        const allCookies = document.cookie.split('; ');
        const nombreCookie = allCookies.find((row) => {
          const trimmed = row.trim();
          return trimmed.startsWith(`destello_nombre_${eventId}=`);
        });
        
        if (nombreCookie) {
          // Si ya confirmó con nombre, redirigir a /people
          e.preventDefault();
          window.location.href = `/e/${eventId}/people`;
        } else {
          // Si no tiene nombre, permitir navegación normal (ver flujo completo)
          // No prevenir el back
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [eventId, haRespondido, isOwner, router]);

  // Removed auto-scroll logic since cosmic entry is removed

  const handleAccept = async () => {
    setRespuesta("yes");
    setHaRespondido(true);
    // NO guardar cookie todavía - solo cuando confirme con nombre
    // Animación de lluvia de estrellas
    setCurrentSection(4);
    
    // Scroll automático hacia la sección de nombre después de la animación
    setTimeout(() => {
      sectionRefs.current[4]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 1000);
  };

  const handleReject = () => {
    setRespuesta("no");
    setHaRespondido(true);
    // Guardar en cookie para recordar que rechazó
    document.cookie = `destello_response_${eventId}=no; path=/; max-age=31536000; SameSite=Lax`;
    // NO guardar en BD (según Product.md línea 158)
    // Cambiar inmediatamente a la sección de agradecimiento por rechazo
    setCurrentSection(5);
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

  const handleSubmitNombre = async () => {
    if (nombreInvitado.trim() && respuesta === "yes") {
      // Guardar respuesta en BD (solo si aceptó)
      const { error } = await supabase
        .from("guests")
        .insert({
          event_id: eventId,
          nombre: nombreInvitado.trim(),
          response: "yes",
          opciones_seleccionadas: opcionesSeleccionadas,
        });

      if (error) {
        console.error("Error saving response:", error);
        setToastMessage("Error al guardar tu respuesta. Por favor intenta de nuevo.");
        setToastType("error");
        setShowToast(true);
        return;
      }

      // Guardar en cookies SOLO cuando confirma con nombre
      // Esta es la única forma de saber que realmente confirmó
      // Safari requiere formato específico de cookies
      const cookieOptions = `path=/; max-age=31536000; SameSite=Lax; Secure=${window.location.protocol === 'https:' ? 'true' : 'false'}`;
      
      document.cookie = `destello_response_${eventId}=yes; ${cookieOptions}`;
      document.cookie = `destello_nombre_${eventId}=${encodeURIComponent(nombreInvitado.trim())}; ${cookieOptions}`;
      document.cookie = `destello_continuado_${eventId}=true; ${cookieOptions}`;
      
      // Forzar actualización del navegador para que Safari guarde las cookies
      if (typeof window !== 'undefined') {
        // Pequeño delay para asegurar que las cookies se guarden antes de redirigir
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Actualizar contador de confirmados
      setConfirmados((prev) => prev + 1);
      
      // Marcar que presionó Confirmar
      setHaContinuado(true);
      
      // Redirigir inmediatamente a /people después de confirmar
      // Usar window.location para forzar recarga completa y asegurar que Safari lea las cookies
      window.location.href = `/e/${eventId}/people`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-xl">Cargando invitación...</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Evento no encontrado</h2>
          <p className="text-white/70">El evento que buscas no existe o ha expirado</p>
        </div>
      </div>
    );
  }

  // Removed cosmic entry animation - it's redundant with the first section

  // Vista especial para el owner - mostrar solo detalle del evento con opción a modificar
  if (isOwner && eventData) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Header para owner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Tu Evento
              </h1>
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300">
                Owner
              </div>
            </div>
          </motion.div>

          {/* Detalle del evento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
          >
            <div>
              <p className="text-white/60 text-sm mb-1">Nombre del evento</p>
              <p className="text-2xl md:text-3xl font-bold">{eventData.nombre}</p>
            </div>

            {eventData.descripcion && (
              <div>
                <p className="text-white/60 text-sm mb-1">Descripción</p>
                <p className="text-white/80">{eventData.descripcion}</p>
              </div>
            )}

            <div>
              <p className="text-white/60 text-sm mb-1">Fecha y hora</p>
              <p className="text-xl font-semibold">
                {new Date(eventData.fecha).toLocaleString("es-ES", {
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
              <p className="text-white/60 text-sm mb-1">Lugar</p>
              <p className="text-lg">{eventData.lugar}</p>
            </div>

            <div>
              <p className="text-white/60 text-sm mb-1">Invitados confirmados</p>
              <p className="text-3xl font-bold text-purple-300">{confirmados}</p>
            </div>

            {/* Lista de invitados con sus opciones seleccionadas */}
            {guestsWithOptions.length > 0 && (
              <div>
                <p className="text-white/60 text-sm mb-2">Opciones seleccionadas por invitado</p>
                <div className="space-y-1.5">
                  {guestsWithOptions.map((guest, index) => (
                    <p key={index} className="text-white/80 text-sm">
                      <span className="font-semibold">{guest.nombre}:</span>{" "}
                      {guest.opciones_seleccionadas && guest.opciones_seleccionadas.length > 0 ? (
                        <span className="text-white/70">{guest.opciones_seleccionadas.join(", ")}</span>
                      ) : (
                        <span className="text-white/50 italic">Nada seleccionado</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {eventData.anfitriones && (
              <div>
                <p className="text-white/60 text-sm mb-1">Anfitriones</p>
                <p className="text-white/80">{eventData.anfitriones}</p>
              </div>
            )}

            {eventData.opciones_traer && eventData.opciones_traer.length > 0 && (
              <div>
                <p className="text-white/60 text-sm mb-2">Opciones para llevar</p>
                <div className="flex flex-wrap gap-2">
                  {eventData.opciones_traer.map((opcion, index) => (
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

            {eventData.audio_url && (
              <div>
                <p className="text-white/60 text-sm mb-2">Mensaje de voz</p>
                <audio 
                  controls 
                  className="w-full max-w-md" 
                  preload="metadata"
                  playsInline
                  src={eventData.audio_url}
                  onLoadedMetadata={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    console.log("Audio metadata loaded:", {
                      duration: audio.duration,
                      readyState: audio.readyState,
                      src: audio.currentSrc
                    });
                  }}
                  onCanPlay={(e) => {
                    console.log("Audio can play");
                  }}
                  onError={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    console.error("Error loading audio:", {
                      error: audio.error,
                      code: audio.error?.code,
                      message: audio.error?.message,
                      src: audio.src,
                      currentSrc: audio.currentSrc,
                      networkState: audio.networkState,
                      readyState: audio.readyState
                    });
                  }}
                  onEnded={() => {
                    console.log("Audio ended");
                  }}
                >
                  Tu navegador no soporta el elemento de audio.
                </audio>
              </div>
            )}
          </motion.div>

          {/* Acciones para el owner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 space-y-4"
          >
            <Button
              onClick={() => router.push(`/e/${eventId}/people`)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6 rounded-xl"
            >
              Ver invitados confirmados
            </Button>

            <Button
              onClick={async () => {
                const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventId}`;
                try {
                  await navigator.clipboard.writeText(eventUrl);
                  setToastMessage("Link copiado!");
                  setToastType("success");
                  setShowToast(true);
                } catch (err) {
                  setToastMessage("Error al copiar");
                  setToastType("error");
                  setShowToast(true);
                }
              }}
              variant="outline"
              className="w-full border-white/20 hover:bg-white/10"
            >
              Copiar link del evento
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Determinar si rechazó la invitación (antes de cualquier uso)
  const isRejected = respuesta === "no";

  // Si rechazó, mostrar animación de vacío y agradecimiento inmediatamente
  if (isRejected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        {/* Animación de estrellas desapareciendo */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 3 }}
          className="absolute inset-0"
        >
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
        
        {/* Mensaje de agradecimiento - aparece después de la animación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
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

  // Determinar navegación (después de verificar si rechazó)
  // Determinar si puede ir a la siguiente sección
  let maxSection = 6; // Máxima sección disponible
  if (!haRespondido) {
    maxSection = 3; // Confirmación
  } else if (respuesta === "yes" && !nombreInvitado.trim()) {
    maxSection = 4; // Nombre
  } else if (respuesta === "yes" && haContinuado) {
    maxSection = 6; // Nos vemos
  } else if (isRejected) {
    maxSection = 5; // Gracias (rechazo)
  }
  
  const canGoNext = currentVisibleSection < maxSection;
  const canGoPrev = currentVisibleSection > 0;
  const showFloatingNav = !isOwner && !isRejected && !(respuesta === "yes" && haContinuado && currentVisibleSection >= 6);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Botón de navegación flotante - visible solo cuando corresponde */}
      {showFloatingNav && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
          {/* Botón para ir arriba */}
          {canGoPrev && (
            <button
              onClick={goToPreviousSection}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all shadow-lg"
              aria-label="Sección anterior"
            >
              <ArrowUp className="w-5 h-5 text-white/80" strokeWidth={2} />
            </button>
          )}
          
          {/* Botón para ir abajo */}
          {canGoNext && (
            <button
              onClick={goToNextSection}
              className="p-3 rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 border border-purple-500/50 backdrop-blur-sm transition-all shadow-lg shadow-purple-500/30"
              aria-label="Siguiente sección"
            >
              <ArrowDown className="w-5 h-5 text-white" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Sección 1: Header con nombre evento */}
      <section
        ref={(el) => {
          sectionRefs.current[0] = el;
        }}
        className="min-h-[85vh] md:min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6 snap-start relative py-8 md:py-0"
      >
        {/* Destello cósmico animado */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          {/* Texto introductorio con animación */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-white/70 text-base md:text-lg mb-6"
          >
            Si puedes ver esto es porque alguien de los anfitriones te ha invitado a:
          </motion.p>

          {/* Destello alrededor del nombre */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            className="relative inline-block"
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(192, 132, 252, 0.3)",
                  "0 0 40px rgba(192, 132, 252, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)",
                  "0 0 20px rgba(192, 132, 252, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl -z-10"
            />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 relative z-10">
              ✦ {eventData.nombre} ✦
            </h1>
          </motion.div>

          {eventData.anfitriones && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4"
            >
              <p className="text-white/60 text-sm">Anfitriones:</p>
              <p className="text-white/80">{eventData.anfitriones}</p>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-4"
          >
            <p className="text-white/60 text-sm">Confirmados:</p>
            <p className="text-2xl font-bold text-purple-300">{confirmados}</p>
          </motion.div>
        </motion.div>

        {/* Botón para avanzar a la siguiente sección */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <button
            onClick={goToNextSection}
            className="flex flex-col items-center gap-2 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm group"
            aria-label="Continuar a la siguiente sección"
          >
            <motion.div
              animate={{
                y: [0, 5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowDown className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" strokeWidth={2} />
            </motion.div>
            <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Continuar
            </span>
          </button>
        </motion.div>
      </section>

      {/* Sección 1.1: Audio */}
      {eventData.audio_url && (
        <section
          ref={(el) => {
            sectionRefs.current[1] = el;
          }}
          className="min-h-[50vh] md:min-h-[60vh] flex flex-col items-center justify-center px-4 snap-start py-8 md:py-12 relative"
        >
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center w-full max-w-md space-y-6"
          >
            <p className="text-white/60 text-sm mb-4">Mensaje de voz</p>
            <audio 
              controls 
              className="w-full" 
              preload="metadata"
              playsInline
              src={eventData.audio_url}
              onLoadedMetadata={(e) => {
                const audio = e.target as HTMLAudioElement;
                console.log("Audio metadata loaded:", {
                  duration: audio.duration,
                  readyState: audio.readyState,
                  src: audio.currentSrc
                });
              }}
              onCanPlay={(e) => {
                console.log("Audio can play");
              }}
              onError={(e) => {
                const audio = e.target as HTMLAudioElement;
                console.error("Error loading audio:", {
                  error: audio.error,
                  code: audio.error?.code,
                  message: audio.error?.message,
                  src: audio.src,
                  currentSrc: audio.currentSrc,
                  networkState: audio.networkState,
                  readyState: audio.readyState
                });
              }}
              onEnded={() => {
                console.log("Audio ended");
              }}
            >
              Tu navegador no soporta el elemento de audio.
            </audio>
            
            {/* Botón para continuar */}
            <button
              onClick={goToNextSection}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm text-sm text-white/70 hover:text-white mt-4"
            >
              Continuar
              <ArrowDown className="w-4 h-4" strokeWidth={2} />
            </button>
          </motion.div>
        </section>
      )}

      {/* Sección 2: Detalles del evento */}
      <section
        ref={(el) => {
          sectionRefs.current[2] = el;
        }}
        className="min-h-[75vh] md:min-h-screen flex flex-col items-center justify-center px-4 snap-start py-8 md:py-12 relative"
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
                {new Date(eventData.fecha).toLocaleString("es-ES", {
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
              <p className="text-lg mt-2">{eventData.lugar}</p>
            </div>
          </div>
          
          {/* Botón para continuar solo si no ha respondido */}
          {!haRespondido && (
            <div className="flex justify-center pt-4">
              <button
                onClick={goToNextSection}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm text-sm text-white/70 hover:text-white"
              >
                Continuar
                <ArrowDown className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* Sección 3: Confirmación */}
      {!haRespondido && (
        <section
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
          className="min-h-[75vh] md:min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-8 snap-start py-8 md:py-12"
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
                y: [0, typeof window !== 'undefined' ? window.innerHeight + 100 : 1000],
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
      {respuesta === "yes" && !haContinuado && (
        <section
          ref={(el) => {
            sectionRefs.current[4] = el;
          }}
          className="min-h-[75vh] md:min-h-screen flex items-center justify-center px-4 snap-start py-8 md:py-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Gracias</h2>
              <p className="text-xl text-purple-300">¡Súper bien!, ya casi terminamos...</p>
            </div>

            {/* Opciones para llevar - Primero según Product.md */}
            {eventData.opciones_traer && eventData.opciones_traer.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">¿Quieres llevar algo?</h3>
                  <p className="text-white/70 text-sm">Aquí tienes algunas opciones, pero NTP esto solo es opcional y la idea al final es que la pasemos bien:</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {eventData.opciones_traer.map((opcion) => (
                    <button
                      key={opcion}
                      onClick={() => toggleOpcion(opcion)}
                      className={`px-6 py-3 rounded-full text-base font-medium transition-all touch-manipulation ${
                        opcionesSeleccionadas.includes(opcion)
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-110"
                          : "bg-white/10 text-white/70 hover:bg-white/20 active:bg-white/30 border border-white/20"
                      }`}
                    >
                      {opcion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Input de nombre - Después de opciones */}
            <div className="space-y-4">
              <Label htmlFor="nombre" className="text-center block">¿Cual es tu nombre?</Label>
              <Input
                id="nombre"
                value={nombreInvitado}
                onChange={(e) => setNombreInvitado(e.target.value)}
                placeholder="Nombre"
                className="text-lg py-4"
                onKeyPress={(e) => e.key === "Enter" && handleSubmitNombre()}
              />
              <Button
                onClick={handleSubmitNombre}
                disabled={!nombreInvitado.trim()}
                className="w-full text-lg py-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </Button>
            </div>

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

      {/* Sección 6: Nos vemos - Solo se muestra después de presionar Continuar */}
      {respuesta === "yes" && haContinuado && (
        <section
          ref={(el) => {
            sectionRefs.current[6] = el;
          }}
          className="min-h-[75vh] md:min-h-screen flex flex-col items-center justify-center px-4 snap-start py-8 md:py-12 relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-2xl w-full"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Es todo, nos vemos el{" "}
              {new Date(eventData.fecha).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            <p className="text-xl md:text-2xl text-white/80">en</p>
            <p className="text-2xl md:text-3xl font-semibold">{eventData.lugar}</p>
            
            {/* Botón para ver invitados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pt-6"
            >
              <Button
                onClick={() => {
                  router.push(`/e/${eventId}/people`);
                }}
                className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
              >
                Ver invitados confirmados
              </Button>
            </motion.div>
          </motion.div>
        </section>
      )}
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

