"use client";

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
import { useInvoiceUploadDialog } from "./hooks/use-invoice-upload-dialog";

type InvoiceUploadDialogProps = {
  onImportSuccessAction?: () => void | Promise<void>;
};

export default function InvoiceUploadDialog({
  onImportSuccessAction,
}: InvoiceUploadDialogProps) {
  const stickyHeadClass = "sticky top-0 z-10 bg-background";
  const {
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
  } = useInvoiceUploadDialog({ onImportSuccessAction });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(event) =>
                        void handleDrop(event, field.handleChange)
                      }
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
                      await handleFilesSelected(files, field.handleChange);
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
              {importConflicts.length > 0 && (
                <p className="text-destructive mt-3 text-sm">
                  Import contains {importConflicts.length} shipments that
                  already belong to a different company. Fix the JSON before
                  uploading.
                </p>
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
                      const companyConflict = conflictsByShipmentId.get(
                        row.shipment.id,
                      );
                      const hasCompanyConflict = !!companyConflict;
                      const statusLabels = [
                        ...duplicateLabels,
                        hasCompanyConflict ? "Company conflict" : null,
                      ].filter(Boolean);

                      return (
                        <TableRow
                          key={`${row.id}-${row.shipment.id}-${index}`}
                          className={
                            statusLabels.length > 0
                              ? "bg-destructive/10"
                              : undefined
                          }
                        >
                          <TableCell>{row.shipment.trackingNumber}</TableCell>
                          <TableCell
                            className={
                              hasCompanyConflict
                                ? "text-destructive font-medium"
                                : undefined
                            }
                          >
                            <div>{row.shipment.company.name}</div>
                            {companyConflict ? (
                              <div className="text-destructive/80 mt-1 max-w-64 text-[11px] leading-tight whitespace-normal">
                                Existing shipment belongs to{" "}
                                {companyConflict.existingCompanyName}
                              </div>
                            ) : null}
                          </TableCell>
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
                              statusLabels.length > 0
                                ? "text-destructive font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {statusLabels.length > 0
                              ? statusLabels.join(", ")
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
            <Button
              type="submit"
              disabled={
                rows.length === 0 || !!parseError || importConflicts.length > 0
              }
            >
              Upload invoices
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
