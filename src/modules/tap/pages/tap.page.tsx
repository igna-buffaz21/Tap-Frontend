import { useAuth } from "@clerk/react";
import { ArrowRightIcon, CheckIcon, CreditCardIcon, Loader2Icon, RadioIcon, ShoppingBagIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorNotice } from "@/components/catalog/catalog-controls";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/config/app.routes";
import { errorMessage } from "@/lib/api";
import { esp32Service } from "@/modules/esp32/esp32.service";
import type { RunFlowResponse } from "@/modules/esp32/esp32.types";
import { EpcScanner } from "@/modules/products/components/epc-scanner";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default function TapPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<RunFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const request = useRef<AbortController | null>(null);
  const total = (result?.products.reduce((sum, { product }) => sum + Math.round(Number(product.sale_price) * 100), 0) ?? 0) / 100;

  useEffect(() => () => request.current?.abort(), []);

  async function startFlow() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    setResult(null);
    setError(null);
    setPaid(false);

    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const response = await esp32Service.runFlow(token ?? "", controller.signal);
      if (!controller.signal.aborted) setResult(response);
    } catch (error) {
      if (!controller.signal.aborted) setError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) setReading(false);
      if (request.current === controller) request.current = null;
    }
  }

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

        {reading || !result ? (
          <section className="flex min-h-[60svh] flex-col items-center justify-center rounded-3xl border bg-background px-6 py-10 text-center" aria-busy={reading}>
            <span className="flex items-center gap-2 text-xs font-medium tracking-widest text-muted-foreground">
              <span className={`size-2 rounded-full ${reading ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-muted-foreground/50"}`} />
              {reading ? "LECTURA EN CURSO" : "LISTO PARA COMENZAR"}
            </span>
            <EpcScanner reading={reading} />
            <div className="max-w-md space-y-3" role="status" aria-live="polite">
              <h2 className="text-2xl font-semibold tracking-tight">{reading ? "Estamos leyendo tus productos" : "Comencemos tu compra"}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {reading ? "Colocá tus productos cuando se abra la puerta. El ciclo espera 10 segundos, cierra la puerta y realiza la lectura durante 5 segundos antes de volver a abrirla." : "Iniciá la lectura y colocá tus productos cuando se abra la puerta. Al finalizar, vas a poder revisar tu carrito."}
              </p>
            </div>
            <div className="mt-7">
              {!isLoaded ? <p className="text-sm text-muted-foreground">Cargando sesión...</p> : !isSignedIn ? (
                <Button asChild><Link to={APP_ROUTES.auth.login}>Iniciar sesión para comenzar<ArrowRightIcon aria-hidden="true" /></Link></Button>
              ) : (
                <Button size="lg" disabled={reading} onClick={() => void startFlow()}>
                  {reading ? <Loader2Icon className="motion-safe:animate-spin" aria-hidden="true" /> : <RadioIcon aria-hidden="true" />}
                  {reading ? "Leyendo productos..." : error ? "Volver a intentar" : "Iniciar lectura"}
                </Button>
              )}
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
                      <div className="min-w-0 flex-1 space-y-1"><p className="break-words text-sm font-medium">{product.name}</p><code className="block break-all text-xs text-muted-foreground">EPC: {epc}</code><p className="text-sm font-medium tabular-nums sm:hidden">{money.format(Number(product.sale_price))}</p></div>
                      <p className="hidden shrink-0 text-sm font-medium tabular-nums sm:block">{money.format(Number(product.sale_price))}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 px-6 py-14 text-center"><ShoppingBagIcon className="mx-auto mb-4 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-medium">No se detectaron productos</p><p className="text-sm text-muted-foreground">Revisá la ubicación de tus productos e iniciá otra lectura.</p></div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
                <p role="status" className="text-xs text-muted-foreground">Lectura completada · Puerta {result.door === "open" ? "abierta" : "cerrada"}</p>
                <Button variant="outline" size="sm" onClick={() => void startFlow()}><RadioIcon aria-hidden="true" />Nueva lectura</Button>
              </div>
            </section>

            <section className="min-w-0 rounded-3xl border bg-background p-6 sm:p-8" aria-labelledby="payment-title">
              <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground">02 / PAGO</p>
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="payment-title" className="text-xl font-semibold">Resumen de pago</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">Simulación</span></div>
              <div className="my-8 flex flex-wrap items-end justify-between gap-4 border-y py-6"><span className="text-sm text-muted-foreground">Total</span><span className="break-all text-3xl font-semibold tracking-tight tabular-nums">{money.format(total)}</span></div>
              <div className="mb-6 flex items-center gap-3 rounded-xl border bg-muted/20 p-4"><CreditCardIcon className="size-5 text-muted-foreground" aria-hidden="true" /><div><p className="text-sm font-medium">Pago de prueba</p><p className="text-xs text-muted-foreground">Sin ingresar datos de una tarjeta.</p></div></div>
              <Button className="w-full" size="lg" disabled={paid || result.products.length === 0} onClick={() => setPaid(true)}>
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
