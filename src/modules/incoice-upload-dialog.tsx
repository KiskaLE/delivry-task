"use client";

import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { invoiceImportSchema } from "~/schema/invoice";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Field, FieldGroup, FieldError } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type InvoiceImportRow = z.infer<typeof invoiceImportSchema>[number];

type InvoiceUploadDialogProps = {
  onImportSuccessAction?: () => void | Promise<void>;
};

function getDuplicateValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([value]) => value),
  );
}

export default function InvoiceUploadDialog({
  onImportSuccessAction,
}: InvoiceUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<InvoiceImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const stickyHeadClass = "sticky top-0 z-10 bg-background";
  const duplicateInvoiceIds = useMemo(
    () => getDuplicateValues(rows.map((row) => row.id)),
    [rows],
  );
  const duplicateShipmentIds = useMemo(
    () => getDuplicateValues(rows.map((row) => row.shipment.id)),
    [rows],
  );
  const duplicateRowsCount = rows.filter(
    (row) =>
      duplicateInvoiceIds.has(row.id) ||
      duplicateShipmentIds.has(row.shipment.id),
  ).length;

  const importInvoicesMutation = api.invoice.import.useMutation({
    onError: () => toast.error("Error occur when importing invoices"),
    onSuccess: (value) => {
      if (value.duplicates === 0) {
        toast.success(`${value.imported} invoices imported succesfuly`);
      } else {
        toast.success(
          `${value.imported} invoices imported, ${value.duplicates} duplicates skipped`,
        );
      }

      void onImportSuccessAction?.();
      setOpen(false);
      resetUploadForm();
    },
  });

  const form = useForm({
    defaultValues: {
      files: [] as File[],
    },
    validators: {
      onSubmit: z.object({
        files: z
          .array(z.instanceof(File))
          .min(1, { message: "You must upload at least one JSON file" })
          .refine(
            (files) =>
              files.every(
                (file) =>
                  file.type === "application/json" ||
                  file.name.endsWith(".json"),
              ),
            "All files must be JSON.",
          ),
      }),
    },
    onSubmit: async ({ value }) => {
      setOpen(false);

      const parsedRows =
        rows.length > 0 ? rows : await parseJsonFiles(value.files);

      if (!parsedRows) {
        toast.error("Error parsing JSON");
        return;
      }

      importInvoicesMutation.mutate(parsedRows);
    },
  });

  const resetUploadForm = () => {
    form.reset();
    setRows([]);
    setParseError(null);
    setIsDraggingFiles(false);
    setFileInputKey((key) => key + 1);
  };

  const parseJsonFiles = async (files: File[]) => {
    setParseError(null);
    setRows([]);

    const parsedRows: InvoiceImportRow[] = [];

    for (const file of files) {
      try {
        const json = JSON.parse(await file.text()) as unknown;
        const result = invoiceImportSchema.safeParse(json);

        if (!result.success) {
          setParseError(`Soubor ${file.name} nemá očekávaný formát faktur.`);
          return null;
        }

        parsedRows.push(...result.data);
      } catch {
        setParseError(`Soubor ${file.name} není platný JSON.`);
        return null;
      }
    }

    const sortedRows = [...parsedRows].sort((left, right) => {
      const createdAtDiff =
        new Date(left.shipment.createdAt).getTime() -
        new Date(right.shipment.createdAt).getTime();

      if (createdAtDiff !== 0) {
        return createdAtDiff;
      }

      return left.shipment.id.localeCompare(right.shipment.id);
    });

    setRows(sortedRows);
    return sortedRows;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          resetUploadForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Upload invoices</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <form
          className="min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Upload invoice JSON</DialogTitle>
            <DialogDescription>
              Upload one or more invoice JSON files.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field name="files">
              {(field) => (
                <Field>
                  {rows.length === 0 ? (
                    <Label
                      htmlFor={field.name}
                      className={cn(
                        "border-input bg-input/20 hover:bg-input/30 flex min-h-90 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-6 py-14 text-center transition-colors",
                        isDraggingFiles &&
                        "border-ring bg-input/40 ring-ring/30 ring-2",
                        parseError && "border-destructive",
                      )}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsDraggingFiles(true);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingFiles(true);
                      }}
                      onDragLeave={(event) => {
                        if (
                          !event.currentTarget.contains(
                            event.relatedTarget as Node,
                          )
                        ) {
                          setIsDraggingFiles(false);
                        }
                      }}
                      onDrop={async (event) => {
                        event.preventDefault();
                        setIsDraggingFiles(false);

                        const files = Array.from(event.dataTransfer.files);

                        if (files.length === 0) {
                          field.handleChange([]);
                          setRows([]);
                          setParseError("Vyber aspoň jeden JSON soubor.");
                          return;
                        }

                        field.handleChange(files);
                        await parseJsonFiles(files);
                      }}
                    >
                      <span className="text-base font-medium">
                        Drop JSON files here
                      </span>
                      <span className="text-muted-foreground mt-2 text-sm">
                        or click to choose one or more invoice imports
                      </span>
                      <span className="text-muted-foreground mt-1 text-xs">
                        Supports .json files only
                      </span>
                    </Label>
                  ) : null}
                  <Input
                    key={fileInputKey}
                    id={field.name}
                    name={field.name}
                    type="file"
                    accept="application/json,.json"
                    multiple
                    className={rows.length === 0 ? "sr-only" : undefined}
                    onBlur={field.handleBlur}
                    onChange={async (event) => {
                      const files = Array.from(event.target.files ?? []);

                      if (files.length === 0) {
                        field.handleChange([]);
                        setRows([]);
                        setParseError("Vyber aspoň jeden JSON soubor.");
                        return;
                      }

                      field.handleChange(files);
                      await parseJsonFiles(files);
                    }}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  {!field.state.meta.isValid && (
                    <FieldError>
                      {field.state.meta.errors
                        .map((error) => error?.message)
                        .join(", ")}
                    </FieldError>
                  )}
                  {parseError && <FieldError>{parseError}</FieldError>}
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          {rows.length > 0 && (
            <>
              <p className="text-muted-foreground mt-4 text-sm">
                Ready to import {rows.length} invoices from selected files.
              </p>
              {duplicateRowsCount > 0 && (
                <div className="border-destructive/40 bg-destructive/10 text-destructive mt-3 rounded-md border px-3 py-2 text-sm">
                  Import contains {duplicateRowsCount} rows with duplicate
                  invoice or shipment identifiers. Check the highlighted rows
                  before importing.
                </div>
              )}
              <div className="mt-2 max-h-96 w-full max-w-full min-w-0 overflow-auto rounded-md border">
                <table className="w-full min-w-max caption-bottom text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={stickyHeadClass}>
                        Tracking
                      </TableHead>
                      <TableHead className={stickyHeadClass}>Company</TableHead>
                      <TableHead className={stickyHeadClass}>
                        Provider
                      </TableHead>
                      <TableHead className={stickyHeadClass}>Mode</TableHead>
                      <TableHead className={stickyHeadClass}>Route</TableHead>
                      <TableHead className={`${stickyHeadClass} text-right`}>
                        Weight kg
                      </TableHead>
                      <TableHead className={`${stickyHeadClass} text-right`}>
                        Price CZK
                      </TableHead>
                      <TableHead className={`${stickyHeadClass} text-right`}>
                        Created
                      </TableHead>
                      <TableHead className={stickyHeadClass}>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const hasDuplicateInvoiceId = duplicateInvoiceIds.has(
                        row.id,
                      );
                      const hasDuplicateShipmentId = duplicateShipmentIds.has(
                        row.shipment.id,
                      );
                      const duplicateLabels = [
                        hasDuplicateInvoiceId ? "Duplicate invoice" : null,
                        hasDuplicateShipmentId ? "Duplicate shipment" : null,
                      ].filter(Boolean);

                      return (
                        <TableRow
                          key={`${row.id}-${row.shipment.id}-${index}`}
                          className={
                            duplicateLabels.length > 0
                              ? "bg-destructive/10"
                              : undefined
                          }
                        >
                          <TableCell>{row.shipment.trackingNumber}</TableCell>
                          <TableCell>{row.shipment.company.name}</TableCell>
                          <TableCell>{row.shipment.provider}</TableCell>
                          <TableCell>{row.shipment.mode}</TableCell>
                          <TableCell>
                            {row.shipment.originCountry} {" -> "}
                            {row.shipment.destinationCountry}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.invoicedWeight}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.invoicedPrice}
                          </TableCell>
                          <TableCell>
                            {new Date(row.shipment.createdAt).toLocaleString(
                              "cs-CZ",
                            )}
                          </TableCell>
                          <TableCell
                            className={
                              duplicateLabels.length > 0
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {duplicateLabels.length > 0
                              ? duplicateLabels.join(", ")
                              : "OK"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </table>
              </div>
            </>
          )}
          <DialogFooter className="mt-5">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={rows.length === 0 || !!parseError}>
              Upload invoices
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
