import type z from "zod";
import type { shipmentModeSchema, shipmentProvidersSchema } from "~/schema/shipment";

export type ShipmentProviders = z.infer<typeof shipmentProvidersSchema>;

export type ShipmentModes = z.infer<typeof shipmentModeSchema>;