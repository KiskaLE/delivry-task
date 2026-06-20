import { ne } from "drizzle-orm";
import { invoiceImportSchema } from "~/schema/invoice";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { companies, shipments, invoices } from "~/server/db/schema";

export const invoiceRouter = createTRPCRouter({
  import: publicProcedure
    .input(invoiceImportSchema)
    .mutation(({ input, ctx }) => {
      return ctx.db.transaction(async (tx) => {
        let imported = 0;
        let duplicates = 0;

        for (const invoice of input) {
          const shipment = invoice.shipment;
          const company = invoice.shipment.company;

          await tx
            .insert(companies)
            .values({
              id: company.id,
              name: company.name,
            })
            .onConflictDoNothing({ target: companies.id });

          await tx
            .insert(shipments)
            .values({
              id: shipment.id,
              companyId: company.id,
              trackingNumber: shipment.trackingNumber,
              mode: shipment.mode,
              originCountry: shipment.originCountry,
              destinationCountry: shipment.destinationCountry,
              provider: shipment.provider,
              shipmentCreatedAt: new Date(shipment.createdAt),
            })
            .onConflictDoNothing({ target: shipments.id });

          const importedInvoices = await tx
            .insert(invoices)
            .values({
              id: invoice.id,
              shipmentId: shipment.id,
              price: invoice.invoicedPrice,
              weight: invoice.invoicedWeight,
            })
            .onConflictDoUpdate({
              target: invoices.shipmentId,
              set: {
                id: invoice.id,
                price: invoice.invoicedPrice,
                weight: invoice.invoicedWeight,
              },
              where: ne(invoices.id, invoice.id),
            })
            .returning({ id: invoices.id });

          imported += importedInvoices.length;

          if (importedInvoices.length === 0) {
            duplicates += 1;
          }
        }

        return { imported, duplicates };
      });
    }),
});
