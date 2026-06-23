import { useForm } from "@tanstack/react-form";
import { useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";
import z from "zod";
import { invoiceImportSchema } from "~/schema/invoice";
import { api, type RouterOutputs } from "~/trpc/react";

type InvoiceImportRow = z.infer<typeof invoiceImportSchema>[number];
type ImportConflict =
  RouterOutputs["invoice"]["validateImport"]["conflicts"][number];

type UseInvoiceUploadDialogProps = {
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

export function useInvoiceUploadDialog({
  onImportSuccessAction,
}: UseInvoiceUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<InvoiceImportRow[]>([]);
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

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
  const conflictsByShipmentId = useMemo(
    () =>
      new Map(
        importConflicts.map((conflict) => [conflict.shipmentId, conflict]),
      ),
    [importConflicts],
  );

  const validateImportMutation = api.invoice.validateImport.useMutation();
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

  function resetUploadForm() {
    form.reset();
    setRows([]);
    setImportConflicts([]);
    setParseError(null);
    setIsDraggingFiles(false);
    setFileInputKey((key) => key + 1);
  }

  async function parseJsonFiles(files: File[]) {
    setParseError(null);
    setRows([]);
    setImportConflicts([]);

    const parsedRows: InvoiceImportRow[] = [];

    for (const file of files) {
      try {
        const json = JSON.parse(await file.text()) as unknown;
        const result = invoiceImportSchema.safeParse(json);

        if (!result.success) {
          setParseError(
            `File ${file.name} does not match the expected invoice format.`,
          );
          return null;
        }

        parsedRows.push(...result.data);
      } catch {
        setParseError(`File ${file.name} is not valid JSON.`);
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

    try {
      const validation = await validateImportMutation.mutateAsync(sortedRows);
      setImportConflicts(validation.conflicts);
    } catch {
      setParseError(
        "Could not validate the import against existing shipments.",
      );
      return null;
    }

    return sortedRows;
  }

  async function handleFilesSelected(
    files: File[],
    updateFiles: (files: File[]) => void,
  ) {
    if (files.length === 0) {
      updateFiles([]);
      setRows([]);
      setParseError("Choose at least one JSON file.");
      return;
    }

    updateFiles(files);
    await parseJsonFiles(files);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetUploadForm();
    }
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingFiles(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingFiles(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDraggingFiles(false);
    }
  }

  async function handleDrop(
    event: DragEvent<HTMLElement>,
    updateFiles: (files: File[]) => void,
  ) {
    event.preventDefault();
    setIsDraggingFiles(false);

    await handleFilesSelected(
      Array.from(event.dataTransfer.files),
      updateFiles,
    );
  }

  return {
    open,
    rows,
    importConflicts,
    parseError,
    fileInputKey,
    isDraggingFiles,
    duplicateInvoiceIds,
    duplicateShipmentIds,
    duplicateRowsCount,
    conflictsByShipmentId,
    form,
    handleOpenChange,
    handleFilesSelected,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
