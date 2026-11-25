# Ficha para la comunidad de Figma

Todo lo que pide Figma al publicar el plugin (**Plugins → Desarrollo → Raxorin Studio Export → Publicar**).
Los textos van en español y en inglés: Figma muestra una sola descripción, así que conviene poner las dos.

## Imágenes

| Campo en Figma | Archivo | Tamaño |
|---|---|---|
| Ícono | [`icono-128.png`](icono-128.png) | 128 × 128 |
| Portada (thumbnail) | [`portada.png`](portada.png) | 1920 × 1080 |
| Carrusel 1 | [`carrusel-1-exportar.png`](carrusel-1-exportar.png) | 1920 × 1080 |
| Carrusel 2 | [`carrusel-2-disenador.png`](carrusel-2-disenador.png) | 1920 × 1080 |
| Carrusel 3 | [`carrusel-3-conversion.png`](carrusel-3-conversion.png) | 1920 × 1080 |

Las fuentes están en [`fuentes/`](fuentes/) (HTML y CSS): para cambiar un texto, edítalo y ejecuta
`node fuentes/generar.mjs fuentes` (necesita `playwright-core` y Google Chrome). El código Slint de las imágenes es
el que genera el plugin de verdad para esa pantalla.

## Nombre

```
Raxorin Studio Export
```

## Tagline (máx. 100 caracteres)

```
Exporta pantallas de Figma a Raxorin Studio y conviértelas en una interfaz Slint editable para Rust.
```

English alternative:

```
Turn Figma screens into an editable Slint UI for Rust apps in Raxorin Studio.
```

## Descripción

```
De Figma a una app real en Rust.

Raxorin Studio Export lleva tus pantallas de Figma al diseñador visual de Raxorin Studio, el IDE gratuito para Rust. Allí se convierten en una interfaz de Slint que puedes editar, mover y conectar con tu código.

CÓMO SE USA
1. Selecciona una o más pantallas (frames).
2. Pulsa Exportar: se descarga un archivo .raxorin.json (o cópialo).
3. En Raxorin Studio, abre un archivo .slint → Diseño → Importar de Figma.

QUÉ SE CONVIERTE
• Auto Layout vertical u horizontal → VerticalBox / HorizontalBox, con separación, márgenes y alineación.
• Componentes llamados Button, Input, Checkbox, Switch, Slider, Dropdown, Progress, Spinner o Textarea (también en español) → el control de Slint correspondiente.
• Marcos sin Auto Layout y grupos → paneles con posiciones fijas.
• Rellenos, bordes, esquinas, sombras y degradados lineales.
• Textos con su fuente, tamaño, grosor, color y alineación.
• Íconos, vectores y fotos → imágenes PNG a 2x.
• Variables de color locales → un global de Slint con los colores de tu sistema de diseño.

CONSEJO: usa Auto Layout siempre que puedas; así la ventana se adapta al cambiar de tamaño.

El plugin no se conecta a internet: todo ocurre en tu archivo de Figma. Es gratuito y de código abierto (MIT).

Raxorin Studio: https://raxorin.com
Guía: https://raxorin.dev/guias/figma/
Código: https://github.com/rampad/Raxorin-Figma

—

From Figma to a real Rust app.

Raxorin Studio Export brings your Figma screens into the visual designer of Raxorin Studio, a free IDE for Rust, where they become an editable Slint UI you can move, tweak and wire to your code.

HOW TO USE
1. Select one or more frames.
2. Click Exportar (Export): a .raxorin.json file is downloaded (or copy it).
3. In Raxorin Studio, open a .slint file → Diseño (Design) → Importar de Figma (Import from Figma).

WHAT IT CONVERTS
• Vertical/horizontal Auto Layout → VerticalBox / HorizontalBox, with spacing, padding and alignment.
• Components named Button, Input, Checkbox, Switch, Slider, Dropdown, Progress, Spinner or Textarea → the matching Slint widget.
• Frames without Auto Layout and groups → panels with fixed positions.
• Fills, strokes, corner radius, shadows and linear gradients.
• Text with its font, size, weight, color and alignment.
• Icons, vectors and photos → 2x PNG images.
• Local color variables → a Slint global with your design system colors.

The plugin makes no network requests: everything happens in your Figma file. Free and open source (MIT).
```

## Etiquetas (tags)

```
rust, slint, export, code, developer, handoff, desktop app, ui, auto layout, design to code
```

## Otros campos

| Campo | Valor |
|---|---|
| Categoría | Development / Design to code |
| Soporte (contacto) | https://github.com/rampad/Raxorin-Figma/issues |
| Precio | Gratis |
| Acceso a la red | Ninguno (`networkAccess: none` en `manifest.json`) |

## Pasos para publicar

1. Abre **Figma Desktop** con tu cuenta. El plugin tiene que estar importado (**Plugins → Desarrollo →
   Importar plugin desde manifiesto…** → `manifest.json`).
2. **Plugins → Desarrollo → Administrar plugins en desarrollo** → junto a *Raxorin Studio Export*, **Publicar**.
3. Figma asigna un **ID** al plugin la primera vez. Si te pide actualizar `manifest.json`, cambia `"id"` por el que
   te da (o avísame y lo hago) y haz commit: las versiones siguientes deben usar el mismo ID.
4. Completa la ficha con los textos y las imágenes de arriba. Figma revisa los plugins antes de publicarlos;
   suele tardar unos días.
5. Cuando esté aprobado, actualiza el enlace de instalación en el README del plugin, en
   [raxorin.dev/guias/figma](https://raxorin.dev/guias/figma/) y en el README de Raxorin Studio.
