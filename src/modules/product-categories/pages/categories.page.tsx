import { useState } from "react";
import { CatalogHeader, CatalogSearch, ErrorNotice, RowActions, StatusBadge } from "@/components/catalog/catalog-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/hooks/use-collection";
import { useCatalogStatus } from "@/hooks/use-catalog-status";
import { productCategoriesService } from "../product-categories.service";
import type { ProductCategory } from "../product-categories.types";
import { CategoryDialog } from "../components/category-dialog";

export default function CategoriesPage() {
  const categories = useCollection(productCategoriesService.list);
  const status = useCatalogStatus(productCategoriesService.setStatus, categories.upsert);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ category?: ProductCategory } | null>(null);
  const [message, setMessage] = useState("");
  const query = search.trim().toLocaleLowerCase("es");
  const rows = categories.items.filter((row) => `${row.name} ${row.description ?? ""}`.toLocaleLowerCase("es").includes(query));

  return <section className="flex w-full min-w-0 flex-col gap-6">
    <CatalogHeader title="Categorías" description="Organizá los productos de tu negocio." createLabel="Crear categoría" disabled={categories.loading || Boolean(categories.error)} onCreate={() => { setMessage(""); setDialog({}); }} />
    {categories.error && <ErrorNotice message={categories.error} onRetry={categories.reload} />}
    {status.error && <ErrorNotice message={status.error} />}
    <div className="flex flex-wrap items-center justify-between gap-3"><CatalogSearch value={search} onChange={setSearch} placeholder="Buscar categorías..." /><p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "categoría" : "categorías"}</p></div>
    <div className="overflow-hidden rounded-xl border">
      <Table aria-label="Categorías del negocio" aria-busy={categories.loading}>
        <TableHeader><TableRow><TableHead className="pl-4">Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Estado</TableHead><TableHead className="pr-4 text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
          {categories.loading ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Cargando categorías...</TableCell></TableRow>
          : categories.error ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No se pudieron cargar las categorías.</TableCell></TableRow>
          : rows.length === 0 ? <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground">{query ? "No hay categorías que coincidan con tu búsqueda." : "Todavía no hay categorías. Creá la primera para organizar tus productos."}</TableCell></TableRow>
          : rows.map((category) => <TableRow key={category.id}>
            <TableCell className="max-w-72 py-4 pl-4 font-medium whitespace-normal break-words">{category.name}</TableCell>
            <TableCell className="max-w-96 whitespace-normal break-words text-muted-foreground">{category.description || "—"}</TableCell>
            <TableCell><StatusBadge status={category.status} /></TableCell>
            <TableCell className="pr-3"><RowActions name={category.name} status={category.status} busy={status.pendingId === category.id} disabled={status.pendingId !== null} onEdit={() => { setMessage(""); setDialog({ category }); }} onStatus={() => { setMessage(""); void status.changeStatus(category); }} /></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
    <p role="status" className="text-sm text-muted-foreground">{message || status.message}</p>
    {dialog && <CategoryDialog category={dialog.category} onClose={() => setDialog(null)} onSaved={(category) => { categories.upsert(category); setMessage(dialog.category ? "Categoría actualizada." : "Categoría creada."); }} />}
  </section>;
}
