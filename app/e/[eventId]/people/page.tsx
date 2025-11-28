// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, TrackballControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Clock } from "lucide-react";

interface Person {
  nombre: string;
  tipo: "owner" | "anfitrion" | "invitado";
}

function Word({ children, ...props }: any) {
  const color = new THREE.Color();
  const fontProps = { fontSize: 2.5, letterSpacing: -0.05, lineHeight: 1, 'material-toneMapped': false };
  const ref = useRef<any>();
  const [hovered, setHovered] = useState(false);
  const over = (e: any) => (e.stopPropagation(), setHovered(true));
  const out = () => setHovered(false);
  
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer';
    return () => (document.body.style.cursor = 'auto');
  }, [hovered]);
  
  useFrame(() => {
    if (ref.current?.material?.color) {
      ref.current.material.color.lerp(color.set(hovered ? '#c084fc' : 'white'), 0.1);
    }
  });
  
  return (
    <Billboard {...props}>
      <Text ref={ref} onPointerOver={over} onPointerOut={out} {...fontProps} children={children} />
    </Billboard>
  );
}

function Cloud({ people, radius = 20 }: { people: Person[]; radius?: number }) {
  const count = Math.ceil(Math.sqrt(people.length)) || 4;
  
  const words = useMemo(() => {
    const temp: Array<[THREE.Vector3, string]> = [];
    const spherical = new THREE.Spherical();
    const phiSpan = Math.PI / (count + 1);
    const thetaSpan = (Math.PI * 2) / count;
    
    let index = 0;
    for (let i = 1; i < count + 1; i++) {
      for (let j = 0; j < count && index < people.length; j++) {
        temp.push([
          new THREE.Vector3().setFromSpherical(spherical.set(radius, phiSpan * i, thetaSpan * j)),
          people[index].nombre
        ]);
        index++;
      }
    }
    return temp;
  }, [people, count, radius]);
  
  return words.map(([pos, word], index) => (
    <Word key={index} position={pos} children={word} />
  ));
}

// Componente para el efecto de nubosidad alrededor de la esfera
function NebulaCloud({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[radius * 1.15, 32, 32]} position={[0, 0, 0]} renderOrder={-1}>
      <meshBasicMaterial
        transparent
        opacity={0.02}
        color="#c084fc"
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
      />
    </Sphere>
  );
}

function SphereScene({ people }: { people: Person[] }) {
  // Calcular radius basado en cantidad, similar al ejemplo
  const radius = useMemo(() => {
    const count = people.length;
    if (count === 0) return 20;
    if (count <= 4) return 15;
    if (count <= 16) return 20;
    if (count <= 36) return 25;
    return 30;
  }, [people.length]);

  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 35], fov: 90 }}>
      <fog attach="fog" args={['#000000', 0, 100]} />
      <Suspense fallback={null}>
        <group rotation={[10, 10.5, 10]}>
          <NebulaCloud radius={radius} />
          <Cloud people={people} radius={radius} />
        </group>
      </Suspense>
      <TrackballControls />
    </Canvas>
  );
}

function PeoplePageContent() {
  const params = useParams();
  const eventId = (params?.eventId || '') as string;
  
  const [people, setPeople] = useState<Person[]>([]);
  const [eventName, setEventName] = useState<string>("");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState<string[]>([]);
  const [todasLasOpciones, setTodasLasOpciones] = useState<string[]>([]);
  const [eventStatus, setEventStatus] = useState<"past" | "today" | "future" | null>(null);
  const [banners, setBanners] = useState<string[]>([]);

  // Prevenir back button y verificar cookies al cargar
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    // Verificar si tiene nombre (cookie de confirmación)
    const allCookies = document.cookie.split("; ");
    const nombreCookie = allCookies.find((row) => {
      const trimmed = row.trim();
      return trimmed.startsWith(`destello_nombre_${eventId}=`);
    });
    const ownerCookie = allCookies.find((row) => row.startsWith(`destello_owner_${eventId}`));
    
    // Si no es owner y no tiene nombre, redirigir al evento
    if (!ownerCookie && !nombreCookie) {
      window.location.href = `/e/${eventId}`;
      return;
    }

    // Prevenir back button en /people
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // Si intenta ir atrás desde /people, redirigir al home
      window.location.href = '/';
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const loadPeople = async () => {
      try {
        const allCookies = document.cookie.split("; ");
        const ownerCookie = allCookies.find((row) => row.startsWith(`destello_owner_${eventId}`));
        // Verificar cookie de nombre (indica que confirmó con nombre)
        const nombreCookie = allCookies.find((row) => {
          const trimmed = row.trim();
          return trimmed.startsWith(`destello_nombre_${eventId}=`);
        });
        
        const isOwner = !!ownerCookie;
        const hasConfirmed = !!nombreCookie; // Si tiene nombre, significa que confirmó
        
        if (!isOwner && !hasConfirmed) {
          if (!cancelled) {
            setPeople([]);
            setEventName("");
            setLoading(false);
          }
          return;
        }

        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventError || !event) {
          throw new Error(eventError?.message || "Evento no encontrado");
        }

        const { data: guests } = await supabase
          .from("guests")
          .select("nombre, opciones_seleccionadas")
          .eq("event_id", eventId)
          .eq("response", "yes");

        if (cancelled) return;

        // Solo mostrar los que confirmaron realmente (no incluir owner ni anfitriones automáticamente)
        const peopleList: Person[] = [];

        if (guests && guests.length > 0) {
          guests.forEach((g) => {
            peopleList.push({ nombre: g.nombre, tipo: "invitado" as const });
          });
        }

        // Consolidar todas las opciones seleccionadas sin duplicados
        const todasOpciones = new Set<string>();
        if (guests) {
          guests.forEach((g) => {
            if (g.opciones_seleccionadas && Array.isArray(g.opciones_seleccionadas)) {
              g.opciones_seleccionadas.forEach((opcion: string) => {
                if (opcion && opcion.trim()) {
                  todasOpciones.add(opcion.trim());
                }
              });
            }
          });
        }

        // Obtener todas las opciones disponibles del evento
        const opcionesEvento = (event.opciones_traer || []) as string[];
        const opcionesSeleccionadasArray = Array.from(todasOpciones);

        if (!cancelled) {
          setEventName(event.nombre);
          setEventDate(event.fecha);
          setPeople(peopleList);
          setOpcionesSeleccionadas(opcionesSeleccionadasArray);
          setTodasLasOpciones(opcionesEvento);
          
          // Cargar banners desde el evento
          // Asegurarse de que sea un array válido
          let eventBanners: string[] = [];
          if (event.banners) {
            if (Array.isArray(event.banners)) {
              eventBanners = event.banners.filter((b: any) => b && typeof b === 'string' && b.trim().length > 0);
            } else if (typeof event.banners === 'string') {
              // Por si acaso está guardado como string JSON
              try {
                const parsed = JSON.parse(event.banners);
                if (Array.isArray(parsed)) {
                  eventBanners = parsed.filter((b: any) => b && typeof b === 'string' && b.trim().length > 0);
                }
              } catch (e) {
                // Ignorar error de parsing
              }
            }
          }
          setBanners(eventBanners);
          
          // No calculamos aquí, lo haremos en un useEffect separado para actualización en tiempo real
          
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Error al cargar los datos");
          setLoading(false);
        }
      }
    };

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Verificar estado del evento (pasado, hoy, futuro)
  useEffect(() => {
    if (!eventDate) return;

    const eventDateObj = new Date(eventDate);
    const today = new Date();
    
    // Normalizar a solo fecha (sin hora)
    const eventDay = new Date(eventDateObj.getFullYear(), eventDateObj.getMonth(), eventDateObj.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (eventDay < todayDay) {
      setEventStatus("past");
    } else if (eventDay.getTime() === todayDay.getTime()) {
      setEventStatus("today");
    } else {
      setEventStatus("future");
    }
  }, [eventDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative z-10">
        <div className="text-xl">Cargando invitados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Error</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si el evento ya pasó
  if (eventStatus === "past") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
        <div className="text-center space-y-4 z-10">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            El evento ya pasó
          </h2>
          <p className="text-white/70 text-lg md:text-xl">
            Este momento ya quedó en el universo...
          </p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay confirmaciones
  if (people.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Esperando confirmaciones
          </h2>
          <p className="text-white/60 text-sm md:text-base">Aún no hay invitados confirmados para este evento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden" style={{ background: 'transparent' }}>
      {/* Header elegante y espacioso */}
      <div className="sticky top-0 z-30 p-4 md:p-6 lg:p-8 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex-1">
              <h1 className="text-lg md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                {eventName}
              </h1>
              {eventDate && (
                <>
                  {/* Formato compacto para móvil */}
                  <p className="text-white/60 text-[10px] md:hidden mt-1 leading-tight">
                    {new Date(eventDate).toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {/* Formato completo para desktop */}
                  <p className="hidden md:block text-white/60 text-sm lg:text-base mt-2 leading-tight">
                    {new Date(eventDate).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {/* Mensaje de recordatorio con efecto atractivo */}
                  <div className="mt-3 md:mt-4 inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-purple-400/30 backdrop-blur-sm animate-attractive-reminder">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-purple-300 animate-pulse-slow" />
                    <p className="text-white/90 text-xs md:text-sm font-medium leading-tight">
                      <span className="text-white/70">Recuerda: la cita es a las</span>{" "}
                      <span className="text-purple-300 font-bold">
                        {new Date(eventDate).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/60 to-purple-500/30 flex-1 max-w-8 md:max-w-16 lg:max-w-24" />
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <span className="text-xs md:text-sm lg:text-base text-purple-300 font-mono tabular-nums whitespace-nowrap">
                  {people.length} {people.length === 1 ? "confirmado" : "confirmados"}
                </span>
                {eventStatus === "today" && (
                  <>
                    <div className="h-3 w-px bg-white/20 hidden md:block" />
                    <span className="text-xs md:text-sm lg:text-base text-pink-300 font-semibold whitespace-nowrap">
                      ¡Hoy!
                    </span>
                  </>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-pink-500/30 via-pink-500/60 to-transparent flex-1 max-w-8 md:max-w-16 lg:max-w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor principal - diseño elegante para desktop */}
      <div className="relative min-h-[calc(100vh-120px)] md:min-h-[calc(100vh-160px)]">
        {/* Esfera 3D - tamaño generoso en desktop, compacta en móvil */}
        <div className="relative w-full mx-auto h-[50vh] min-h-[350px] md:h-[65vh] md:min-h-[500px] md:max-h-[700px]">
          <SphereScene people={people} />
        </div>

        {/* Chips - diseño elegante y espacioso */}
        {(opcionesSeleccionadas.length > 0 || todasLasOpciones.length > 0) && (
          <div className="relative w-full px-4 md:px-8 lg:px-12 pt-6 md:pt-8 lg:pt-10 pb-4 md:pb-6">
            <div className="max-w-6xl mx-auto space-y-5 md:space-y-6 lg:space-y-8">
              {/* Opciones seleccionadas */}
              {opcionesSeleccionadas.length > 0 && (
                <div>
                  <p className="text-white/50 text-xs md:text-sm lg:text-base text-center mb-3 md:mb-4 lg:mb-5 font-light">
                    Algunos invitados llevarán:
                  </p>
                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                    {opcionesSeleccionadas.map((opcion, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-full text-white/90 backdrop-blur-sm text-xs md:text-sm lg:text-base px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 leading-tight"
                      >
                        {opcion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Opciones no seleccionadas */}
              {(() => {
                const opcionesNoSeleccionadas = todasLasOpciones.filter(
                  opcion => opcion && opcion.trim() && !opcionesSeleccionadas.includes(opcion.trim())
                );
                
                return opcionesNoSeleccionadas.length > 0 ? (
                  <div>
                    <p className="text-white/40 text-xs md:text-sm lg:text-base text-center mb-3 md:mb-4 lg:mb-5 font-light">
                      Cosas que nadie ha elegido 🥲, pero aún puedes llevar 😍
                    </p>
                    <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                      {opcionesNoSeleccionadas.map((opcion, index) => (
                        <span
                          key={index}
                          className="bg-white/5 border border-white/10 rounded-full text-white/60 backdrop-blur-sm text-xs md:text-sm lg:text-base px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 leading-tight"
                        >
                          {opcion.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Separador de sección - clickeable (antes de banners) */}
        {banners && banners.length > 0 && (
          <div className="relative w-full px-4 md:px-8 lg:px-12 py-6 md:py-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-gradient-to-r from-transparent via-purple-500/60 to-purple-500/30 flex-1 max-w-16" />
                <button
                  onClick={() => {
                    // Scroll a la sección de banners
                    const bannersSection = document.querySelector('[data-banners-section]');
                    if (bannersSection) {
                      const yOffset = -80; // Offset para el header sticky
                      const element = bannersSection as HTMLElement;
                      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm group z-40 relative pointer-events-auto"
                  aria-label="Ver banners"
                >
                  <ChevronDown className="w-6 h-6 md:w-8 md:h-8 text-white/70 group-hover:text-white transition-colors" strokeWidth={2} />
                </button>
                <div className="h-px bg-gradient-to-r from-pink-500/30 via-pink-500/60 to-transparent flex-1 max-w-16" />
              </div>
            </div>
          </div>
        )}

        {/* Sección de banners */}
        {banners && banners.length > 0 && (
          <div className="relative w-full px-4 md:px-8 lg:px-12 pt-4 md:pt-6" style={{ paddingBottom: 'calc(60px + 2rem)' }}>
            <div className="max-w-6xl mx-auto">

              {/* Galería de banners */}
              <div data-banners-section>
              {banners.length === 1 ? (
                // Una sola imagen: centrada escalada manteniendo aspect ratio
                <div className="flex justify-center items-center w-full">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm group flex justify-center items-center py-4 px-4" style={{ maxWidth: '100%', width: '100%' }}>
                    <img
                      src={banners[0]}
                      alt="Banner del evento"
                      className="h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      style={{ maxHeight: '60vh', maxWidth: '100%', width: 'auto', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                </div>
              ) : (
                // Múltiples imágenes: grid responsive escaladas manteniendo aspect ratio
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {banners.map((bannerUrl, index) => (
                    <div
                      key={index}
                      className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm group flex items-center justify-center py-4 px-4"
                    >
                      <img
                        src={bannerUrl}
                        alt={`Banner ${index + 1}`}
                        className="h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        style={{ maxHeight: '40vh', maxWidth: '100%', width: 'auto', display: 'block', margin: '0 auto' }}
                      />
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative z-10">
        <div className="text-xl">Cargando...</div>
      </div>
    }>
      <PeoplePageContent />
    </Suspense>
  );
}
