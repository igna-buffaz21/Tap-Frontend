import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";

import { authService, AuthServiceError } from "./auth.service.ts";

afterEach(() => mock.restoreAll());

test("envía GET con el token de Clerk, sin body ni parámetros, y conserva los datos", async () => {
  const user = {
    id: 1,
    clerkId: "user_test",
    name: "Juan Pérez",
    email: "juan@example.com",
    photoUrl: "",
    status: "active",
    business_id: 1,
    branch_id: null,
    roles: [],
    permissions: {},
  };
  const controller = new AbortController();
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/auth/me");
    assert.equal(options.method, "GET");
    assert.deepEqual(options.headers, { Authorization: "Bearer clerk-token" });
    assert.equal(options.body, undefined);
    assert.equal(options.cache, "no-store");
    assert.equal(options.signal, controller.signal);
    return Response.json(user);
  });

  assert.deepEqual(await authService.getAuth("clerk-token", controller.signal), user);
  assert.equal(fetchMock.mock.callCount(), 1);
});

for (const message of [
  "Authorization bearer token is required",
  "User is not registered",
  "Invalid Clerk token: invalid signature",
]) {
  test(`conserva el status y mensaje del backend: ${message}`, async () => {
    mock.method(globalThis, "fetch", async () => Response.json({
      message, error: "Unauthorized", statusCode: 401,
    }, { status: 401 }));

    await assert.rejects(authService.getAuth("clerk-token"), (error) => {
      assert.ok(error instanceof AuthServiceError);
      assert.equal(error.status, 401);
      assert.equal(error.message, message);
      return true;
    });
  });
}

test("rechaza un token vacío sin llamar al servidor", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  await assert.rejects(authService.getAuth("  "), { status: 401 });
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("maneja errores HTTP sin respuesta JSON", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  await assert.rejects(authService.getAuth("clerk-token"), {
    status: 503,
    message: "No se pudo validar tu cuenta. Intentá de nuevo.",
  });
});

test("propaga un error de conexión", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(authService.getAuth("clerk-token"), { message: "Failed to fetch" });
});
