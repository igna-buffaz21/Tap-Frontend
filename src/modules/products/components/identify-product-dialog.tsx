import { useAuth } from "@clerk/react";
import { Loader2Icon, RadioIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ErrorNotice } from "@/components/catalog/catalog-controls";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError, errorMessage } from "@/lib/api";
import { esp32Service } from "@/modules/esp32/esp32.service";
import type { EpcTag } from "@/modules/esp32/esp32.types";
import { productIdentificationsService } from "@/modules/product-identifications/product-identifications.service";
import type { Product } from "../products.types";
import { EpcScanner } from "./epc-scanner";

export function IdentifyProductDialog({ product, onClose, onAssigned }: {
  product: Product;
  onClose: () => void;
  onAssigned: (tag: EpcTag) => void;
}) {
  const { getToken } = useAuth();
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function readEpc() {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setReading(true);
    setError(null);
    setNotice(null);

    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const result = await esp32Service.readTag(token ?? "", controller.signal);
      if (controller.signal.aborted) return;

      if (result.found) {
        if (!result.tag?.epc?.trim()) {
          throw new ApiError("El lector no devolvió un EPC válido. Volvé a intentar.", 502);
        }
        setSaving(true);
        await productIdentificationsService.create(token ?? "", {
          product_id: product.id,
          type: "RFID_UHF",
          value: result.tag.epc.trim(),
        }, controller.signal);
        if (controller.signal.aborted) return;
        onAssigned({ ...result.tag, epc: result.tag.epc.trim() });
        onClose();
      } else {
        setNotice("No se detectó una única etiqueta. Acercá solo una etiqueta a la antena y volvé a intentar.");
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(errorMessage(error));
    } finally {
      if (!controller.signal.aborted) {
        setReading(false);
        setSaving(false);
      }
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !reading) onClose(); }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md" showCloseButton={!reading}>
        <DialogHeader>
          <DialogTitle>Identificar producto</DialogTitle>
          <DialogDescription className="break-words">{product.name}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/20 px-4 py-5" aria-busy={reading}>
          <div className="flex items-center justify-center gap-2 text-[10px] font-medium tracking-[0.18em] text-muted-foreground">
            <span className={`size-1.5 rounded-full ${reading ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-muted-foreground/50"}`} />
            {saving ? "ASIGNACIÓN EN CURSO" : reading ? "LECTURA EN CURSO" : "LECTOR EPC"}
          </div>
          <EpcScanner reading={reading && !saving} />
          <div className="space-y-1 text-center" role="status" aria-live="polite">
            <p className="text-sm font-medium">{saving ? "Asignando etiqueta al producto..." : reading ? "Buscando una etiqueta..." : "Acercá una sola etiqueta a la antena"}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {saving ? "La lectura fue correcta. Guardando el identificador RFID UHF." : reading ? "Mantenela cerca. La lectura puede tardar entre 5 y 10 segundos." : "Cuando esté lista, presioná Leer EPC para comenzar."}
            </p>
          </div>
        </div>

        {notice && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">{notice}</p>}
        {error && <ErrorNotice message={error} />}

        <DialogFooter>
          <Button variant="outline" disabled={reading} onClick={onClose}>Cerrar</Button>
          <Button disabled={reading} onClick={() => void readEpc()}>
            {reading ? <Loader2Icon className="motion-safe:animate-spin" aria-hidden="true" /> : <RadioIcon aria-hidden="true" />}
            {saving ? "Asignando..." : reading ? "Leyendo EPC..." : "Leer EPC"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
