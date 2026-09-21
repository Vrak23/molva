'use client';

import React, { useEffect, useState } from 'react';
import { extractDominantColor } from '@/lib/color-extract';

interface AmbientGlowProps {
  color?: string;
  imageUrl?: string;
  opacity?: number;
}

export function AmbientGlow({ color, imageUrl, opacity = 0.35 }: AmbientGlowProps) {
  const [activeColor, setActiveColor] = useState<string>(color || '#262626');

  useEffect(() => {
    if (color) {
      setActiveColor(color);
      return;
    }

    if (imageUrl) {
      extractDominantColor(imageUrl).then((extracted) => {
        setActiveColor(extracted);
      });
    }
  }, [color, imageUrl]);

  return (
    <div 
      aria-hidden="true" 
      className="ambient-glow"
      style={{
        backgroundColor: activeColor,
        opacity: opacity,
      }}
    />
  );
}
