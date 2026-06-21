"use client"

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
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
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";

type InvoiceImportRow = z.infer<typeof invoiceImportSchema>[number];

export default function InvoiceUploadDialog() {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<InvoiceImportRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const stickyHeadClass = "sticky top-0 z-10 bg-background";

    const importInvoicesMutation = api.invoice.import.useMutation({
        onError: () => toast.error("Error occur when importing invoices"),
        onSuccess: (value) => {
            if (value.duplicates === 0) {
                toast.success(`${value.imported} invoices imported succesfuly`);
                return;
            }

            toast.success(
                `${value.imported} invoices imported, ${value.duplicates} duplicates skipped`,
            );
        },
    });

    const form = useForm({
        defaultValues: {
            file: null as unknown as File,
        },
        validators: {
            onSubmit: z.object({
                file: z
                    .instanceof(File, { message: "You must upload JSON file" })
                    .refine(
                        (file) =>
                            file.type === "application/json" || file.name.endsWith(".json"),
                        "File must be JSON.",
                    ),
            }),
        },
        onSubmit: async ({ value }) => {
            const json = JSON.parse(await value.file.text()) as unknown;
            const result = invoiceImportSchema.safeParse(json);

            try {
                if (!result.success) {
                    toast.error("Error parsing JSON");
                    return;
                }

                importInvoicesMutation.mutate(result.data);
            } catch {
                toast.error("Error parsing JSON");
            }
        },
    });

    const parseJsonFile = async (file: File) => {
        setParseError(null);
        setRows([]);

        try {
            const json = JSON.parse(await file.text()) as unknown;
            const result = invoiceImportSchema.safeParse(json);

            if (!result.success) {
                setParseError("JSON nemá očekávaný formát faktur.");
                return;
            }

            setRows(result.data);
        } catch {
            setParseError("Soubor není platný JSON.");
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (!nextOpen) {
                    form.reset();
                    setRows([]);
                    setParseError(null);
                    setFileInputKey((key) => key + 1);
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
                        <DialogTitle>Upload invoice json</DialogTitle>
                        <DialogDescription>
                            Plese upload invoice in json formant
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <form.Field name="file">
                            {(field) => (
                                <Field>
                                    <Label htmlFor={field.name}>Json import</Label>
                                    <Input
                                        key={fileInputKey}
                                        id={field.name}
                                        name={field.name}
                                        type="file"
                                        accept="application/json,.json"
                                        onBlur={field.handleBlur}
                                        onChange={async (event) => {
                                            const file = event.target.files?.[0];

                                            if (!file) {
                                                field.handleChange(null as unknown as File);
                                                setRows([]);
                                                setParseError("Vyber JSON soubor.");
                                                return;
                                            }

                                            field.handleChange(file);
                                            await parseJsonFile(file);
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
                        <div className="mt-5 max-h-96 w-full max-w-full min-w-0 overflow-auto rounded-md border">
                            <table className="w-full min-w-max caption-bottom text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className={stickyHeadClass}>Tracking</TableHead>
                                        <TableHead className={stickyHeadClass}>Company</TableHead>
                                        <TableHead className={stickyHeadClass}>Provider</TableHead>
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={row.id}>
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
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </table>
                        </div>
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