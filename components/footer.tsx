"use client";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <p className="text-white/20 text-xs font-light">
          {currentYear} • Pensado por Ernesto Cruz - Hecho con ayuda de IA
        </p>
      </div>
    </footer>
  );
}

