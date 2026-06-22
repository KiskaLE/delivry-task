import { and, desc, eq, lt, or } from "drizzle-orm";
import z from "zod";
import { shipmentProvidersSchema } from "~/schema/shipment";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { invoicesHistory, shipments } from "~/server/db/schema";

export const shipmentRouter = createTRPCRouter({
  list: publicProcedure.input(z.object({
    filter: z.object({
      companyId: z.string().optional()
    }).optional(),
    paginate: z.object({
      cursor: z.object({
        createdAt: z.coerce.date(),
        id: z.string(),
      }).optional(),
      pageSize: z.number().min(1),
    })
  })).query(async ({ input, ctx }) => {
    const pageSize = input.paginate.pageSize;
    const cursor = input.paginate?.cursor;

    const rows = await ctx.db.query.shipments.findMany({
      with: {
        company: true,
        invoices: true,
        invoices_history: {
          orderBy: [desc(invoicesHistory.createdAt), desc(invoicesHistory.id)],
        },
      },

      where: and(
        input.filter?.companyId
          ? eq(shipments.companyId, input.filter.companyId)
          : undefined,

        cursor
          ? or(
            lt(shipments.createdAt, cursor.createdAt),
            and(
              eq(shipments.createdAt, cursor.createdAt),
              lt(shipments.id, cursor.id),
            ),
          )
          : undefined,
      ),

      orderBy: [desc(shipments.createdAt), desc(shipments.id)],

      // We take 1 more so we can detect next page
      limit: pageSize + 1,
    });

    const hasNextPage = rows.length > pageSize;
    const data = rows.slice(0, pageSize);

    const lastItem = data.at(-1);

    const nextCursor =
      hasNextPage && lastItem
        ? {
          createdAt: lastItem.createdAt,
          id: lastItem.id,
        }
        : null;

    return {
      data,
      nextCursor,
      hasNextPage,
    }
  })
});
