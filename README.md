# Molva — Plataforma de Curaduría y Lanzamientos Sonoros

Una plataforma web abierta, moderna y minimalista (estética Blanco y Negro) para descubrir, crear y compartir playlists concebidas como lanzamientos discográficos (estilo álbumes).

## Características Principales

* **Lanzamientos tipo Álbum**: Clasificación por formatos (`LP`, `EP`, `Mixtape`, `Compilación`, `Sesión`), fecha de estreno, duración total calculada y código de catálogo.
* **Ficha Técnica & Liner Notes**: Historias detrás de cada selección musical y notas individuales comentadas para cada canción (*Track Notes*).
* **Efecto Ambient Glow Dinámico**: Extracción automática del color dominante de la portada con difuminado suave (*mesh glow*) sobre lienzo B&W.
* **Importación Automática**: Extrae títulos, artistas, duraciones y portadas pegando enlaces públicos de **Spotify** o **YouTube**.
* **Perfiles Públicos de Curador (`/u/[username]`)**: Páginas individuales con avatar, biografía, enlaces a Spotify/Last.fm y catálogo de lanzamientos.
* **Almacenamiento Dual**: Conexión nativa a **Supabase (PostgreSQL)** y fallback local con **IndexedDB**.
* **Diseño Minimalista Estricto**: Sin emojis, tipografía refinada y navegación fluida con botones de retroceso.

---

## Tecnologías

* **Framework**: Next.js 15 (App Router) + TypeScript
* **Estilos**: Tailwind CSS + Lucide Icons
* **Base de Datos**: Supabase PostgreSQL
* **Despliegue**: Compatible con Vercel

---

## Configuración y Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ADMIN_PASSWORD=canon123
   ```

3. Ejecutar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador: [http://localhost:3000](http://localhost:3000)
