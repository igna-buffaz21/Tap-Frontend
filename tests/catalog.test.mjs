import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { afterEach, mock, test } from "node:test";
import { productChanges, productCreatePayload, productDraft } from "../src/modules/products/product-form.ts";
import { categoryChanges } from "../src/modules/product-categories/category-form.ts";
import { apiRequest, ApiError } from "../src/lib/api.ts";

// Resolve the Vite alias when running the services directly with Node 24.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/lib/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { productsService } = await import("../src/modules/products/products.service.ts");
const { productCategoriesService } = await import("../src/modules/product-categories/product-categories.service.ts");
afterEach(() => mock.restoreAll());

const product = {
  id: 15, business_id: 1, category_id: 3, name: "Agua", description: "Botella",
  sku: "AGUA-500", unit: "unit", cost_price: 1200.5, sale_price: 1800,
  status: "active", created_at: "2026-11-11", updated_at: "2026-11-11",
};

for (const service of [productsService, productCategoriesService]) {
  test("normaliza estados en listados, creación, edición y cambio de estado", async () => {
    for (const [received, expected] of [["ACTIVE", "active"], [" INACTIVE ", "inactive"], ["Active", "active"], ["active", "active"]]) {
      mock.method(globalThis, "fetch", async (_url, options) => {
        const item = { ...product, status: received };
        return Response.json(options.method === "GET" ? [item] : item);
      });
      assert.equal((await service.list("token"))[0].status, expected);
      assert.equal((await service.create("token", { name: "Agua" })).status, expected);
      assert.equal((await service.update("token", 15, { name: "Agua" })).status, expected);
      assert.equal((await service.setStatus("token", 15, "inactive")).status, expected);
      mock.restoreAll();
    }
  });
}

test("editar solo el nombre no envía otros campos ni stock ni estado", () => {
  const draft = { ...productDraft(product), name: " Agua 600 ml ", branch: "2", minimum: "5", status: "inactive" };
  assert.deepEqual(productChanges(draft, product), { name: "Agua 600 ml" });
});

test("limpiar campos opcionales de productos envía null y conserva precios cero", () => {
  const draft = { ...productDraft(product), category: "none", description: "", sku: "", cost: "", price: "0" };
  assert.deepEqual(productChanges(draft, product), {
    category_id: null, description: null, sku: null, cost_price: null, sale_price: 0,
  });
});

test("sin cambios no hay campos para PATCH", () => {
  assert.deepEqual(productChanges(productDraft(product), product), {});
  assert.deepEqual(categoryChanges("Bebidas", "", { name: "Bebidas", description: null }), {});
});

test("crear sin sucursal omite stock; con sucursal permite cantidad mínima cero", () => {
  const draft = { ...productDraft(), name: "Agua", minimum: "5" };
  const body = productCreatePayload(draft);
  assert.equal(body.branch_id, undefined);
  assert.equal(body.minimum_quantity, undefined);
  assert.equal(body.unit, "unit");
  assert.equal(body.status, "active");
  const withStock = productCreatePayload({ ...draft, branch: "2", minimum: "0" });
  assert.equal(withStock.branch_id, 2);
  assert.equal(withStock.minimum_quantity, 0);
});

test("edición de categorías envía solo cambios y permite vaciar descripción", () => {
  assert.deepEqual(categoryChanges("Bebidas", "", { name: "Bebidas", description: "Anterior" }), { description: "" });
});

test("los servicios respetan rutas, métodos, token y cuerpos de los ocho endpoints", async () => {
  const calls = [];
  mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(options.method === "GET" ? [] : product);
  });
  await productsService.list("token");
  await productCategoriesService.list("token");
  await productsService.create("token", { name: "Agua" });
  await productCategoriesService.create("token", { name: "Bebidas" });
  await productsService.update("token", 15, { sale_price: null });
  await productCategoriesService.update("token", 3, { description: "" });
  await productsService.setStatus("token", 15, "inactive");
  await productCategoriesService.setStatus("token", 3, "active");
  assert.deepEqual(calls.map(({ url, options }) => [url, options.method, options.body && JSON.parse(options.body)]), [
    ["/products", "GET", undefined],
    ["/product-categories", "GET", undefined],
    ["/products", "POST", { name: "Agua" }],
    ["/product-categories", "POST", { name: "Bebidas" }],
    ["/products/15", "PATCH", { sale_price: null }],
    ["/product-categories/3", "PATCH", { description: "" }],
    ["/products/15/status", "PATCH", { status: "inactive" }],
    ["/product-categories/3/status", "PATCH", { status: "active" }],
  ]);
  for (const { options } of calls) {
    assert.equal(options.headers.Authorization, "Bearer token");
    assert.equal(options.headers["Content-Type"], options.body ? "application/json" : undefined);
  }
});

test("muestra mensajes de validación del backend", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: ["Nombre requerido", "Precio inválido"] }, { status: 400 }));
  await assert.rejects(apiRequest("/products", "token"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 400);
    assert.equal(error.message, "Nombre requerido. Precio inválido");
    return true;
  });
});

test("401 y errores no JSON producen un error utilizable", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Unauthorized", { status: 401 }));
  await assert.rejects(apiRequest("/products", "token"), { status: 401, message: "No se pudo validar tu sesión. Volvé a iniciar sesión." });
});

test("sin token no se consulta al backend", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  await assert.rejects(apiRequest("/products", ""), { status: 401 });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("propaga la cancelación de las consultas", async () => {
  const controller = new AbortController();
  controller.abort();
  mock.method(globalThis, "fetch", async (_url, { signal }) => {
    signal.throwIfAborted();
  });
  await assert.rejects(productsService.list("token", controller.signal), { name: "AbortError" });
});
