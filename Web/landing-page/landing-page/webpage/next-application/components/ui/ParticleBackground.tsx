'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'leaf' | 'bubble' | 'co2' | 'seed' | 'droplet';
  rotation: number;
  rotationSpeed: number;
  color: string;
  pulsePhase: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Environmental colors
    const colors = [
      '#10b981', // emerald-500
      '#34d399', // emerald-400
      '#6ee7b7', // emerald-300
      '#059669', // emerald-600
      '#047857', // emerald-700
      '#22c55e', // green-500
      '#4ade80', // green-400
      '#16a34a', // green-600
    ];

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
      
      for (let i = 0; i < particleCount; i++) {
        const types: Particle['type'][] = ['leaf', 'bubble', 'co2', 'seed', 'droplet'];
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 8 + 3,
          opacity: Math.random() * 0.6 + 0.2,
          type: types[Math.floor(Math.random() * types.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    initParticles();

    // Draw different particle types
    const drawParticle = (particle: Particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 1;

      const pulseFactor = 1 + Math.sin(particle.pulsePhase) * 0.1;
      const size = particle.size * pulseFactor;

      switch (particle.type) {
        case 'leaf':
          // Draw leaf shape
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.6, size, 0, 0, Math.PI * 2);
          ctx.fill();
          // Leaf vein
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(0, size);
          ctx.strokeStyle = `${particle.color}80`;
          ctx.stroke();
          break;

        case 'bubble':
          // Draw bubble with highlight
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          // Bubble highlight
          ctx.beginPath();
          ctx.arc(-size * 0.2, -size * 0.2, size * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = `${particle.color}40`;
          ctx.fill();
          break;

        case 'co2':
          // Draw CO2 molecule (three connected circles)
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(-size * 0.6, 0, size * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(size * 0.6, 0, size * 0.25, 0, Math.PI * 2);
          ctx.fill();
          // Bonds
          ctx.beginPath();
          ctx.moveTo(-size * 0.35, 0);
          ctx.lineTo(-size * 0.25, 0);
          ctx.moveTo(size * 0.25, 0);
          ctx.lineTo(size * 0.35, 0);
          ctx.stroke();
          break;

        case 'seed':
          // Draw seed shape
          ctx.beginPath();
          ctx.ellipse(0, 0, size * 0.4, size * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
          // Seed lines
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-size * 0.2, -size * 0.4 + i * size * 0.4);
            ctx.lineTo(size * 0.2, -size * 0.4 + i * size * 0.4);
            ctx.strokeStyle = `${particle.color}60`;
            ctx.stroke();
          }
          break;

        case 'droplet':
          // Draw water droplet
          ctx.beginPath();
          ctx.arc(0, size * 0.2, size * 0.4, 0, Math.PI * 2);
          ctx.moveTo(0, -size * 0.2);
          ctx.quadraticCurveTo(-size * 0.3, 0, 0, size * 0.2);
          ctx.quadraticCurveTo(size * 0.3, 0, 0, -size * 0.2);
          ctx.fill();
          // Droplet highlight
          ctx.beginPath();
          ctx.arc(-size * 0.1, 0, size * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = `${particle.color}50`;
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position with environmental flow
        const flowX = Math.sin(particle.y * 0.01 + Date.now() * 0.0005) * 0.2;
        const flowY = Math.cos(particle.x * 0.01 + Date.now() * 0.0003) * 0.1;
        
        particle.x += particle.vx + flowX;
        particle.y += particle.vy + flowY;
        particle.rotation += particle.rotationSpeed;
        particle.pulsePhase += 0.02;

        // Wrap around screen
        if (particle.x < -50) particle.x = canvas.width + 50;
        if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        if (particle.y > canvas.height + 50) particle.y = -50;

        // Gentle opacity pulsing
        particle.opacity = 0.3 + Math.sin(particle.pulsePhase * 0.5) * 0.2;

        drawParticle(particle);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}