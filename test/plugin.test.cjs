// Prueba del plugin con una simulación de la API de Figma (sin abrir Figma).
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const MIXED = Symbol("mixed");
global.figma = {
  mixed: MIXED,
  base64Encode: (bytes) => Buffer.from(bytes).toString("base64"),
  root: { name: "App de ejemplo" },
  currentPage: { name: "Pantallas" },
  variables: {
    async getLocalVariableCollectionsAsync() { return [{ id: "c1", name: "Colores", defaultModeId: "m1" }]; },
    async getLocalVariablesAsync() {
      return [
        { id: "v1", name: "primario", variableCollectionId: "c1", valuesByMode: { m1: { r: 0.05, g: 0.4, b: 0.9, a: 1 } } },
        { id: "v2", name: "boton/fondo", variableCollectionId: "c1", valuesByMode: { m1: { type: "VARIABLE_ALIAS", id: "v1" } } },
      ];
    },
    async getVariableByIdAsync(id) { return (await this.getLocalVariablesAsync()).find((v) => v.id === id); },
  },
};
const plugin = require("../code.js");

// ---------- Nodos falsos ----------
let n = 0;
const tf = (x, y) => [[1, 0, x], [0, 1, y]];
function node(type, props) {
  const base = { id: "1:" + ++n, type, visible: true, opacity: 1, fills: [], strokes: [], effects: [], children: [] };
  const o = Object.assign(base, props);
  o.absoluteTransform = tf(props.x || 0, props.y || 0);
  for (const c of o.children) c.parent = o;
  return o;
}
const solid = (r, g, b, extra) => Object.assign({ type: "SOLID", visible: true, opacity: 1, color: { r, g, b } }, extra || {});
const txt = (characters, x, y, extra) =>
  node("TEXT", Object.assign({ name: characters, characters, x, y, width: 200, height: 20, fontSize: 14, fontName: { family: "Inter", style: "Regular" }, fontWeight: 400, textAlignHorizontal: "LEFT", textAlignVertical: "TOP", textAutoResize: "WIDTH_AND_HEIGHT", fills: [solid(0.1, 0.1, 0.1)], lineHeight: { unit: "AUTO" } }, extra || {}));
const set = { type: "COMPONENT_SET", name: "Button" };
const mainBtn = { name: "Type=Primary", parent: set };
const instance = (name, main, kids, x, y, extra) =>
  node("INSTANCE", Object.assign({ name, x, y, width: 280, height: 40, children: kids, async getMainComponentAsync() { return main; }, variantProperties: main === mainBtn ? { Type: "Primary" } : null, cornerRadius: 6, fills: [solid(1, 1, 1)] }, extra || {}));

const icono = node("VECTOR", { name: "logo", x: 140, y: 40, width: 40, height: 40, async exportAsync() { return new Uint8Array([137, 80, 78, 71]); } });
const titulo = txt("Iniciar sesión", 40, 100, { fontSize: 24, fontWeight: 700, fontName: { family: "Inter", style: "Bold" }, textAlignHorizontal: "CENTER", layoutSizingHorizontal: "FILL" });
const correo = instance("Input correo", { name: "Input", parent: null }, [txt("tu@correo.com", 52, 150)], 40, 140, { layoutSizingHorizontal: "FILL", strokes: [solid(0.8, 0.8, 0.8)], strokeWeight: 1 });
const recordar = instance("Recordarme", { name: "Checkbox", parent: null }, [txt("Recordarme", 70, 200)], 40, 196, { height: 24, fills: [] });
const boton = instance("Entrar", mainBtn, [txt("Entrar", 150, 240, { fills: [solid(1, 1, 1)] })], 40, 232, { layoutSizingHorizontal: "FILL", fills: [solid(0.05, 0.4, 0.9, { boundVariables: { color: { id: "v1" } } })] });
const oculto = txt("No se ve", 0, 0, { visible: false });
const mixto = txt("Texto mixto", 40, 280, { fontSize: MIXED, getStyledTextSegments: (f) => [{ fontSize: 18 }] });
const tarjeta = node("FRAME", {
  name: "Tarjeta", x: 20, y: 20, width: 320, height: 330, cornerRadius: 12, fills: [solid(1, 1, 1)], clipsContent: true,
  layoutMode: "VERTICAL", itemSpacing: 12, paddingTop: 20, paddingRight: 20, paddingBottom: 20, paddingLeft: 20,
  primaryAxisAlignItems: "MIN", counterAxisAlignItems: "CENTER",
  effects: [{ type: "DROP_SHADOW", visible: true, color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0 }],
  children: [icono, titulo, correo, recordar, boton, oculto, mixto],
});
const pantalla = node("FRAME", { name: "Login", x: 0, y: 0, width: 360, height: 380, fills: [solid(0.95, 0.96, 0.98)], children: [tarjeta] });

(async () => {
  const data = await plugin.exportFrames([pantalla]);
  assert.equal(data.format, "raxorin-figma");
  assert.equal(data.version, 1);
  const [f] = data.frames;
  assert.equal(f.name, "Login");
  assert.deepEqual(f.box, { x: 0, y: 0, w: 360, h: 380 });
  const card = f.children[0];
  assert.equal(card.layout.mode, "VERTICAL");
  assert.deepEqual(card.layout.padding, [20, 20, 20, 20]);
  assert.equal(card.effects[0].type, "DROP_SHADOW");
  assert.deepEqual(card.radii, [12, 12, 12, 12]);
  assert.equal(card.children.length, 6, "el texto oculto no se exporta");
  assert.ok(card.children[0].image && data.images[card.children[0].image].base64 === "iVBORw==", "vector → imagen PNG");
  const [, t, inp, chk, btn, mix] = card.children;
  assert.equal(t.text.fontWeight, 700);
  assert.equal(t.sizing.h, "FILL");
  assert.equal(inp.component.name, "Input");
  assert.equal(chk.component.name, "Checkbox");
  assert.equal(btn.component.set, "Button");
  assert.deepEqual(btn.component.variant, { Type: "Primary" });
  assert.equal(btn.fills[0].variable, "v1", "conserva la variable de color");
  assert.equal(mix.text.fontSize, 18, "texto con tamaños mezclados → primer tramo");
  assert.equal(data.variables.length, 2);
  assert.deepEqual(data.variables[1].color, data.variables[0].color, "alias resuelto");
  fs.writeFileSync(path.join(__dirname, "fixtures", "login.raxorin.json"), JSON.stringify(data, null, 2));
  console.log("✔ plugin: todo OK");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
