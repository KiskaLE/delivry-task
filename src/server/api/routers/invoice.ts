import { inArray, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invoiceImportSchema } from "~/schema/invoice";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { companies, shipments, invoices } from "~/server/db/schema";

export const invoiceProvider = createTRPCRouter({
  validateImport: publicProcedure
    .input(invoiceImportSchema)
    .mutation(async ({ input, ctx }) => {
      const shipmentIds = [
        ...new Set(input.map((invoice) => invoice.shipment.id)),
      ];
      const existingShipments = shipmentIds.length
        ? await ctx.db.query.shipments.findMany({
            columns: {
              id: true,
              companyId: true,
            },
            with: {
              company: {
                columns: {
                  name: true,
                },
              },
            },
            where: inArray(shipments.id, shipmentIds),
          })
        : [];
      const existingShipmentCompanyIds = new Map(
        existingShipments.map((shipment) => [
          shipment.id,
          {
            id: shipment.companyId,
            name: shipment.company.name,
          },
        ]),
      );

      return {
        conflicts: input.flatMap((invoice) => {
          const existingCompany = existingShipmentCompanyIds.get(
            invoice.shipment.id,
          );

          if (
            !existingCompany ||
            existingCompany.id === invoice.shipment.company.id
          ) {
            return [];
          }

          return {
            invoiceId: invoice.id,
            shipmentId: invoice.shipment.id,
            existingCompanyId: existingCompany.id,
            existingCompanyName: existingCompany.name,
            importedCompanyId: invoice.shipment.company.id,
            importedCompanyName: invoice.shipment.company.name,
          };
        }),
      };
    }),

  import: publicProcedure
    .input(invoiceImportSchema)
    .mutation(({ input, ctx }) => {
      return ctx.db.transaction(async (tx) => {
        let imported = 0;
        let duplicates = 0;

        const sortedInput = [...input].sort((left, right) => {
          const createdAtDiff =
            new Date(left.shipment.createdAt).getTime() -
            new Date(right.shipment.createdAt).getTime();

          if (createdAtDiff !== 0) {
            return createdAtDiff;
          }

          return left.shipment.id.localeCompare(right.shipment.id);
        });

        // This validation is unnecessary while the assignment guarantee holds:
        // objects with the same id always contain the exact same data.
        // It only protects against inconsistent imports from outside that contract.
        const shipmentIds = [
          ...new Set(sortedInput.map((invoice) => invoice.shipment.id)),
        ];
        const existingShipments = shipmentIds.length
          ? await tx.query.shipments.findMany({
              columns: {
                id: true,
                companyId: true,
              },
              where: inArray(shipments.id, shipmentIds),
            })
          : [];
        const existingShipmentCompanyIds = new Map(
          existingShipments.map((shipment) => [
            shipment.id,
            shipment.companyId,
          ]),
        );

        for (const invoice of sortedInput) {
          const shipment = invoice.shipment;
          const company = invoice.shipment.company;
          const existingCompanyId = existingShipmentCompanyIds.get(shipment.id);

          if (existingCompanyId && existingCompanyId !== company.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Shipment ${shipment.id} already belongs to company ${existingCompanyId}, but invoice ${invoice.id} references company ${company.id}.`,
            });
          }
        }

        for (const invoice of sortedInput) {
          const shipment = invoice.shipment;
          const company = invoice.shipment.company;
          const shipmentCreatedAt = new Date(shipment.createdAt);

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
              shipmentCreatedAt,
            })
            .onConflictDoNothing({ target: shipments.id });

          const importedInvoices = await tx
            .insert(invoices)
            .values({
              id: invoice.id,
              shipmentId: shipment.id,
              price: invoice.invoicedPrice,
              weight: invoice.invoicedWeight,
              createdAt: shipmentCreatedAt,
            })
            .onConflictDoUpdate({
              target: invoices.shipmentId,
              set: {
                id: invoice.id,
                price: invoice.invoicedPrice,
                weight: invoice.invoicedWeight,
                createdAt: shipmentCreatedAt,
                updatedAt: new Date(),
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
