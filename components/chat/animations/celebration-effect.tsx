'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  delay: number;
  duration: number;
  size: number;
}

interface CelebrationEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  variant?: 'sparkles' | 'confetti' | 'fireworks';
  duration?: number;
  className?: string;
}

const SPARKLE_EMOJIS = ['✨', '⭐', '💫', '🌟'];
const CONFETTI_EMOJIS = ['🎉', '🎊', '🎈', '🥳', '🎁'];
const FIREWORK_EMOJIS = ['🎆', '🎇', '💥', '⚡'];

function generateParticles(variant: string): Particle[] {
  const emojis = variant === 'confetti'
    ? CONFETTI_EMOJIS
    : variant === 'fireworks'
    ? FIREWORK_EMOJIS
    : SPARKLE_EMOJIS;

  const particleCount = variant === 'confetti' ? 15 : 10;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 500,
      duration: 500 + Math.random() * 1000,
      size: 12 + Math.random() * 12,
    });
  }

  return particles;
}

export function CelebrationEffect({
  isActive,
  onComplete,
  variant = 'sparkles',
  duration = 2000,
  className,
}: CelebrationEffectProps) {
  const [particleKey, setParticleKey] = useState(0);

  // Generate particles when active changes
  const particles = useMemo(() => {
    if (!isActive) return [];
    return generateParticles(variant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, variant, particleKey]);

  // Handle completion timer
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      setParticleKey((k) => k + 1);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, duration, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none z-[100] overflow-hidden',
        className
      )}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute animate-celebration"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}px`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        >
          {particle.emoji}
        </span>
      ))}

      <style jsx>{`
        @keyframes celebration {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-30px) scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.5) rotate(360deg);
          }
        }
        .animate-celebration {
          animation: celebration ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Mini celebration for inline use (e.g., within messages)
interface MiniCelebrationProps {
  isActive: boolean;
  className?: string;
}

export function MiniCelebration({ isActive, className }: MiniCelebrationProps) {
  if (!isActive) return null;

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {SPARKLE_EMOJIS.slice(0, 3).map((emoji, index) => (
        <span
          key={index}
          className="animate-bounce text-sm"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {emoji}
        </span>
      ))}
    </span>
  );
}
