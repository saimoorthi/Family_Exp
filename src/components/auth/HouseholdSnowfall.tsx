import React, { useMemo } from 'react';
import {
  Home,
  ShoppingBag,
  Coffee,
  Utensils,
  Lightbulb,
  Zap,
  Key,
  Shirt,
  Apple,
  Droplets,
  Wifi,
  Tv,
  Heart,
  Smile,
  Package,
} from 'lucide-react';

const ICONS = [
  Home,
  ShoppingBag,
  Coffee,
  Utensils,
  Lightbulb,
  Zap,
  Key,
  Shirt,
  Apple,
  Droplets,
  Wifi,
  Tv,
  Heart,
  Smile,
  Package,
];

interface Particle {
  id: number;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  left: number; // percentage
  duration: number; // seconds
  delay: number; // negative delay so particles start mid-screen
  size: number; // pixels
  opacity: number;
  sway: number; // px
  rotation: number; // degrees
  colorClass: string;
}

export const HouseholdSnowfall: React.FC = () => {
  // Generate deterministic particles so there is zero re-render flutter
  const particles: Particle[] = useMemo(() => {
    // Greyscale tones as requested by user
    const greyscaleClasses = [
      'text-slate-400',
      'text-slate-500',
      'text-slate-300',
      'text-gray-400',
      'text-gray-500',
    ];

    const list: Particle[] = [];
    const count = 24;

    for (let i = 0; i < count; i++) {
      const Icon = ICONS[i % ICONS.length];
      const left = Math.round(2 + (i / count) * 94 + (Math.sin(i * 1.7) * 4));
      const duration = 8 + (i % 6) * 1.5; // 8s to 15.5s
      // Negative delays stagger the initial animation so screen is filled immediately
      const delay = -((i * 1.3) % duration);
      const size = 15 + (i % 5) * 2; // 15px to 23px
      const opacity = 0.15 + (i % 4) * 0.05; // 0.15 to 0.30
      const sway = (i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 5); // -30px to 30px
      const rotation = (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 10);
      const colorClass = greyscaleClasses[i % greyscaleClasses.length];

      list.push({
        id: i,
        Icon,
        left: Math.max(2, Math.min(96, left)),
        duration,
        delay,
        size,
        opacity,
        sway,
        rotation,
        colorClass,
      });
    }

    return list;
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {particles.map((p) => {
        const IconComponent = p.Icon;
        return (
          <div
            key={p.id}
            className={`absolute top-0 will-change-transform ${p.colorClass}`}
            style={
              {
                left: `${p.left}%`,
                animation: `snowfall ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
                '--snow-opacity': p.opacity,
                '--snow-sway': `${p.sway}px`,
                '--snow-rot': `${p.rotation}deg`,
              } as React.CSSProperties
            }
          >
            <IconComponent
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                filter: 'grayscale(100%)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
