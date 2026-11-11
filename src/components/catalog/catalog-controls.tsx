import { Loader2Icon, MoreHorizontalIcon, PencilIcon, PlusIcon, ScanLineIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Status } from "@/modules/products/products.types";

export function CatalogHeader({ title, description, createLabel, onCreate, disabled }: {
  title: string; description: string; createLabel: string; onCreate: () => void; disabled?: boolean;
}) {
  return <div className="flex flex-wrap items-center justify-between gap-4">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    <Button size="lg" onClick={onCreate} disabled={disabled}><PlusIcon aria-hidden="true" />{createLabel}</Button>
  </div>;
}

export function CatalogSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="relative w-full sm:max-w-sm"><SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" aria-hidden="true" /><Input className="h-9 pl-9" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><p>{message}</p>{onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>}</div>;
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"}><span className="mr-1 size-1.5 rounded-full bg-current" />{status === "active" ? "Activo" : "Inactivo"}</Badge>;
}

export function RowActions({ name, status, busy, disabled, onEdit, onStatus, onIdentify }: {
  name: string; status: Status; busy: boolean; disabled: boolean; onEdit: () => void; onStatus: () => void; onIdentify?: () => void;
}) {
  return <div className="flex items-center justify-end gap-1">
    <Button variant="ghost" size="sm" onClick={onEdit} disabled={disabled} aria-label={`Editar ${name}`}><PencilIcon aria-hidden="true" />Editar</Button>
    {onIdentify && <Button variant="ghost" size="sm" onClick={onIdentify} disabled={disabled} aria-label={`Identificar ${name}`}><ScanLineIcon aria-hidden="true" />Identificar</Button>}
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" disabled={disabled} aria-label={`Más acciones para ${name}`}>{busy ? <Loader2Icon className="animate-spin" /> : <MoreHorizontalIcon />}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onStatus}>{status === "active" ? "Desactivar" : "Activar"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
  </div>;
}

export function Field({ label, id, children, hint }: { label: string; id: string; children: ReactNode; hint?: string }) {
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function Choice({ id, value, onChange, options, disabled }: { id: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

export function SaveLabel({ saving, editing }: { saving: boolean; editing: boolean }) {
  return <>{saving && <Loader2Icon className="animate-spin" aria-hidden="true" />}{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}</>;
}
