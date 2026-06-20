import z from "zod";

export const invoiceImportSchema = z.array(
    z.object({
        id: z.string().min(1),
        shipment: z.object({
            id: z.string().min(1),
            createdAt: z.string().datetime(),
            trackingNumber: z.string().min(1),
            company: z.object({
                id: z.string().min(1),
                name: z.string().min(1),
            }),
            provider: z.enum(["GLS", "DPD", "UPS", "PPL", "FedEx"]),
            mode: z.enum(["EXPORT", "IMPORT"]),
            originCountry: z.string().length(2),
            destinationCountry: z.string().length(2),
        }),
        invoicedWeight: z.number(),
        invoicedPrice: z.number(),
    }),
);