import { useAuth } from "@clerk/react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Choice, ErrorNotice, Field, SaveLabel } from "@/components/catalog/catalog-controls";
import { errorMessage } from "@/lib/api";
import type { ProductCategory } from "@/modules/product-categories/product-categories.types";
import { productsService } from "../products.service";
import type { Product, ProductUnit, Status } from "../products.types";
import { productChanges, productCreatePayload, productDraft } from "../product-form";

const units = [
  { value: "unit", label: "Unidad" }, { value: "kg", label: "Kilogramo (kg)" },
  { value: "g", label: "Gramo (g)" }, { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" }, { value: "box", label: "Caja" }, { value: "pack", label: "Pack" },
];

export function ProductDialog({ product, categories, onClose, onSaved }: {
  product?: Product; categories: ProductCategory[]; onClose: () => void; onSaved: (product: Product) => void;
}) {
  const { getToken } = useAuth();
  const prefix = useId();
  const [draft, setDraft] = useState(() => productDraft(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = (field: string) => `${prefix}-${field}`;
  function change(field: keyof typeof draft, value: string) { setDraft((current) => ({ ...current, [field]: value })); }
  const unchanged = product ? Object.keys(productChanges(draft, product)).length === 0 : false;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!draft.name.trim()) { setError("Ingresá el nombre del producto."); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const result = product
        ? await productsService.update(token ?? "", product.id, productChanges(draft, product))
        : await productsService.create(token ?? "", productCreatePayload(draft));
      onSaved(result);
      onClose();
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl" showCloseButton={!saving}>
      <DialogHeader><DialogTitle>{product ? "Editar producto" : "Crear producto"}</DialogTitle><DialogDescription>{product ? "Actualizá los datos del producto." : "Completá los datos del producto. Solo el nombre es obligatorio."}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-5">
        <fieldset disabled={saving} className="grid min-w-0 gap-4">
          <Field id={id("name")} label="Nombre *"><Input id={id("name")} required value={draft.name} onChange={(e) => change("name", e.target.value)} placeholder="Ej. Agua mineral 500 ml" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={id("category")} label="Categoría"><Choice id={id("category")} value={draft.category} onChange={(value) => change("category", value)} options={[{ value: "none", label: "Sin categoría" }, ...categories.map((category) => ({ value: String(category.id), label: `${category.name}${category.status === "inactive" ? " (inactiva)" : ""}` }))]} /></Field>
            <Field id={id("sku")} label="SKU"><Input id={id("sku")} value={draft.sku} onChange={(e) => change("sku", e.target.value)} placeholder="Ej. AGUA-500" /></Field>
          </div>
          <Field id={id("description")} label="Descripción"><Textarea id={id("description")} value={draft.description} onChange={(e) => change("description", e.target.value)} placeholder="Descripción del producto" rows={3} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id={id("unit")} label="Unidad"><Choice id={id("unit")} value={draft.unit} onChange={(value) => change("unit", value as ProductUnit)} options={units} /></Field>
            <Field id={id("cost")} label="Precio de costo"><Input id={id("cost")} type="number" min="0" step="any" value={draft.cost} onChange={(e) => change("cost", e.target.value)} placeholder="Sin especificar" /></Field>
            <Field id={id("price")} label="Precio de venta"><Input id={id("price")} type="number" min="0" step="any" value={draft.price} onChange={(e) => change("price", e.target.value)} placeholder="Sin especificar" /></Field>
          </div>
          {!product && <>
            <Field id={id("status")} label="Estado"><Choice id={id("status")} value={draft.status} onChange={(value) => change("status", value as Status)} options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]} /></Field>
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><p className="text-sm font-medium">Stock inicial (opcional)</p><p className="mt-1 text-xs text-muted-foreground">Si indicás una sucursal, se creará su stock con cantidad inicial 0.</p></div>
              <Field id={id("branch")} label="ID de sucursal"><Input id={id("branch")} type="number" min="1" step="1" value={draft.branch} onChange={(e) => setDraft((current) => ({ ...current, branch: e.target.value, minimum: e.target.value ? current.minimum : "" }))} placeholder="Ej. 2" /></Field>
              <Field id={id("minimum")} label="Cantidad mínima"><Input id={id("minimum")} type="number" min="0" step="any" disabled={!draft.branch} value={draft.minimum} onChange={(e) => change("minimum", e.target.value)} placeholder="0" /></Field>
            </div>
          </>}
        </fieldset>
        {error && <ErrorNotice message={error} />}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving || unchanged}><SaveLabel saving={saving} editing={Boolean(product)} /></Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
