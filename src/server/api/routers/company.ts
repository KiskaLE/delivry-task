import { and, asc, eq, gt, ilike, or } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { companies } from "~/server/db/schema";

export const companyRouter = createTRPCRouter({
    find: publicProcedure.input(z.object({
        filter: z.object({
            search: z.string().optional()
        }).optional(),
        paginate: z.object({
            cursor: z.object({
                name: z.string(),
                id: z.string(),
            }).optional(),
            pageSize: z.number().min(1).max(100).default(30),
        }).optional(),
    })).query(async ({ input, ctx }) => {
        const search = input.filter?.search?.trim();
        const pageSize = input.paginate?.pageSize ?? 30;
        const cursor = input.paginate?.cursor;

        const rows = await ctx.db.select({
            id: companies.id,
            name: companies.name
        })
            .from(companies)
            .where(and(
                search ? ilike(companies.name, `%${search}%`) : undefined,
                cursor
                    ? or(
                        gt(companies.name, cursor.name),
                        and(
                            eq(companies.name, cursor.name),
                            gt(companies.id, cursor.id),
                        ),
                    )
                    : undefined,
            ))
            .orderBy(asc(companies.name), asc(companies.id))
            .limit(pageSize + 1);

        const hasNextPage = rows.length > pageSize;
        const data = rows.slice(0, pageSize);
        const lastItem = data.at(-1);

        return {
            data,
            nextCursor:
                hasNextPage && lastItem
                    ? {
                        name: lastItem.name,
                        id: lastItem.id,
                    }
                    : null,
            hasNextPage,
        };
    })
});
