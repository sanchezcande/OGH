import { useState, useEffect } from "react";

const useMediaQuery = (query) => {
  // Siempre inicializar con false para SSR safety
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Función para actualizar el estado
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Establecer el valor inicial
    setMatches(mediaQuery.matches);

    // Agregar listener
    if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  // Retornar false durante SSR, matches después del mount
  return mounted ? matches : false;
};

export default useMediaQuery;
