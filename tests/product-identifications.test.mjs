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

const { productIdentificationsService } = await import("../src/modules/product-identifications/product-identifications.service.ts");
afterEach(() => mock.restoreAll());

test("asigna el EPC al producto mediante POST autenticado con tipo RFID_UHF", async () => {
  const body = { product_id: 12, type: "RFID_UHF", value: "E2000017221101441890ABCD" };
  const controller = new AbortController();
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/product-identifications");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, {
      Authorization: "Bearer clerk-token",
      "Content-Type": "application/json",
    });
    assert.deepEqual(JSON.parse(options.body), body);
    assert.equal(options.signal, controller.signal);
    return Response.json({ id: 1, ...body }, { status: 201 });
  });

  await productIdentificationsService.create("clerk-token", body, controller.signal);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("propaga errores del backend sin reintentar la asignación", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ message: "El identificador ya está asignado." }, { status: 409 }));
  await assert.rejects(productIdentificationsService.create("clerk-token", {
    product_id: 12, type: "RFID_UHF", value: "E2000017221101441890ABCD",
  }), { status: 409, message: "El identificador ya está asignado." });
  assert.equal(fetchMock.mock.callCount(), 1);
});
