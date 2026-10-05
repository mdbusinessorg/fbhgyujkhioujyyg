"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo cinemático de lançamento do MÔ SALO.
 * - Lazy: só carrega o ficheiro quando entra no viewport (rootMargin generoso).
 * - Respeita prefers-reduced-motion e Save-Data (mostra apenas o poster).
 * - Poster + reprodução manual via botão.
 *
 * Uso: <HeroLaunchVideo /> em qualquer página. Não altera rotas nem dados.
 */
export default function HeroLaunchVideo({
  src = "/launch/mosalo-launch.mp4",
  poster = "/launch/poster.jpg",
  className = "",
}: {
  src?: string;
  poster?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  const reducedData =
    typeof navigator !== "undefined" &&
    // @ts-expect-error — saveData não existe em todos os browsers
    (navigator.connection?.saveData === true ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (reducedData) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedData]);

  const play = () => {
    setPlaying(true);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden rounded-2xl bg-[#05070f] ${className}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      {visible && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="none"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          className="h-full w-full object-cover"
        />
      )}
      {!playing && (
        <button
          onClick={play}
          aria-label="Reproduzir vídeo de apresentação do Mô Salo"
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl">
            <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
