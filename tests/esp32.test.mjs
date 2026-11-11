import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/api") {
      return nextResolve(new URL("../src/lib/api.ts", import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { esp32Service } = await import("../src/modules/esp32/esp32.service.ts");
afterEach(() => mock.restoreAll());

test("lee una etiqueta mediante un único POST autenticado sin body ni parámetros", async () => {
  const response = { found: true, tag: { epc: "E2000017221101441890ABCD", antenna: 4, rssiRaw: 100 } };
  const controller = new AbortController();
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/esp32/read-tag");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { Authorization: "Bearer clerk-token" });
    assert.equal(options.body, undefined);
    assert.equal(options.signal, controller.signal);
    return Response.json(response);
  });

  assert.deepEqual(await esp32Service.readTag("clerk-token", controller.signal), response);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("conserva found false sin inventar un EPC cuando hay cero o varias etiquetas", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ found: false, tag: null }));
  assert.deepEqual(await esp32Service.readTag("clerk-token"), { found: false, tag: null });
});

test("409 informa que el lector está ocupado y no reintenta automáticamente", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ message: "Busy" }, { status: 409 }));
  await assert.rejects(esp32Service.readTag("clerk-token"), {
    status: 409,
    message: "El lector está ocupado. Esperá unos segundos y volvé a intentar.",
  });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("503 muestra un mensaje de fallo del hardware", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Hardware failure", { status: 503 }));
  await assert.rejects(esp32Service.readTag("clerk-token"), {
    status: 503,
    message: "No se pudo realizar la lectura. Revisá la conexión del ESP32 y volvé a intentar.",
  });
});

test("sin token no se inicia una lectura de hardware", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  await assert.rejects(esp32Service.readTag(""), { status: 401 });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("propaga fallos de conexión", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(esp32Service.readTag("clerk-token"), { message: "Failed to fetch" });
});
