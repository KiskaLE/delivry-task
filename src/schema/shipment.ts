import z from "zod"
import { shipmentModeEnumValues, shipmentProviderEnumValues } from "~/server/db/schema"

export const shipmentProvidersSchema = z.enum(shipmentProviderEnumValues)
export const shipmentModeSchema = z.enum(shipmentModeEnumValues)