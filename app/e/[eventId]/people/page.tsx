// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, TrackballControls, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import StarsBackground from "@/components/stars-background";

interface Person {
  nombre: string;
  tipo: "owner" | "anfitrion" | "invitado";
}

// Componente Word con profundidad real basada en distancia Z
function Word({ children, ...props }: any) {
  const color = new THREE.Color();
  const ref = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);
  
  const baseFontSize = props.fontSize || 1.0;
  const position = useMemo(() => new THREE.Vector3(...props.position), [props.position]);
  
  const over = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };
  
  const out = () => {
    setHovered(false);
  };
  
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);
  
  // Calcular profundidad real basada en distancia Z desde la cámara
  useFrame(() => {
    if (!ref.current || !groupRef.current || !camera) return;
    
    // Obtener posición mundial
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    
    // Vector desde la cámara al objeto
    const cameraToObject = worldPos.clone().sub(camera.position);
    
    // Vector forward de la cámara (hacia donde mira)
    const cameraForward = new THREE.Vector3(0, 0, -1);
    cameraForward.applyQuaternion(camera.quaternion);
    
    // Calcular profundidad usando producto punto
    const objectDir = cameraToObject.normalize();
    const dot = objectDir.dot(cameraForward);
    
    // Normalizar: -1 (atrás) a 1 (frente) -> 0 a 1
    const depthFactor = Math.max(0.3, (dot + 1) / 2);
    
    // Aplicar curva suave para transición natural
    const smoothDepth = Math.pow(depthFactor, 1.5);
    
    // Escala basada en profundidad: fondo 0.4x, frente 1.0x
    const scale = 0.4 + (smoothDepth * 0.6);
    
    // Opacidad basada en profundidad: fondo 0.4, frente 1.0
    const opacity = 0.4 + (smoothDepth * 0.6);
    
    // Aplicar escala
    groupRef.current.scale.setScalar(scale);
    
    // Aplicar color
    if (ref.current.material?.color) {
      const targetColor = hovered ? '#c084fc' : 'white';
      ref.current.material.color.lerp(color.set(targetColor), 0.1);
    }
    
    // Aplicar opacidad
    if (ref.current.material?.opacity !== undefined) {
      ref.current.material.opacity = opacity;
      ref.current.material.transparent = true;
    }
  });
  
  return (
    <Billboard position={position}>
      <group ref={groupRef}>
        <Text
          ref={ref}
          onPointerOver={over}
          onPointerOut={out}
          fontSize={baseFontSize}
          letterSpacing={-0.05}
          lineHeight={1}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          color="white"
          material-toneMapped={false}
        >
          {children}
        </Text>
      </group>
    </Billboard>
  );
}

// Distribución esférica exactamente como el ejemplo
function Cloud({ people, radius }: { people: Person[]; radius: number }) {
  const words = useMemo(() => {
    const temp: Array<[THREE.Vector3, string]> = [];
    const spherical = new THREE.Spherical();
    const count = Math.ceil(Math.sqrt(people.length)) || 4;
    const phiSpan = Math.PI / (count + 1);
    const thetaSpan = (Math.PI * 2) / count;
    
    let index = 0;
    for (let i = 1; i < count + 1; i++) {
      for (let j = 0; j < count && index < people.length; j++) {
        const pos = new THREE.Vector3().setFromSpherical(
          spherical.set(radius, phiSpan * i, thetaSpan * j)
        );
        temp.push([pos, people[index].nombre]);
        index++;
      }
    }
    return temp;
  }, [people, radius]);
  
  // Tamaño de fuente mucho más pequeño, como en la referencia
  const baseFontSize = useMemo(() => {
    const count = people.length;
    // Fuentes pequeñas para que se vean bien en móvil y se aprecie la esfera
    if (count === 1) return 1.0;
    if (count === 2) return 0.9;
    if (count === 3) return 0.85;
    if (count <= 5) return 0.8;
    if (count <= 8) return 0.75;
    if (count <= 15) return 0.7;
    return 0.6; // Muchas palabras: muy pequeñas
  }, [people.length]);
  
  return (
    <>
      {words.map(([pos, nombre], index) => {
        // Tamaños diferentes según tipo
        const fontSize = people[index]?.tipo === "owner" 
          ? baseFontSize * 1.3 
          : people[index]?.tipo === "anfitrion" 
          ? baseFontSize * 1.1 
          : baseFontSize;
        
        return (
          <Word key={`${nombre}-${index}`} position={pos} fontSize={fontSize}>
            {nombre}
          </Word>
        );
      })}
    </>
  );
}

function SphereScene({ people }: { people: Person[] }) {
  const sortedPeople = useMemo(() => {
    const owner = people.find((p) => p.tipo === "owner");
    const anfitriones = people.filter((p) => p.tipo === "anfitrion");
    const invitados = people.filter((p) => p.tipo === "invitado");
    return [...(owner ? [owner] : []), ...anfitriones, ...invitados];
  }, [people]);

  // Radio que escala con la cantidad, pensado para esfera visible
  const radius = useMemo(() => {
    const count = sortedPeople.length;
    // Para pocas palabras: esfera pequeña pero visible
    if (count === 1) return 8;
    if (count === 2) return 10;
    if (count === 3) return 12;
    if (count <= 5) return 14;
    if (count <= 8) return 16;
    if (count <= 10) return 18;
    if (count <= 15) return 19;
    return 20; // Muchas palabras: tamaño completo
  }, [sortedPeople.length]);

  // Distancia de cámara optimizada para ver bien la esfera
  const cameraDistance = useMemo(() => {
    const count = sortedPeople.length;
    // Para pocas palabras: más cerca para verlas bien
    if (count === 1) return radius * 2.5;
    if (count <= 3) return radius * 2.2;
    if (count <= 5) return radius * 2.0;
    // Para muchas palabras: distancia estándar
    return radius * 1.75;
  }, [radius, sortedPeople.length]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, cameraDistance], fov: 90 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', background: "#202025" }}
    >
      <fog attach="fog" args={['#202025', 0, 80]} />
      <Suspense fallback={null}>
        <group rotation={[10, 10.5, 10]}>
          <Cloud people={sortedPeople} radius={radius} />
        </group>
      </Suspense>
      <TrackballControls />
    </Canvas>
  );
}

function PeoplePageContent() {
  const params = useParams();
  const eventId = params?.eventId as string;
  
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
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative">
        <StarsBackground />
        <div className="text-xl relative z-10">Cargando invitados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative">
        <StarsBackground />
        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-2xl font-bold text-red-400">Error</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative">
        <StarsBackground />
        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-2xl font-bold">No tienes acceso</h2>
          <p className="text-white/70">Debes aceptar la invitación para ver los invitados confirmados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202025] text-white relative">

      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
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

      <div className="fixed inset-0 top-20 md:top-24 z-0 w-full h-full">
        <SphereScene people={people} />
      </div>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <StarsBackground />
        <div className="text-xl relative z-10">Cargando...</div>
      </div>
    }>
      <PeoplePageContent />
    </Suspense>
  );
}
