'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ---- Canvas Starfield Background ----
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars: { x: number; y: number; size: number; speed: number; opacity: number; color: string }[] = [];

    const colors = [
      'rgba(255,255,255,',
      'rgba(255,255,255,',
      'rgba(255,255,255,',
      'rgba(0,217,255,',
      'rgba(16,185,129,',
    ];

    const init = () => {
      stars.length = 0;
      for (let i = 0; i < 400; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.3,
          speed: Math.random() * 0.4 + 0.05,
          opacity: Math.random() * 0.7 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    resize();
    window.addEventListener('resize', resize);

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${star.opacity})`;
        ctx.fill();
        star.y -= star.speed;
        if (star.y < -2) {
          star.y = canvas.height + 2;
          star.x = Math.random() * canvas.width;
        }
      }
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}

// ---- HUD Scanning Line ----
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute left-0 w-full h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,217,255,0.15), transparent)',
          animation: 'scan-line 8s linear infinite',
        }}
      />
    </div>
  );
}

// ---- Animated Counter ----
function AnimatedCounter({ target, label, suffix = '' }: { target: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-mono text-4xl md:text-5xl font-bold text-cyan-400">
        {count}{suffix}
      </div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-3 font-mono">{label}</div>
    </div>
  );
}

// ---- Feature Card ----
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="border border-zinc-800/50 p-6 bg-zinc-900/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/20 hover:bg-cyan-500/5 group">
      <div className="text-2xl text-cyan-500/60 mb-4 group-hover:text-cyan-400 transition-colors">{icon}</div>
      <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-300 mb-3">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ---- Main Landing Page ----
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-[#060a1e] text-[#e0e7ff] min-h-screen"
      style={{ scrollSnapType: 'y mandatory', overflowY: 'auto', height: '100vh' }}>

      {/* ====== HERO ====== */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ scrollSnapAlign: 'start' }}>
        <Starfield />
        <ScanLine />

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(0,217,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,217,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'grid-pulse 4s ease-in-out infinite',
        }} />

        {/* Exhaust trail */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(0,217,255,0.4), rgba(16,185,129,0.1), transparent)',
          animation: 'exhaust-trail 4s ease-out infinite',
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }} />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <p
            className="text-xs font-mono text-zinc-500 uppercase mb-8"
            style={{
              letterSpacing: '0.4em',
              animation: mounted ? 'fade-up 1s ease-out 0.2s both' : 'none',
            }}
          >
            Global Spacecraft Surveillance
          </p>

          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-extralight uppercase"
            style={{
              animation: mounted ? 'title-reveal 2s ease-out 0.5s both' : 'none',
            }}
          >
            MERIDIAN
          </h1>

          <div
            className="flex items-center justify-center gap-3 mt-4"
            style={{ animation: mounted ? 'fade-up 1s ease-out 1.5s both' : 'none' }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <span className="text-emerald-400 text-2xl font-light">.</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>

          <p
            className="text-sm md:text-base text-zinc-400 mt-10 max-w-lg font-light leading-relaxed text-center mx-auto"
            style={{ animation: mounted ? 'fade-up 1s ease-out 2s both' : 'none' }}
          >
            Every satellite. Every launch. Tracked in real time across the entire orbital envelope.
          </p>

          <Link
            href="/tracker"
            className="inline-block mt-14 px-12 py-4 border border-cyan-500/30 text-cyan-400 text-sm font-mono uppercase transition-all duration-300 hover:bg-cyan-500/10 hover:border-cyan-400/60"
            style={{
              letterSpacing: '0.3em',
              animation: mounted ? 'fade-up 1s ease-out 2.5s both, glow-pulse 3s ease-in-out 3.5s infinite' : 'none',
            }}
          >
            Enter Meridian
          </Link>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
        >
          <span className="text-[10px] font-mono text-zinc-600 uppercase" style={{ letterSpacing: '0.3em' }}>Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>
      </section>

      {/* ====== SYSTEM OVERVIEW ====== */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-6"
        style={{ scrollSnapAlign: 'start' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a1e] via-[#0a0e27] to-[#060a1e]" />

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <p className="text-[10px] font-mono text-zinc-600 uppercase text-center mb-16"
            style={{ letterSpacing: '0.4em' }}>
            System Overview
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-20">
            <AnimatedCounter target={80} label="Satellites Tracked" suffix="+" />
            <AnimatedCounter target={12} label="Space Agencies" suffix="+" />
            <AnimatedCounter target={15} label="Upcoming Launches" />
            <AnimatedCounter target={30} label="Second Refresh" suffix="s" />
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="◎"
              title="Real-Time Propagation"
              description="SGP4 orbital mechanics compute live positions from TLE data every 30 seconds."
            />
            <FeatureCard
              icon="◈"
              title="Multi-Agency Coverage"
              description="NASA, ESA, ISRO, JAXA, CNSA, NOAA and more. Every major space operator tracked."
            />
            <FeatureCard
              icon="◉"
              title="Launch Monitoring"
              description="Upcoming rocket launches from pads worldwide with live countdown timers."
            />
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24"
        style={{ scrollSnapAlign: 'start', minHeight: '50vh' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a1e] to-[#04071a]" />

        <div className="relative z-10 text-center">
          <p className="font-mono text-zinc-600 text-[10px] uppercase mb-8"
            style={{ letterSpacing: '0.4em' }}>
            Ready for Acquisition
          </p>

          <Link
            href="/tracker"
            className="inline-block px-14 py-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-mono uppercase transition-all duration-300 hover:bg-cyan-500/20 hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(0,217,255,0.3)]"
            style={{ letterSpacing: '0.3em' }}
          >
            Launch Tracker
          </Link>

          <div className="mt-20 flex items-center justify-center gap-6 text-zinc-700 text-xs font-mono">
            <span>MERIDIAN<span className="text-emerald-400/40">.</span>ACTUAL</span>
            <span className="text-zinc-800">|</span>
            <span>Mk.1</span>
          </div>
        </div>
      </section>
    </div>
  );
}
