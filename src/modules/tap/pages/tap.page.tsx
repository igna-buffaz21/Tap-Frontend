import { useAuth } from "@clerk/react";
import { ArrowRightIcon, CheckIcon, CreditCardIcon, RadioIcon, ShoppingBagIcon, ShoppingCartIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ErrorNotice } from "@/components/catalog/catalog-controls";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/config/app.routes";
import { EpcScanner } from "@/modules/products/components/epc-scanner";

import { useTapFlow } from "./use-tap-flow";
import "./tap.css";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function TapPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { sensor, stage, reading, result, error, connection, countdown } = useTapFlow(Boolean(isLoaded && isSignedIn), getToken);
  const [paidResult, setPaidResult] = useState<typeof result>(null);
  const paid = result !== null && paidResult === result;
  const detected = sensor?.detected === true;
  const active = reading || (sensor?.busy && !result);
  const stageCopy = {
    opening: ["Carrito detectado", "Estamos preparando la cámara. Retirá las manos de la puerta."],
    waitingForObject: ["Ingresá el carrito hasta el fondo de la cámara", "El sensor iniciará la lectura automáticamente."],
    holding: ["Carrito detectado", "Retirá las manos. La puerta se cerrará automáticamente."],
    closing: ["Cerrando la puerta", "Mantené las manos fuera de la cámara."],
    reading: ["Leyendo productos", "Estamos identificando los productos de tu carrito. Esperá un momento."],
    reopening: ["Lectura finalizada", "Estamos abriendo la puerta y preparando tu carrito."],
    completed: ["Preparando tu carrito", "En un momento vas a poder revisar tus productos y pagar."],
    failed: ["No pudimos completar la lectura", "Retirá el carrito y volvé a ingresarlo para intentar de nuevo."],
  };
  const copy = stage && (active || stage === "failed") ? stageCopy[stage] : detected
    ? ["Carrito detectado", "Retirá las manos de la cámara. Estamos confirmando la detección."]
    : ["Ingresá el carrito hasta el fondo de la cámara", "La lectura comienza automáticamente cuando detectamos tu carrito."];
  const hasUnidentifiedProducts = result?.products.some(({ product }) => product === null) ?? false;
  const total = (result?.products.reduce((sum, { product }) => sum + (product ? Math.round(Number(product.sale_price) * 100) : 0), 0) ?? 0) / 100;

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShoppingBagIcon className="size-5" aria-hidden="true" /></div>
            <div><h1 className="text-2xl font-semibold tracking-tight">Tap</h1><p className="text-sm text-muted-foreground">Tu compra, en un solo paso.</p></div>
          </div>
          <span className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground">Caja de autoservicio</span>
        </header>

        {error && <ErrorNotice message={error} />}

        {active || !result ? (
          <section className="tap-stage flex min-h-[65svh] flex-col items-center justify-center rounded-3xl border bg-background px-6 py-10 text-center" aria-busy={Boolean(active)}>
            <span className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground">
              <span className={`size-2 rounded-full ${connection === "Sensor conectado" ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-amber-500"}`} />
              {isSignedIn ? connection : "Iniciá sesión para conectar el sensor"}
            </span>
            {stage === "reading" ? <EpcScanner reading /> : (
              <div className="tap-chamber my-8" data-detected={detected || Boolean(active)} data-closed={stage === "closing"} aria-hidden="true">
                <div className="tap-chamber-floor" />
                <ShoppingCartIcon className="tap-cart" strokeWidth={1.4} />
                <div className="tap-chamber-door" />
                {(detected || active) && <span className="tap-detection"><CheckIcon className="size-5" /></span>}
              </div>
            )}
            <div className="max-w-lg space-y-3" role="status" aria-live="polite">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy[0]}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">{copy[1]}</p>
              {stage === "holding" && <div className="pt-3"><span key={countdown} className="tap-countdown inline-flex size-20 items-center justify-center rounded-full bg-amber-100 text-4xl font-semibold text-amber-900">{countdown > 0 ? countdown : <ShieldCheckIcon className="size-8" />}</span><p className="mt-3 text-sm font-medium">{countdown > 0 ? `La puerta se cerrará en ${countdown} ${countdown === 1 ? "segundo" : "segundos"}` : "Esperando el cierre de la puerta"}</p></div>}
            </div>
            <div className="mt-8">
              {!isLoaded ? <p className="text-sm text-muted-foreground">Cargando sesión...</p> : !isSignedIn ? (
                <Button asChild><Link to={APP_ROUTES.auth.login}>Iniciar sesión para comenzar<ArrowRightIcon aria-hidden="true" /></Link></Button>
              ) : <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">{["1 · Ingresá el carrito", "2 · Lectura automática", "3 · Revisá y pagá"].map((step, index) => <span key={step} className={`rounded-full border px-3 py-2 ${index === (active ? 1 : 0) ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : ""}`}>{step}</span>)}</div>}
            </div>
          </section>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <section className="min-w-0 overflow-hidden rounded-3xl border bg-background" aria-labelledby="cart-title">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
                <div><p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground">01 / TU COMPRA</p><h2 id="cart-title" className="text-xl font-semibold">Tu carrito</h2></div>
                <span className="rounded-full bg-muted px-3 py-1 text-sm">{result.total} {result.total === 1 ? "producto" : "productos"}</span>
              </div>
              {result.products.length > 0 ? (
                <ul className="divide-y px-6">
                  {result.products.map(({ epc, product }, index) => (
                    <li key={`${epc}-${index}`} className="flex items-start gap-4 py-5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-medium tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1 space-y-1"><p className="break-words text-sm font-medium">{product?.name ?? "Producto no identificado"}</p><code className="block break-all text-xs text-muted-foreground">EPC: {epc}</code><p className="text-sm font-medium tabular-nums sm:hidden">{product ? money.format(Number(product.sale_price)) : "Precio no disponible"}</p></div>
                      <p className="hidden shrink-0 text-sm font-medium tabular-nums sm:block">{product ? money.format(Number(product.sale_price)) : "Precio no disponible"}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 px-6 py-14 text-center"><ShoppingBagIcon className="mx-auto mb-4 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">No se detectaron productos</p><p className="text-sm text-muted-foreground">Revisá la ubicación de tus productos e iniciá otra lectura.</p></div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
                <p role="status" className="text-xs text-muted-foreground">Lectura completada · Puerta {result.door === "open" ? "abierta" : "cerrada"}</p>
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><RadioIcon className="size-4" aria-hidden="true" />Retirá y volvé a ingresar el carrito para otra lectura</span>
              </div>
            </section>

            <section className="min-w-0 rounded-3xl border bg-background p-6 sm:p-8" aria-labelledby="payment-title">
              <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground">02 / PAGO</p>
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="payment-title" className="text-xl font-semibold">Resumen de pago</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">Simulación</span></div>
              <div className="my-8 flex flex-wrap items-end justify-between gap-4 border-y py-6"><span className="text-sm text-muted-foreground">Total</span><span className="break-all text-3xl font-semibold tracking-tight tabular-nums">{hasUnidentifiedProducts ? "Pendiente" : money.format(total)}</span></div>
              {hasUnidentifiedProducts && <p role="status" className="mb-6 text-sm text-destructive">Hay etiquetas sin un producto asociado. Revisá sus EPC e iniciá una nueva lectura antes de pagar.</p>}
              <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border bg-muted/20 p-5">
                <DemoQr />
                <p className="text-sm font-medium">Escaneá para pagar</p>
                <p className="max-w-60 text-center text-xs text-muted-foreground">QR de demostración. Usá el botón para simular el pago.</p>
              </div>
              <div className="mb-6 flex items-center gap-3 rounded-xl border bg-muted/20 p-4"><CreditCardIcon className="size-5 text-muted-foreground" aria-hidden="true" /><div><p className="text-sm font-medium">Pago de prueba</p><p className="text-xs text-muted-foreground">Sin ingresar datos de una tarjeta.</p></div></div>
              <Button className="w-full" size="lg" disabled={paid || hasUnidentifiedProducts || result.products.length === 0} onClick={() => setPaidResult(result)}>
                {paid ? <CheckIcon aria-hidden="true" /> : <CreditCardIcon aria-hidden="true" />}{paid ? "Pago simulado completado" : "Simular pago"}
              </Button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">Esta prueba no realiza ningún cobro.</p>
              {paid && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">¡Listo! Tu pago de prueba se completó correctamente.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}


function DemoQr() {
  // Decorative QR pattern only; it contains no payment link or payment data.
  const size = 29;
  const finders = [[0, 0], [22, 0], [0, 22]];
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = finders.find(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
      let filled;
      if (finder) {
        const dx = x - finder[0], dy = y - finder[1];
        filled = dx >= 0 && dx < 7 && dy >= 0 && dy < 7 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      } else filled = ((x * 17 + y * 31 + x * y * 7) % 11) < 5;
      if (filled) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  return <svg role="img" aria-label="QR simulado de pago, sin validez para realizar cobros" viewBox="-4 -4 37 37" className="size-48 rounded-xl bg-white p-2 text-black"><g fill="currentColor">{cells}</g></svg>;
}
