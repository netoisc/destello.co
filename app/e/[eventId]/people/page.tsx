// @ts-nocheck
"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "@/lib/supabase";
import StarsBackground from "@/components/stars-background";

interface Person {
  nombre: string;
  tipo: "owner" | "anfitrion" | "invitado";
}

// Componente para cada nombre en la nube
function WordOnSphere({
  nombre,
  tipo,
  index,
  total,
  radius,
  hoveredPoint,
}: {
  nombre: string;
  tipo: "owner" | "anfitrion" | "invitado";
  index: number;
  total: number;
  radius: number;
  hoveredPoint: THREE.Vector3 | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Calcular posición inicial en la superficie de la esfera usando distribución uniforme (Fibonacci)
  const initialPosition = useMemo(() => {
    // Para pocos elementos, usamos una distribución más aleatoria/orgánica
    // Para muchos, mantenemos la esfera pero con variaciones
    if (total < 15) {
      // Distribución más "nube" y menos "esfera perfecta"
      const phi = Math.acos(-1 + (2 * index) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;

      // Añadir variación aleatoria (seed pseudo-random basado en index)
      const randomOffset = (index % 3) * 0.1;

      return new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi) + randomOffset,
        radius * Math.sin(theta) * Math.sin(phi) + randomOffset,
        radius * Math.cos(phi)
      );
    }

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const theta = goldenAngle * index;
    const y = 1 - (index / (total - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    return new THREE.Vector3(x * radius, y * radius, z * radius);
  }, [index, total, radius]);

  const color = useMemo(() => {
    switch (tipo) {
      case "owner":
        return "#ff6b9d"; // Rosa brillante
      case "anfitrion":
        return "#c084fc"; // Violeta
      default:
        return "#e2e8f0"; // Blanco grisáceo
    }
  }, [tipo]);

  // Escala basada en distancia al punto de hover
  const scale = useRef(1);
  const currentScale = useRef(1);
  const opacity = useRef(1);
  const currentOpacity = useRef(1);

  // Tamaño de fuente adaptativo
  const baseFontSize = useMemo(() => {
    // Si hay pocos, la fuente es MUCHO más grande
    if (total <= 5) return 0.5;
    if (total <= 15) return 0.35;

    // Normal
    const sizeFactor = Math.max(0.08, Math.min(0.14, radius / 40));
    switch (tipo) {
      case "owner":
        return radius * sizeFactor * 0.5;
      case "anfitrion":
        return radius * sizeFactor * 0.4;
      default:
        return radius * sizeFactor * 0.3;
    }
  }, [tipo, radius, total]);

  // Fase aleatoria para la animación de flotación
  const floatPhase = useMemo(() => Math.random() * Math.PI * 2, []);

  // Actualizar posición, escala y opacidad
  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Animación de flotación suave
    const floatOffset = new THREE.Vector3(
      Math.sin(time * 0.5 + floatPhase) * 0.1,
      Math.cos(time * 0.3 + floatPhase) * 0.1,
      Math.sin(time * 0.4 + floatPhase) * 0.1
    );

    // Posición base + flotación
    const targetPos = initialPosition.clone().add(floatOffset);
    groupRef.current.position.lerp(targetPos, 0.1);

    // Calcular escala y opacidad basada en distancia al punto de hover
    if (hoveredPoint) {
      const distance = initialPosition.distanceTo(hoveredPoint);
      const maxDistance = radius * 1.5;

      // Efecto "lupa" más suave y amplio
      if (distance < radius * 1.0) {
        const boost = 1 + (1 - distance / (radius * 1.0)) * 0.8;
        scale.current = boost;
        opacity.current = 1;
      } else {
        scale.current = 1;
        opacity.current = 0.3; // Más transparente los lejanos
      }
    } else {
      scale.current = 1;
      opacity.current = 1;
    }

    // Interpolar valores suavemente
    currentScale.current += (scale.current - currentScale.current) * 0.1;
    currentOpacity.current += (opacity.current - currentOpacity.current) * 0.1;

    groupRef.current.scale.setScalar(currentScale.current);

    // Hacer que el texto mire hacia la cámara
    if (groupRef.current && camera) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[initialPosition.x, initialPosition.y, initialPosition.z]}
    >
      <Text
        fontSize={baseFontSize * currentScale.current}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={total < 10 ? 0.02 : radius * 0.002} // Outline más grueso si son pocos
        outlineColor="#000000"
        fillOpacity={currentOpacity.current}
        outlineOpacity={currentOpacity.current}
        font="/fonts/Inter-Bold.woff" // Asumiendo fuente standard, si falla usará default
      >
        {nombre}
      </Text>
    </group>
  );
}

// Componente principal del word cloud
function SphericalWordCloud({
  people,
  setHoveredPoint,
  radius
}: {
  people: Person[];
  setHoveredPoint: (point: THREE.Vector3 | null) => void;
  radius: number;
}) {
  const { camera } = useThree();
  const [internalHover, setInternalHover] = useState<THREE.Vector3 | null>(null);

  // Ordenar personas: Owner siempre visible, resto mezclado para look orgánico
  const sortedPeople = useMemo(() => {
    const owner = people.find((p) => p.tipo === "owner");
    const others = people.filter((p) => p.tipo !== "owner");

    // Mezclar aleatoriamente los otros para que no se agrupen por tipo artificialmente
    // pero manteniendo consistencia con un seed simple si fuera necesario
    // Aquí usamos sort random simple
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    return [
      ...(owner ? [owner] : []),
      ...shuffledOthers,
    ];
  }, [people]);

  // Manejador de movimiento del mouse sobre la esfera invisible de detección
  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    setInternalHover(point);
    setHoveredPoint(point);
  };

  const handlePointerLeave = () => {
    setInternalHover(null);
    setHoveredPoint(null);
  };

  // Mover cámara suavemente
  useFrame((state, delta) => {
    const distance = radius * 2.8;

    if (internalHover) {
      // Acercar ligeramente y mirar al punto
      const direction = internalHover.clone().normalize();
      const targetPos = direction.multiplyScalar(distance * 0.8);

      camera.position.lerp(targetPos, delta * 1.0);
      // No forzamos lookAt aquí para no marear, dejamos que OrbitControls maneje el centro
    }
  });

  return (
    <>
      {/* Esfera invisible para detectar eventos del mouse/touch */}
      <mesh
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        visible={false}
      >
        <sphereGeometry args={[radius * 1.1, 32, 32]} /> {/* Un poco más grande para facilitar hover */}
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>

      {/* Nombres flotantes */}
      {sortedPeople.map((person, index) => (
        <WordOnSphere
          key={`${person.tipo}-${person.nombre}-${index}`}
          nombre={person.nombre}
          tipo={person.tipo}
          index={index}
          total={sortedPeople.length}
          radius={radius}
          hoveredPoint={internalHover}
        />
      ))}
    </>
  );
}

function WordCloudScene({ people }: { people: Person[] }) {
  const [isHovering, setIsHovering] = useState(false);

  // Calcular radio y configuración de cámara adaptativa
  const config = useMemo(() => {
    const count = people.length;

    if (count <= 5) {
      return {
        radius: 1.2, // Muy compacto
        cameraDist: 2.5, // Cerca
        fov: 55
      };
    }
    if (count <= 15) {
      return {
        radius: 1.8,
        cameraDist: 3.5,
        fov: 50
      };
    }
    // Muchos
    const r = Math.min(3.5, 2.0 + (count * 0.05));
    return {
      radius: r,
      cameraDist: r * 2.5,
      fov: 45
    };
  }, [people.length]);

  return (
    <Canvas
      camera={{ position: [0, 0, config.cameraDist], fov: config.fov }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff6b9d" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c084fc" />

      {/* Niebla para dar profundidad */}
      <fog attach="fog" args={['#000000', config.cameraDist * 1.5, config.cameraDist * 3]} />

      <SphericalWordCloud
        people={people}
        radius={config.radius}
        setHoveredPoint={(point) => setIsHovering(!!point)}
      />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={config.radius * 1.2}
        maxDistance={config.radius * 5}
        autoRotate={!isHovering}
        autoRotateSpeed={0.5} // Rotación muy lenta y elegante
        dampingFactor={0.05}
        enableDamping={true}
        rotateSpeed={0.3}
      />
    </Canvas>
  );
}

function PeoplePageContent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [people, setPeople] = useState<Person[]>([]);
  const [eventName, setEventName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

        const { data: guests, error: guestsError } = await supabase
          .from("guests")
          .select("nombre, opciones_seleccionadas")
          .eq("event_id", eventId)
          .eq("response", "yes");

        if (guestsError) {
          console.error("Error loading guests:", guestsError);
        }

        if (cancelled) return;

        const peopleList: Person[] = [
          { nombre: event.owner_nombre, tipo: "owner" as const },
        ];

        if (event.anfitriones) {
          const anfitrionesList = event.anfitriones
            .split(",")
            .map((a: string) => a.trim())
            .filter(Boolean);
          peopleList.push(
            ...anfitrionesList.map((nombre: string) => ({
              nombre,
              tipo: "anfitrion" as const,
            }))
          );
        }

        if (guests) {
          peopleList.push(
            ...guests.map((g) => ({
              nombre: g.nombre,
              tipo: "invitado" as const,
            }))
          );
        }

        setEventName(event.nombre);
        setPeople(peopleList);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error loading data:", err);
          setError(err.message || "Error al cargar los datos");
          setLoading(false);
        }
      }
    };

    if (eventId) {
      loadPeople();
    }

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
    <div className="min-h-screen bg-black text-white relative">
      {/* Mismo background de estrellas del home */}
      <StarsBackground />

      {/* Panel de información compacto */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
            {eventName}
          </h1>
          <p className="text-white/60 text-xs md:text-sm">
            {people.length} {people.length === 1 ? "persona" : "personas"}
          </p>
        </div>
      </div>

      {/* Esfera 3D centrada - tamaño controlado para móvil y desktop */}
      <div className="h-screen w-full relative z-0 flex items-center justify-center px-4">
        <div className="w-full h-full max-w-2xl max-h-2xl md:max-w-3xl md:max-h-3xl">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-white/60 text-sm">Cargando...</div>
            </div>
          }>
            <WordCloudScene people={people} />
          </Suspense>
        </div>
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
