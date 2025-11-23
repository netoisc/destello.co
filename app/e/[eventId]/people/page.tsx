// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, TrackballControls, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const responseCookie = allCookies.find((row) => row.startsWith(`destello_response_${eventId}`));
        
        const isOwner = !!ownerCookie;
        const hasAccepted = responseCookie?.split("=")[1] === "yes";
        
        if (!isOwner && !hasAccepted) {
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
          .select("nombre")
          .eq("event_id", eventId)
          .eq("response", "yes");

        if (cancelled) return;

        const peopleList: Person[] = [
          { nombre: event.owner_nombre, tipo: "owner" as const },
        ];

        if (event.anfitriones) {
          event.anfitriones
            .split(",")
            .map((a: string) => a.trim())
            .filter(Boolean)
            .forEach((nombre: string) => {
              peopleList.push({ nombre, tipo: "anfitrion" as const });
            });
        }

        if (guests) {
          guests.forEach((g) => {
            peopleList.push({ nombre: g.nombre, tipo: "invitado" as const });
          });
        }

        if (!cancelled) {
          setEventName(event.nombre);
          setPeople(peopleList);
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

  if (people.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No tienes acceso</h2>
          <p className="text-white/70">Debes aceptar la invitación para ver los invitados confirmados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'transparent' }}>

      {/* Canvas 3D con la esfera */}
      <div className="fixed inset-0 top-20 md:top-24" style={{ zIndex: 2 }}>
        <SphereScene people={people} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6" style={{ zIndex: 30 }}>
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {eventName}
          </h1>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/60 to-purple-500/30 flex-1 max-w-16" />
              <h2 className="text-xs md:text-sm font-semibold text-white/90 tracking-[0.2em] uppercase">
                Personas que asistirán
              </h2>
              <div className="h-px bg-gradient-to-r from-pink-500/30 via-pink-500/60 to-transparent flex-1 max-w-16" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-sm md:text-base text-purple-300 font-mono tabular-nums tracking-wider">
                {people.length} {people.length === 1 ? "confirmado" : "confirmados"}
              </span>
              <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
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
