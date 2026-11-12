import { useState } from "react";
import { CatalogHeader, CatalogSearch, ErrorNotice, RowActions, StatusBadge } from "@/components/catalog/catalog-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCollection } from "@/hooks/use-collection";
import { useCatalogStatus } from "@/hooks/use-catalog-status";
import { productCategoriesService } from "@/modules/product-categories/product-categories.service";
import { productsService } from "../products.service";
import type { Product } from "../products.types";
import { ProductDialog } from "../components/product-dialog";
import { IdentifyProductDialog } from "../components/identify-product-dialog";
import type { EpcTag } from "@/modules/esp32/esp32.types";

const priceFormat = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const unitLabels = { unit: "Unidad", kg: "kg", g: "g", l: "l", ml: "ml", box: "Caja", pack: "Pack" };

export default function ProductsPage() {
  const products = useCollection(productsService.list);
  const categories = useCollection(productCategoriesService.list);
  const status = useCatalogStatus(productsService.setStatus, products.upsert);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ product?: Product } | null>(null);
  const [message, setMessage] = useState("");
  const [identifyingProduct, setIdentifyingProduct] = useState<Product | null>(null);
  const [lastRead, setLastRead] = useState<{ productName: string; tag: EpcTag } | null>(null);
  const categoryNames = new Map(categories.items.map((category) => [category.id, category.name]));
  const query = search.trim().toLocaleLowerCase("es");
  const rows = products.items.filter((row) => `${row.name} ${row.sku ?? ""} ${row.description ?? ""} ${categoryNames.get(row.category_id ?? -1) ?? ""}`.toLocaleLowerCase("es").includes(query));

  return <section className="flex w-full min-w-0 flex-col gap-6">
    <CatalogHeader title="Productos" description="Administrá el catálogo y los precios de tu negocio." createLabel="Crear producto" onCreate={() => { setMessage(""); setDialog({}); }} disabled={products.loading || Boolean(products.error) || categories.loading || Boolean(categories.error)} />
    {products.error && <ErrorNotice message={products.error} onRetry={products.reload} />}
    {categories.error && <ErrorNotice message={`No se pudieron cargar las categorías. ${categories.error}`} onRetry={categories.reload} />}
    {status.error && <ErrorNotice message={status.error} />}
    <div className="flex flex-wrap items-center justify-between gap-3"><CatalogSearch value={search} onChange={setSearch} placeholder="Buscar por nombre, SKU o categoría..." /><p className="text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "producto" : "productos"}</p></div>
    <div className="overflow-hidden rounded-xl border">
      <Table aria-label="Productos del negocio" aria-busy={products.loading}>
        <TableHeader><TableRow><TableHead className="pl-4">Producto</TableHead><TableHead>Categoría</TableHead><TableHead>Unidad</TableHead><TableHead className="text-right">Costo</TableHead><TableHead className="text-right">Venta</TableHead><TableHead>Estado</TableHead><TableHead className="pr-4 text-right">Acciones</TableHead></TableRow></TableHeader>
        <TableBody>
          {products.loading ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Cargando productos...</TableCell></TableRow>
          : products.error ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No se pudieron cargar los productos.</TableCell></TableRow>
          : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">{query ? "No hay productos que coincidan con tu búsqueda." : "Todavía no hay productos. Creá el primero para comenzar."}</TableCell></TableRow>
          : rows.map((product) => <TableRow key={product.id}>
            <TableCell className="max-w-80 py-4 pl-4 whitespace-normal break-words"><p className="font-medium">{product.name}</p>{product.sku && <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>}</TableCell>
            <TableCell className="max-w-56 whitespace-normal break-words text-muted-foreground">{product.category_id == null ? "Sin categoría" : categoryNames.get(product.category_id) ?? (categories.loading ? "Cargando..." : `Categoría #${product.category_id}`)}</TableCell>
            <TableCell>{unitLabels[product.unit]}</TableCell>
            <TableCell className="text-right tabular-nums">{product.cost_price == null ? "—" : priceFormat.format(product.cost_price)}</TableCell>
            <TableCell className="text-right tabular-nums font-medium">{product.sale_price == null ? "—" : priceFormat.format(product.sale_price)}</TableCell>
            <TableCell><StatusBadge status={product.status} /></TableCell>
            <TableCell className="pr-3"><RowActions name={product.name} status={product.status} busy={status.pendingId === product.id} disabled={status.pendingId !== null || categories.loading || Boolean(categories.error)} onEdit={() => { setMessage(""); setDialog({ product }); }} onIdentify={() => { setLastRead(null); setMessage(""); setIdentifyingProduct(product); }} onStatus={() => { setMessage(""); void status.changeStatus(product); }} /></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
    <p role="status" className="text-sm text-muted-foreground">{message || status.message}</p>
    {lastRead && <div role="status" className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
      <p className="text-sm font-medium">Etiqueta asignada a {lastRead.productName}</p>
      <code className="block break-all text-sm">{lastRead.tag.epc}</code>
      <p className="text-xs text-muted-foreground">Identificador RFID UHF guardado correctamente.</p>
    </div>}
    {identifyingProduct && <IdentifyProductDialog product={identifyingProduct} onClose={() => setIdentifyingProduct(null)} onAssigned={(tag) => setLastRead({ productName: identifyingProduct.name, tag })} />}
    {dialog && <ProductDialog product={dialog.product} categories={categories.items} onClose={() => setDialog(null)} onSaved={(product) => { products.upsert(product); setMessage(dialog.product ? "Producto actualizado." : "Producto creado."); }} />}
  </section>;
}
