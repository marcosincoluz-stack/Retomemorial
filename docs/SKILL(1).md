---
name: aceternity-ui
description: "Ultra-professional motion framework for Aceternity UI. Contains a full hyper-linked registry of 97 components and blocks. Specialized in Framer Motion, Tailwind animations, and high-end landing page visuals."
---

# ✨ Aceternity UI | The Comprehensive Motion Index

Este módulo es una **base de datos exhaustiva** de navegación para la IA. Al activar `@aceternity-ui`, el agente consultará este registro para asegurar que cada implementación de movimiento sea idéntica a los estándares de la versión más reciente en `ui.aceternity.com`.

## 📡 Protocolos de Navegación Maestro

| Categoría Global | URL de Referencia | Objetivo Técnico |
|:---|:---|:---|
| 🏠 **Homepage** | [ui.aceternity.com](https://ui.aceternity.com/) | Visión general y demos. |
| 🧩 **All Components** | [ui.aceternity.com/components](https://ui.aceternity.com/components) | Registro atómico de animaciones. |
| 🧱 **Blocks** | [ui.aceternity.com/blocks](https://ui.aceternity.com/blocks) | Layouts pre-construidos de alta gama. |
| ⚙️ **Installation** | [ui.aceternity.com/docs](https://ui.aceternity.com/docs) | Configuración de utilidades y CLI. |

---

## 📂 Registro Completo de Componentes (97 Módulos)

La IA debe usar estos links directos para copiar los archivos de origen y las configuraciones de Tailwind.

### 🌌 A. Backgrounds y Efectos Espaciales
- [Aurora Background](https://ui.aceternity.com/components/aurora-background) | [Background Beams](https://ui.aceternity.com/components/background-beams) | [Beams with Collision](https://ui.aceternity.com/components/background-beams-with-collision)
- [Background Boxes](https://ui.aceternity.com/components/background-boxes) | [Background Lines](https://ui.aceternity.com/components/background-lines) | [Ripple Effect](https://ui.aceternity.com/components/background-ripple-effect)
- [Sparkles Effect](https://ui.aceternity.com/components/sparkles) | [Meteors Effect](https://ui.aceternity.com/components/meteors) | [Vortex Background](https://ui.aceternity.com/components/vortex)
- [Wavy Background](https://ui.aceternity.com/components/wavy-background) | [Dotted Glow](https://ui.aceternity.com/components/dotted-glow-background) | [Grid & Dot BG](https://ui.aceternity.com/components/grid-and-dot-backgrounds)

### 🧊 B. Efectos 3D y Visuales Premium
- [3D Card Effect](https://ui.aceternity.com/components/3d-card-effect) | [3D Globe](https://ui.aceternity.com/components/3d-globe) | [3D Pin](https://ui.aceternity.com/components/3d-pin)
- [3D Marquee](https://ui.aceternity.com/components/3d-marquee) | [Evervault Card](https://ui.aceternity.com/components/evervault-card) | [Glare Card](https://ui.aceternity.com/components/glare-card)
- [Glowing Effect](https://ui.aceternity.com/components/glowing-effect) | [Lens Effect](https://ui.aceternity.com/components/lens) | [Canvas Reveal](https://ui.aceternity.com/components/canvas-reveal-effect)

### 🖱️ C. Interacciones y Experiencia de Usuario
- [Tracing Beam](https://ui.aceternity.com/components/tracing-beam) | [Animated Tooltip](https://ui.aceternity.com/components/animated-tooltip) | [Link Preview](https://ui.aceternity.com/components/link-preview)
- [Floating Dock](https://ui.aceternity.com/components/floating-dock) | [Floating Navbar](https://ui.aceternity.com/components/floating-navbar) | [Animated Modal](https://ui.aceternity.com/components/animated-modal)
- [Direction Aware Hover](https://ui.aceternity.com/components/direction-aware-hover) | [Card Hover Effect](https://ui.aceternity.com/components/card-hover-effect) | [Sticky Scroll Reveal](https://ui.aceternity.com/components/sticky-scroll-reveal)

### 📝 D. Tipografía y Micro-animaciones
- [Flip Words](https://ui.aceternity.com/components/flip-words) | [Typewriter Effect](https://ui.aceternity.com/components/typewriter-effect) | [Text Generate](https://ui.aceternity.com/components/text-generate-effect)
- [Colourful Text](https://ui.aceternity.com/components/colourful-text) | [Encrypted Text](https://ui.aceternity.com/components/encrypted-text) | [Text Reveal Card](https://ui.aceternity.com/components/text-reveal-card)

### 📊 E. Layouts Complejos (Grids & Carousels)
- [Bento Grid](https://ui.aceternity.com/components/bento-grid) | [Apple Cards Carousel](https://ui.aceternity.com/components/apple-cards-carousel) | [Hero Parallax](https://ui.aceternity.com/components/hero-parallax)
- [Timeline](https://ui.aceternity.com/components/timeline) | [Layout Grid](https://ui.aceternity.com/components/layout-grid) | [Macbook Scroll](https://ui.aceternity.com/components/macbook-scroll)

---

## ⚙️ Heurísticas de Ejecución

1. **Dependencias de Animación:** Verificar siempre la instalación de `framer-motion` y la utilidad `cn`.
2. **Inyección de Keyframes:** Al implementar componentes como `Meteors` o `Sparkles`, el agente DEBE leer la sección de "Tailwind Config" del componente e inyectar las animaciones en el `tailwind.config.js` del usuario.
3. **Optimización con Server Components:** Identificar qué partes del componente requieren `'use client'` para evitar errores de renderizado en Next.js.
4. **Referencia de Bloques:** Antes de construir una sección Hero completa, revisar [ui.aceternity.com/blocks](https://ui.aceternity.com/blocks) para posibles layouts terminados.

---

> [!IMPORTANT]
> **Directiva Alpha**: Al activar `@aceternity-ui`, el agente tiene prohibido usar transiciones de CSS básicas si existe una alternativa animada en este registro. El objetivo es maximizar el impacto visual "premium".
