# Formato `raxorin-figma` (versión 1)

Archivo JSON que produce el plugin y que lee Raxorin Studio (diseñador → *Importar de Figma*).
Es el contrato entre los dos proyectos: si cambia de forma incompatible, se sube `version`.

```jsonc
{
  "format": "raxorin-figma",
  "version": 1,
  "file": "Nombre del archivo de Figma",
  "page": "Página",
  "exportedAt": "2026-11-25T10:00:00.000Z",
  "frames": [Nodo],                 // pantallas seleccionadas
  "images": { "img1": { "name": "logo", "width": 40, "height": 40, "base64": "iVBOR…" } }, // PNG a 2x
  "variables": [{ "id": "VariableID:1", "name": "primario", "collection": "Colores", "color": Color }],
  "warnings": ["texto para el usuario"]
}
```

## Nodo

| Campo | Contenido |
|---|---|
| `id`, `name`, `type` | Como en Figma (`FRAME`, `TEXT`, `RECTANGLE`, `ELLIPSE`, `INSTANCE`, `COMPONENT`, `GROUP`, `SECTION`, `VECTOR`…) |
| `box` | `{ x, y, w, h }`: posición **absoluta** en la página (sin rotación) y tamaño |
| `opacity` | 0–1 |
| `fills`, `strokes` | Lista de `Paint` visibles (el último es el de arriba) |
| `strokeWeight` | Grosor del borde |
| `radii` | `[arribaIzq, arribaDer, abajoDer, abajoIzq]` o `null` |
| `effects` | `{ type: DROP_SHADOW \| INNER_SHADOW \| LAYER_BLUR, color, offset {x,y}, radius, spread }` |
| `clips` | Recorta el contenido |
| `layout` | `null` o Auto Layout: `{ mode: VERTICAL \| HORIZONTAL, spacing, padding: [arriba, der, abajo, izq], primaryAlign: MIN \| CENTER \| MAX \| SPACE_BETWEEN, counterAlign, wrap }` |
| `sizing` | Dentro de un Auto Layout: `{ h, v: FIXED \| HUG \| FILL, positioning: AUTO \| ABSOLUTE }` |
| `component` | Para instancias y componentes: `{ name, set, variant: { Propiedad: valor } }` |
| `text` | Para textos: `{ characters, fontSize, fontFamily, fontStyle, fontWeight, align, valign, autoResize, lineHeight, fills }` |
| `image` | Clave en `images` si el nodo se exportó como imagen (vectores, íconos, figuras con foto) |
| `children` | Nodos hijos visibles |

## Color y Paint

- `Color`: `{ r, g, b, a }` entre 0 y 1 (la opacidad del relleno ya está multiplicada en `a`).
- `Paint`:
  - `{ type: "SOLID", color, variable }` — `variable` es el id de la variable de color usada, o `null`.
  - `{ type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL", stops: [{ position, color }], transform }`
  - `{ type: "IMAGE", scaleMode }`
