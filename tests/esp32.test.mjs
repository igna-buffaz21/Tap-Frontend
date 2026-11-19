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

test("ejecuta run-flow con un único POST autenticado sin body y conserva productos, precios y EPC", async () => {
  const response = {
    products: [
      { epc: "CAFE00000001000000000002", product: { id: "12", name: "Café", sale_price: "2500.0000" } },
      { epc: "CAFE00000001000000000003", product: { id: "12", name: "Café", sale_price: "2500.0000" } },
    ],
    total: 2,
    door: "open",
  };
  const controller = new AbortController();
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/esp32/run-flow");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { Authorization: "Bearer clerk-token" });
    assert.equal(options.body, undefined);
    assert.equal(options.signal, controller.signal);
    return Response.json(response);
  });
  assert.deepEqual(await esp32Service.runFlow("clerk-token", controller.signal), response);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("run-flow conserva un carrito vacío", async () => {
  const response = { products: [], total: 0, door: "open" };
  mock.method(globalThis, "fetch", async () => Response.json(response));
  assert.deepEqual(await esp32Service.runFlow("clerk-token"), response);
});

test("run-flow sin sesión no envía órdenes al hardware", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  await assert.rejects(esp32Service.runFlow(""), { status: 401 });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("run-flow informa lector ocupado y fallos del hardware sin reintentar", async () => {
  for (const [status, message] of [
    [409, "El lector está ocupado. Esperá unos segundos y volvé a intentar."],
    [503, "No se pudo completar el recorrido. Revisá la conexión del ESP32 y volvé a intentar."],
  ]) {
    const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ message: "Error" }, { status }));
    await assert.rejects(esp32Service.runFlow("clerk-token"), { status, message });
    assert.equal(fetchMock.mock.callCount(), 1);
    mock.restoreAll();
  }
});

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

const { readSensorEvents } = await import("../src/modules/esp32/esp32.events.ts");

test("SSE autentica con Bearer, procesa mensajes fragmentados y omite heartbeats", async () => {
  const encoder = new TextEncoder();
  const sensor = { detected: true, confirmed: true, ready: true, busy: false };
  const bytes = encoder.encode(`: conectado\r\nevent: heartbeat\r\ndata: {}\r\n\r\nevent: sensor\r\ndata: ${JSON.stringify(sensor)}\r\n\r\nevent: hardwareError\r\ndata: {"message":"Conexión perdida"}\r\n\r\nevent: flow\r\ndata: {"stage":\r\ndata: "reading"}\r\n\r\n`);
  const controller = new AbortController();
  mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/esp32/sensor/events");
    assert.deepEqual(options.headers, { Authorization: "Bearer clerk-token", Accept: "text/event-stream" });
    assert.equal(options.signal, controller.signal);
    assert.equal(options.cache, "no-store");
    return new Response(new ReadableStream({
      start(stream) {
        // A single byte per chunk exercises CRLF and multibyte UTF-8 boundaries.
        for (const byte of bytes) stream.enqueue(Uint8Array.of(byte));
        stream.close();
      },
    }));
  });
  const events = [];
  let opened = false;
  await readSensorEvents("clerk-token", controller.signal, (event) => events.push(event), () => { opened = true; });
  assert.equal(opened, true);
  assert.deepEqual(events, [
    { type: "sensor", data: sensor },
    { type: "hardwareError", data: { message: "Conexión perdida" } },
    { type: "flow", data: { stage: "reading" } },
  ]);
});

test("SSE sin token no abre una conexión y conserva errores de autorización", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
  await assert.rejects(readSensorEvents("", new AbortController().signal, () => {}), { status: 401 });
  assert.equal(fetchMock.mock.callCount(), 0);
  await assert.rejects(readSensorEvents("token", new AbortController().signal, () => {}), { status: 403 });
});

test("SSE libera el reader cuando el handler corta por un error del hardware", async () => {
  let cancelled = false;
  mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    start(stream) {
      stream.enqueue(new TextEncoder().encode('event: hardwareError\ndata: {"message":"Sin hardware"}\n\n'));
    },
    cancel() { cancelled = true; },
  })));
  await assert.rejects(readSensorEvents("token", new AbortController().signal, () => {
    throw new Error("Sin hardware");
  }), { message: "Sin hardware" });
  assert.equal(cancelled, true);
});
