// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, TrackballControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

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
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'transparent' }}>
      {/* Header - posición absoluta sobre todo */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-6 z-30">
        <div className="max-w-7xl mx-auto space-y-2 md:space-y-4">
          <div>
            <h1 className="text-base md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              {eventName}
            </h1>
            {eventDate && (
              <>
                {/* Formato compacto para móvil */}
                <p className="text-white/60 text-[10px] md:hidden mt-0.5 leading-tight">
                  {new Date(eventDate).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {/* Formato completo para desktop */}
                <p className="hidden md:block text-white/60 text-sm mt-1 leading-tight">
                  {new Date(eventDate).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </>
            )}
          </div>
          
          <div className="flex flex-col gap-1 md:gap-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/60 to-purple-500/30 flex-1 max-w-12 md:max-w-16" />
              <h2 className="text-[10px] md:text-sm font-semibold text-white/90 tracking-[0.15em] md:tracking-[0.2em] uppercase">
                Personas que asistirán
              </h2>
              <div className="h-px bg-gradient-to-r from-pink-500/30 via-pink-500/60 to-transparent flex-1 max-w-12 md:max-w-16" />
            </div>
            <div className="flex items-center justify-center gap-1.5 md:gap-2">
              <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs md:text-base text-purple-300 font-mono tabular-nums tracking-wider">
                {people.length} {people.length === 1 ? "confirmado" : "confirmados"}
              </span>
              <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Canvas 3D con la esfera - altura relativa al viewport, más compacta en desktop */}
      <div className="fixed inset-0 top-28 md:top-24 bottom-auto" style={{ height: '70vh', minHeight: '400px', maxHeight: 'calc(100vh - 200px)' }}>
        <SphereScene people={people} />
      </div>

      {/* Chips de opciones seleccionadas y no seleccionadas - siempre visibles en la parte inferior */}
      {(opcionesSeleccionadas.length > 0 || todasLasOpciones.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 p-3 md:p-6 pb-20 md:pb-6 z-20">
          <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
            {/* Opciones seleccionadas */}
            {opcionesSeleccionadas.length > 0 && (
              <div>
                <p className="text-white/40 text-[10px] md:text-xs text-center mb-1.5 md:mb-2 font-light">
                  Algunos invitados llevarán:
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {opcionesSeleccionadas.map((opcion, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-full text-white/90 backdrop-blur-sm text-[11.4px] md:text-[12.6px] px-[5.94px] py-[2.38px] md:px-[6.21px] md:py-[2.82px] leading-tight"
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
                  <p className="text-white/30 text-[10px] md:text-xs text-center mb-1.5 md:mb-2 font-light">
                    Cosas que nadie ha elegido 🥲, pero aún puedes llevar 😍
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {opcionesNoSeleccionadas.map((opcion, index) => (
                      <span
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-full text-white/50 backdrop-blur-sm text-[11.4px] md:text-[12.6px] px-[5.94px] py-[2.38px] md:px-[6.21px] md:py-[2.82px] leading-tight"
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
