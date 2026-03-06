---
name: magic-ui
description: "Ultra-high-fidelity execution framework for Magic UI. Features an absolute registry of 97+ components and templates. Specialized in high-impact animations, Framer Motion, and copy-paste architecture for premium landing pages."
---

# 🪄 Magic UI | The Ultimate Magic Registry [V2]

Este módulo es una **base de datos técnica exhaustiva** (97+ módulos) diseñada para la navegación autónoma de la IA. Al activar `@magic-ui`, el agente consultará este registro para asegurar que cada implementación siga el estándar oficial de `magicui.design`.

## 📡 Protocolo de Navegación Maestro

| Recurso Global | URL Oficial | Objetivo del Agente |
|:---|:---|:---|
| 🏠 **Homepage** | [magicui.design](https://magicui.design/) | Visión general y showcase. |
| 🧩 **All Components** | [magicui.design/docs/components](https://magicui.design/docs/components) | Catálogo atómico completo. |
| 🎨 **Pro Templates** | [magicui.design/docs/templates](https://magicui.design/docs/templates) | Layouts premium (SaaS, AI, Startup). |
| ⚙️ **Installation** | [magicui.design/docs/installation](https://magicui.design/docs/installation) | Requerimientos de Tailwind/Framer. |

---

## 🏗️ Requerimientos Técnicos Obligatorios

1. **Dependencias**: `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`.
2. **Utilidad de Clases**: `@/lib/utils.ts` con función `cn`.
3. **Tailwind Config**: Muchos componentes (Meteors, Border Beam, Shiny Text) requieren inyectar `keyframes` y `animation` específicos en `tailwind.config.ts`.

---

## 📂 Registro Absoluto de Componentes (97 Módulos)

### ✨ A. Efectos de Animación y "Magic"
- [Marquee](https://magicui.design/docs/components/marquee) | [Blur Fade](https://magicui.design/docs/components/blur-fade) | [Confetti](https://magicui.design/docs/components/confetti)
- [Meteors](https://magicui.design/docs/components/meteors) | [Particles](https://magicui.design/docs/components/particles) | [Animated Beam](https://magicui.design/docs/components/animated-beam)
- [Border Beam](https://magicui.design/docs/components/border-beam) | [Shine Border](https://magicui.design/docs/components/shine-border) | [Theme Toggler](https://magicui.design/docs/components/animated-theme-toggler)
- [Cool Mode](https://magicui.design/docs/components/cool-mode) | [Orbiting Circles](https://magicui.design/docs/components/orbiting-circles)

### ✍️ B. Tipografía Animada y Efectos de Texto
- [Text Animate](https://magicui.design/docs/components/text-animate) | [Hyper Text](https://magicui.design/docs/components/hyper-text) | [Typing Animation](https://magicui.design/docs/components/typing-animation)
- [Aurora Text](https://magicui.design/docs/components/aurora-text) | [Sparkles Text](https://magicui.design/docs/components/sparkles-text) | [Number Ticker](https://magicui.design/docs/components/number-ticker)
- [Shiny Text](https://magicui.design/docs/components/animated-shiny-text) | [Text Reveal](https://magicui.design/docs/components/text-reveal) | [Morphing Text](https://magicui.design/docs/components/morphing-text)
- [Line Shadow](https://magicui.design/docs/components/line-shadow-text) | [Word Rotate](https://magicui.design/docs/components/word-rotate) | [Velocity Scroll](https://magicui.design/docs/components/scroll-based-velocity)

### 🗺️ C. Fondos y Patrones de Visualización
- [Globe 3D](https://magicui.design/docs/components/globe) | [Dotted Map](https://magicui.design/docs/components/dotted-map) | [Icon Cloud](https://magicui.design/docs/components/icon-cloud)
- [Animated Grid](https://magicui.design/docs/components/animated-grid-pattern) | [Dot Pattern](https://magicui.design/docs/components/dot-pattern) | [Retro Grid](https://magicui.design/docs/components/retro-grid)
- [Flickering Grid](https://magicui.design/docs/components/flickering-grid) | [Interactive Grid](https://magicui.design/docs/components/interactive-grid-pattern)
- [Ripple Effect](https://magicui.design/docs/components/ripple) | [Light Rays](https://magicui.design/docs/components/light-rays)

### 📱 D. Mockups de Dispositivos y UI Avanzada
- [Bento Grid](https://magicui.design/docs/components/bento-grid) | [Dock Navigation](https://magicui.design/docs/components/dock) | [Terminal](https://magicui.design/docs/components/terminal)
- [Safari Mock](https://magicui.design/docs/components/safari) | [iPhone Mock](https://magicui.design/docs/components/iphone) | [Android Mock](https://magicui.design/docs/components/android)
- [File Tree](https://magicui.design/docs/components/file-tree) | [Code Comparison](https://magicui.design/docs/components/code-comparison) | [Magic Card](https://magicui.design/docs/components/magic-card)
- [Lens Effect](https://magicui.design/docs/components/lens) | [Avatar Circles](https://magicui.design/docs/components/avatar-circles)

### 🔘 E. Botones y Controles Especiales
- [Rainbow Button](https://magicui.design/docs/components/rainbow-button) | [Shimmer Button](https://magicui.design/docs/components/shimmer-button)
- [Ripple Button](https://magicui.design/docs/components/ripple-button) | [Pulsating Button](https://magicui.design/docs/components/pulsating-button)
- [Shiny Button](https://magicui.design/docs/components/shiny-button) | [Interactive Hover](https://magicui.design/docs/components/interactive-hover-button)

---

## 🎨 Plantillas de Ingeniería (Templates Registry)

Planos de arquitectura completa para inicio rápido:
- [CodeForge](https://magicui.design/docs/templates/codeforge) | [AI Agent](https://magicui.design/docs/templates/agent) | [SaaS Landing](https://magicui.design/docs/templates/saas)
- [Startup Landing](https://magicui.design/docs/templates/startup) | [Portfolio Template](https://magicui.design/docs/templates/portfolio) | [Changelog](https://magicui.design/docs/templates/changelog)

---

## 💡 Heurísticas de Implementación Senior

1. **Motion Dependency**: Prohibido el uso de transiciones CSS nativas si existe un preset de Framer Motion en esta lista.
2. **Tailwind Injection**: El agente DEBE inyectar manualmente los scripts de animación en `tailwind.config.ts` al instalar componentes complejos.
3. **Copy-Paste High Fidelity**: No alterar la estructura del componente de Magic UI a menos que sea necesario por lógica de negocio. Respetar las clases de Tailwind originales.
4. **Theming Dynamic**: Todos los componentes deben responder al modo oscuro/claro mediante selectores de Tailwind.

---

> [!CAUTION]
> **Performance Warning**: No apilar más de 3 fondos animados (`Globe`, `Particles`, `Grid`) en el mismo viewport para mantener el rendimiento de la CPU.
