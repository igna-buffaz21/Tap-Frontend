import { useAuth } from "@clerk/react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Choice, ErrorNotice, Field, SaveLabel } from "@/components/catalog/catalog-controls";
import { errorMessage } from "@/lib/api";
import type { Status } from "@/modules/products/products.types";
import type { ProductCategory } from "../product-categories.types";
import { productCategoriesService } from "../product-categories.service";
import { categoryChanges } from "../category-form";

export function CategoryDialog({ category, onClose, onSaved }: { category?: ProductCategory; onClose: () => void; onSaved: (category: ProductCategory) => void }) {
  const { getToken } = useAuth();
  const prefix = useId();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState<Status>("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unchanged = category ? Object.keys(categoryChanges(name, description, category)).length === 0 : false;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) { setError("Ingresá el nombre de la categoría."); return; }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const result = category
        ? await productCategoriesService.update(token ?? "", category.id, categoryChanges(name, description, category))
        : await productCategoriesService.create(token ?? "", { name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}), status });
      onSaved(result);
      onClose();
    } catch (error) { setError(errorMessage(error)); }
    finally { setSaving(false); }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg" showCloseButton={!saving}>
      <DialogHeader><DialogTitle>{category ? "Editar categoría" : "Crear categoría"}</DialogTitle><DialogDescription>{category ? "Actualizá los datos de la categoría." : "Agrupá tus productos. Solo el nombre es obligatorio."}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-5">
        <fieldset disabled={saving} className="grid min-w-0 gap-4">
          <Field id={`${prefix}-name`} label="Nombre *"><Input id={`${prefix}-name`} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Bebidas" /></Field>
          <Field id={`${prefix}-description`} label="Descripción"><Textarea id={`${prefix}-description`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción de la categoría" rows={3} /></Field>
          {!category && <Field id={`${prefix}-status`} label="Estado"><Choice id={`${prefix}-status`} value={status} onChange={(value) => setStatus(value as Status)} options={[{ value: "active", label: "Activa" }, { value: "inactive", label: "Inactiva" }]} /></Field>}
        </fieldset>
        {error && <ErrorNotice message={error} />}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving || unchanged}><SaveLabel saving={saving} editing={Boolean(category)} /></Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
