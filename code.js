// Raxorin Studio Export — plugin de Figma.
// Exporta las pantallas (frames) seleccionadas a un archivo .json que Raxorin Studio
// convierte en una interfaz de Slint editable. El formato está descrito en FORMAT.md.
//
// Se evita sintaxis muy nueva (?. y ??) para funcionar en cualquier versión del entorno
// de plugins de Figma. En Node (pruebas) se exportan las funciones en vez de abrir la UI.

var FORMAT = "raxorin-figma";
var FORMAT_VERSION = 1;

/** Tipos que se exportan como imagen (no tienen equivalente en Slint). */
var RASTER_TYPES = ["VECTOR", "BOOLEAN_OPERATION", "STAR", "POLYGON", "LINE"];
/** Tipos que contienen otros nodos. */
var CONTAINER_TYPES = ["FRAME", "GROUP", "COMPONENT", "COMPONENT_SET", "INSTANCE", "SECTION"];
/** Lo que se puede elegir para exportar. */
var EXPORTABLE = ["FRAME", "COMPONENT", "INSTANCE", "SECTION", "GROUP"];

function isMixed(v) {
  return typeof v === "symbol";
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function rgba(c, opacity) {
  var a = c.a === undefined ? 1 : c.a;
  var o = opacity === undefined ? 1 : opacity;
  return { r: round(c.r), g: round(c.g), b: round(c.b), a: round(a * o) };
}

function paints(list) {
  if (!Array.isArray(list)) return []; // figma.mixed
  var out = [];
  list.forEach(function (p) {
    if (p.visible === false) return;
    if (p.type === "SOLID") {
      var bound = p.boundVariables && p.boundVariables.color ? p.boundVariables.color.id : null;
      out.push({ type: "SOLID", color: rgba(p.color, p.opacity), variable: bound });
    } else if (p.type === "GRADIENT_LINEAR" || p.type === "GRADIENT_RADIAL") {
      out.push({
        type: p.type,
        stops: p.gradientStops.map(function (s) {
          return { position: round(s.position), color: rgba(s.color, p.opacity) };
        }),
        transform: p.gradientTransform,
      });
    } else if (p.type === "IMAGE") {
      out.push({ type: "IMAGE", scaleMode: p.scaleMode });
    }
  });
  return out;
}

function hasImageFill(node) {
  return Array.isArray(node.fills) && node.fills.some(function (p) { return p.type === "IMAGE" && p.visible !== false; });
}

/** Posición absoluta (sin rotación) y tamaño. */
function box(node) {
  var t = node.absoluteTransform;
  return { x: round(t[0][2]), y: round(t[1][2]), w: round(node.width), h: round(node.height) };
}

function radii(node) {
  if (node.cornerRadius === undefined) return null;
  if (!isMixed(node.cornerRadius)) return node.cornerRadius ? [node.cornerRadius, node.cornerRadius, node.cornerRadius, node.cornerRadius] : null;
  return [node.topLeftRadius || 0, node.topRightRadius || 0, node.bottomRightRadius || 0, node.bottomLeftRadius || 0];
}

function effects(node) {
  if (!Array.isArray(node.effects)) return [];
  return node.effects
    .filter(function (e) { return e.visible !== false && (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW" || e.type === "LAYER_BLUR"); })
    .map(function (e) {
      return {
        type: e.type,
        color: e.color ? rgba(e.color) : null,
        offset: e.offset ? { x: round(e.offset.x), y: round(e.offset.y) } : null,
        radius: round(e.radius || 0),
        spread: round(e.spread || 0),
      };
    });
}

function layout(node) {
  if (!node.layoutMode || node.layoutMode === "NONE") return null;
  return {
    mode: node.layoutMode,
    spacing: round(node.itemSpacing || 0),
    padding: [node.paddingTop || 0, node.paddingRight || 0, node.paddingBottom || 0, node.paddingLeft || 0],
    primaryAlign: node.primaryAxisAlignItems || "MIN",
    counterAlign: node.counterAxisAlignItems || "MIN",
    wrap: node.layoutWrap === "WRAP",
  };
}

function sizing(node) {
  return {
    h: node.layoutSizingHorizontal || "FIXED",
    v: node.layoutSizingVertical || "FIXED",
    positioning: node.layoutPositioning || "AUTO",
  };
}

/** Primer valor de una propiedad de texto que puede ser "mixta". */
function firstSegment(node, field) {
  var v = node[field];
  if (!isMixed(v)) return v;
  if (typeof node.getStyledTextSegments === "function") {
    var seg = node.getStyledTextSegments([field])[0];
    return seg ? seg[field] : undefined;
  }
  return undefined;
}

function text(node) {
  var fontName = firstSegment(node, "fontName") || {};
  var fills = firstSegment(node, "fills");
  var lineHeight = firstSegment(node, "lineHeight");
  return {
    characters: node.characters,
    fontSize: round(firstSegment(node, "fontSize") || 14),
    fontFamily: fontName.family || null,
    fontStyle: fontName.style || null,
    fontWeight: firstSegment(node, "fontWeight") || null,
    align: node.textAlignHorizontal || "LEFT",
    valign: node.textAlignVertical || "TOP",
    autoResize: node.textAutoResize || "NONE",
    lineHeight: lineHeight && lineHeight.unit === "PIXELS" ? round(lineHeight.value) : null,
    fills: paints(fills),
  };
}

async function component(node) {
  if (node.type === "INSTANCE") {
    var main = typeof node.getMainComponentAsync === "function" ? await node.getMainComponentAsync() : node.mainComponent;
    var set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent.name : null;
    return { name: main ? main.name : node.name, set: set, variant: node.variantProperties || {} };
  }
  if (node.type === "COMPONENT") {
    var parentSet = node.parent && node.parent.type === "COMPONENT_SET" ? node.parent.name : null;
    return { name: node.name, set: parentSet, variant: node.variantProperties || {} };
  }
  return null;
}

async function exportImage(node, ctx) {
  var key = "img" + ++ctx.imageCount;
  var bytes = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } });
  ctx.images[key] = { name: node.name, width: round(node.width), height: round(node.height), base64: figma.base64Encode(bytes) };
  if (ctx.onProgress) ctx.onProgress(ctx.imageCount);
  return key;
}

/** Convierte un nodo de Figma (y sus hijos) al formato de Raxorin. */
async function serializeNode(node, ctx) {
  if (node.visible === false) return null;
  var out = {
    id: node.id,
    name: node.name,
    type: node.type,
    box: box(node),
    opacity: node.opacity === undefined ? 1 : round(node.opacity),
    fills: paints(node.fills),
    strokes: paints(node.strokes),
    strokeWeight: isMixed(node.strokeWeight) ? node.strokeTopWeight || 0 : node.strokeWeight || 0,
    radii: radii(node),
    effects: effects(node),
    clips: !!node.clipsContent,
    layout: layout(node),
    sizing: sizing(node),
    component: await component(node),
    text: null,
    image: null,
    children: [],
  };

  // Vectores e íconos, y figuras con una foto de relleno: como imagen.
  var simpleShape = node.type === "RECTANGLE" || node.type === "ELLIPSE";
  if (RASTER_TYPES.indexOf(node.type) >= 0 || (simpleShape && hasImageFill(node))) {
    out.image = await exportImage(node, ctx);
    return out;
  }
  // Un marco con una foto de fondo: la foto no se puede separar de su contenido.
  if (CONTAINER_TYPES.indexOf(node.type) >= 0 && hasImageFill(node)) {
    ctx.warnings.push("“" + node.name + "” tiene una imagen de fondo: se omitió (exporta la imagen como una capa aparte).");
  }
  if (node.type === "TEXT") out.text = text(node);

  if (CONTAINER_TYPES.indexOf(node.type) >= 0 && node.children) {
    for (var i = 0; i < node.children.length; i++) {
      var child = await serializeNode(node.children[i], ctx);
      if (child) out.children.push(child);
    }
  }
  return out;
}

/** Variables de color locales (tokens de diseño), con el valor del modo por defecto. */
async function exportVariables() {
  if (typeof figma === "undefined" || !figma.variables || typeof figma.variables.getLocalVariablesAsync !== "function") return [];
  var collections = await figma.variables.getLocalVariableCollectionsAsync();
  var byId = {};
  collections.forEach(function (c) { byId[c.id] = c; });
  var vars = await figma.variables.getLocalVariablesAsync("COLOR");
  var out = [];
  for (var i = 0; i < vars.length; i++) {
    var v = vars[i];
    var col = byId[v.variableCollectionId];
    var value = col ? v.valuesByMode[col.defaultModeId] : null;
    // Un alias apunta a otra variable: se resuelve hasta 5 niveles.
    for (var depth = 0; value && value.type === "VARIABLE_ALIAS" && depth < 5; depth++) {
      var target = await figma.variables.getVariableByIdAsync(value.id);
      var tcol = target ? byId[target.variableCollectionId] : null;
      value = target && tcol ? target.valuesByMode[tcol.defaultModeId] : null;
    }
    if (value && value.r !== undefined) {
      out.push({ id: v.id, name: v.name, collection: col ? col.name : "", color: rgba(value) });
    }
  }
  return out;
}

async function exportFrames(nodes, onProgress) {
  var ctx = { images: {}, imageCount: 0, warnings: [], onProgress: onProgress };
  var frames = [];
  for (var i = 0; i < nodes.length; i++) {
    var f = await serializeNode(nodes[i], ctx);
    if (f) frames.push(f);
  }
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    file: typeof figma !== "undefined" && figma.root ? figma.root.name : "",
    page: typeof figma !== "undefined" && figma.currentPage ? figma.currentPage.name : "",
    exportedAt: new Date().toISOString(),
    frames: frames,
    images: ctx.images,
    variables: await exportVariables(),
    warnings: ctx.warnings,
  };
}

function selectedFrames() {
  return figma.currentPage.selection.filter(function (n) { return EXPORTABLE.indexOf(n.type) >= 0; });
}

function fileName(frames) {
  var base = frames.length === 1 ? frames[0].name : figma.root.name || "figma";
  return base.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, "").trim().replace(/\s+/g, "-") + ".raxorin.json";
}

function main() {
  figma.showUI(__html__, { width: 340, height: 440, themeColors: true });

  function sendSelection() {
    figma.ui.postMessage({
      type: "selection",
      frames: selectedFrames().map(function (f) { return { id: f.id, name: f.name, w: Math.round(f.width), h: Math.round(f.height) }; }),
    });
  }
  figma.on("selectionchange", sendSelection);
  sendSelection();

  figma.ui.onmessage = async function (msg) {
    if (msg.type === "export") {
      var frames = selectedFrames();
      if (!frames.length) {
        figma.ui.postMessage({ type: "error", message: "Selecciona al menos una pantalla (frame)." });
        return;
      }
      try {
        var data = await exportFrames(frames, function (n) { figma.ui.postMessage({ type: "progress", images: n }); });
        figma.ui.postMessage({ type: "result", json: JSON.stringify(data), name: fileName(frames), frames: data.frames.length, images: Object.keys(data.images).length, variables: data.variables.length, warnings: data.warnings });
      } catch (e) {
        figma.ui.postMessage({ type: "error", message: String(e && e.message ? e.message : e) });
      }
    } else if (msg.type === "notify") {
      figma.notify(msg.message);
    } else if (msg.type === "close") {
      figma.closePlugin();
    }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { serializeNode: serializeNode, exportFrames: exportFrames, paints: paints, rgba: rgba, FORMAT: FORMAT, FORMAT_VERSION: FORMAT_VERSION };
} else {
  main();
}
