import { useEffect, useRef, useState } from "react";
import introVideo from "@/assets/logo-intro.mp4.asset.json";

const HOLD_MS = 3000;
const FADE_MS = 550;

/**
 * Full-screen brand animation shown once per browser session before the app UI.
 * Renders on top of everything, plays the logo clip, then fades away.
 */
export function SplashIntro() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = sessionStorage.getItem("thermaflux-intro") === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    try {
      sessionStorage.setItem("thermaflux-intro", "1");
    } catch {
      /* ignore */
    }
    setShow(true);
    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const t2 = window.setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  const skip = () => {
    setLeaving(true);
    window.setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
    }, 250);
  };

  if (!mounted || !show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#070b16] transition-opacity duration-500"
      style={{ opacity: leaving ? 0 : 1 }}
      role="presentation"
    >
      <video
        ref={videoRef}
        className="size-full max-h-screen object-contain"
        src={introVideo.url}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-16 text-center">
        <p className="font-display text-lg font-extrabold tracking-[0.35em] text-white/90 sm:text-2xl">
          THERMAFLUX
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/55">
          Flow &amp; Thermal Studio
        </p>
      </div>
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-5 right-5 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/10"
      >
        Skip
      </button>
    </div>
  );
}
