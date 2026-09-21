'use client';

import React from 'react';
import Image from 'next/image';
import { X, ExternalLink } from 'lucide-react';

interface ArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export function ArtworkModal({ isOpen, onClose, imageUrl, title }: ArtworkModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-xs font-mono text-zinc-400">
          <span className="truncate max-w-[80%] uppercase tracking-wider">{title} — Artwork Oficial</span>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Resolución completa</span>
          <a 
            href={imageUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <span>Abrir imagen original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
