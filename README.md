# Molva — Visualizador & Repositorio de Playlists de Tune Tracker

Una plataforma web abierta, moderna y minimalista (estética Blanco y Negro) concebida exclusivamente como **visualizador y repositorio discográfico** para las playlists curadas en **Tune Tracker**.

---

## 🎧 Integración con Tune Tracker

Molva se conecta de forma directa a la base de datos PostgreSQL en la nube (**Supabase**) de Tune Tracker (`spotitracker_curator`).

1. **Sincronización Automática**: Lee en tiempo real las playlists semestrales y selecciones curadas en Tune Tracker, incluyendo el orden de pistas, metadatos y el conteo de **streams / reproducciones** de cada tema.
2. **Personalización Discográfica**: Desde el panel de curador (`/admin`), se pueden enriquecer las selecciones con:
   - Portada personalizada de alta resolución con extracción dinámica de color (**Ambient Glow**).
   - Formato discográfico (`Semestral`, `LP`, `EP`, `Compilación`, etc.).
   - Código de catálogo oficial (ej. `TT-2026-02`).
   - **Liner Notes & Memoria Conceptual**: La historia y contexto detrás de la selección.
   - **Notas individuales por canción**: Comentarios curatoriales tema por tema.
   - Enlaces a Spotify y YouTube Music.
3. **Persistencia Dual**: Las personalizaciones se sincronizan directamente con la base de datos en la nube y cuentan con respaldo offline instantáneo en **IndexedDB** / LocalStorage.

---

## 🛠️ Tecnologías

* **Framework**: Next.js 15 (App Router) + TypeScript
* **Estilos**: Tailwind CSS + Lucide Icons
* **Base de Datos**: Supabase (PostgreSQL + REST API)
* **Despliegue**: Compatible con Vercel

---

## 📦 Configuración y Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://znbihwazambtwjwizmsn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_C7JjbD4TMFzBGysYO835GQ_s1rRzvm-
   ADMIN_PASSWORD=canon123
   ```

3. Ejecutar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador: [http://localhost:3000](http://localhost:3000)
