# Raxorin Studio Export — plugin de Figma

**Español** · [English](#english)

Exporta pantallas de Figma para abrirlas en el diseñador visual de
[Raxorin Studio](https://github.com/rampad/Raxorin-Studio), donde se convierten en una interfaz de
**Slint** editable: los *Auto Layout* pasan a columnas y filas, y los componentes `Button`, `Input`,
`Checkbox`… pasan a controles reales.

## Instalar (modo desarrollo)

1. Abre **Figma Desktop**.
2. Menú **Plugins → Desarrollo → Importar plugin desde manifiesto…** y elige `manifest.json` de esta carpeta.

## Usar

1. Selecciona una o más pantallas (frames).
2. **Plugins → Desarrollo → Raxorin Studio Export → Exportar**. Se descarga un archivo `.raxorin.json`
   (o usa **Copiar**).
3. En Raxorin Studio abre un archivo `.slint`, pestaña **Diseño** → **Importar de Figma…** y elige el archivo.

## Qué se convierte

| Figma | Slint |
|---|---|
| Auto Layout vertical / horizontal | `VerticalBox` / `HorizontalBox` (con separación, márgenes y alineación) |
| Marco sin Auto Layout, grupo | Panel (`Rectangle`) con posiciones fijas |
| Relleno, borde, esquinas, sombra, degradado lineal | Propiedades del `Rectangle` |
| Texto | `Text` (fuente, tamaño, grosor, color, alineación) |
| Componentes llamados *Button, Input, Checkbox, Switch, Slider, Dropdown, Progress, Spinner, Textarea* (o en español) | El control de Slint correspondiente |
| Vectores, íconos y figuras con foto | `Image` (PNG a 2x) |
| Variables de color locales | `global` de Slint con los colores del sistema de diseño |

Consejo: usa **Auto Layout** siempre que puedas; así la ventana se adapta al cambiar de tamaño.

## Desarrollo

```bash
npm test   # prueba el exportador con una simulación de la API de Figma
```

El formato del archivo está en [FORMAT.md](FORMAT.md). Licencia [MIT](LICENSE).

La ficha para publicarlo en la comunidad de Figma (textos, ícono, portada e imágenes) está en
[ficha/FICHA.md](ficha/FICHA.md).

---

## English

Exports Figma screens so they can be opened in [Raxorin Studio](https://github.com/rampad/Raxorin-Studio)'s
visual designer, where they become an editable **Slint** UI: *Auto Layout* frames become columns and rows,
and components named `Button`, `Input`, `Checkbox`… become real controls.

**Install (development mode):** in Figma Desktop, **Plugins → Development → Import plugin from manifest…**
and pick this folder's `manifest.json`.

**Use:** select one or more frames → **Plugins → Development → Raxorin Studio Export → Exportar**
(a `.raxorin.json` file is downloaded, or use **Copiar** to copy it). In Raxorin Studio, open a `.slint`
file, **Diseño** (Design) tab → **Importar de Figma…** (Import from Figma) and pick the file.

The file format is documented in [FORMAT.md](FORMAT.md) (in Spanish). Run `npm test` to test the exporter
against a mocked Figma API. [MIT](LICENSE) license.
