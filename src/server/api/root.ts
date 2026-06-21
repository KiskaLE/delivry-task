import { shipmentRouter } from "~/server/api/routers/shipment";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { invoiceProvider } from "./routers/invoice";
import { companies } from "../db/schema";
import { companyRouter } from "./routers/company";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  shipment: shipmentRouter,
  invoice: invoiceProvider,
  company: companyRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
