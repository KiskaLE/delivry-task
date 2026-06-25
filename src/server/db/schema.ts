// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { pgTableCreator } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `delivry-task_${name}`);

export const shipmentProviderEnumValues = ["GLS", "DPD", "UPS", "PPL", "FedEx"] as const;
export const shipmentModeEnumValues = ["IMPORT", "EXPORT"] as const;

export function timestamps() {
  return {
    createdAt: timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  };
}

export function invoiceSchema(options?: { uniqueShipmentId?: boolean }) {
  const shipmentId = text()
    .notNull()
    .references(() => shipments.id);

  return {
    shipmentId: options?.uniqueShipmentId
      ? shipmentId.unique()
      : shipmentId,

    weight: numeric("weight", { mode: "number" }).notNull(),
    price: numeric("price", { mode: "number" }).notNull(),
  };
}

export const invoices = createTable(
  "invoices",
  (d) => ({
    id: d.text().notNull().primaryKey(),
    ...invoiceSchema({ uniqueShipmentId: true }),
    ...timestamps()
  }),
  (table) => [
    index("invoice_shipment_id_idx").on(table.shipmentId),
    index("invoice_created_at_idx").on(table.createdAt),
  ],
);

export const invoicesHistory = createTable(
  "invoices_history",
  (d) => ({
    id: d.serial().primaryKey(),
    invoiceId: d.text().notNull(),
    ...invoiceSchema(),
    ...timestamps()
  }),
  (table) => [
    index("invoice_history_shipment_id_idx").on(table.shipmentId),
    index("invoice_history_created_at_idx").on(table.createdAt),
  ],
);

export const shipments = createTable(
  "shipments",
  (d) => ({
    id: d.text().notNull().primaryKey(),
    companyId: d
      .text()
      .notNull()
      .references(() => companies.id),
    trackingNumber: d.text().unique().notNull(),
    shipmentCreatedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    mode: d.text({ enum: shipmentModeEnumValues }).notNull(),
    provider: d
      .text({
        enum: shipmentProviderEnumValues,
      })
      .notNull(),
    originCountry: d.text().notNull(), // ISO code of the origin country
    destinationCountry: d.text().notNull(), // ISO code of the destination country
    ...timestamps()
  }),
  (table) => [
    index("shipment_company_id_idx").on(table.companyId),
    index("shipment_created_at_idx").on(table.createdAt),
    index("shipment_created_at_id_idx").on(table.createdAt, table.id)
  ],
);

export const companies = createTable(
  "companies",
  (d) => ({
    id: d.text().notNull().primaryKey(),
    name: d.text().notNull(),
    ...timestamps()
  }),
  (table) => [index("company_created_at_idx").on(table.createdAt)],
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  shipment: one(shipments, {
    fields: [invoices.shipmentId],
    references: [shipments.id],
  }),
}));

export const invoicesHistoryRelations = relations(
  invoicesHistory,
  ({ one }) => ({
    shipment: one(shipments, {
      fields: [invoicesHistory.shipmentId],
      references: [shipments.id],
    }),
  }),
);

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  company: one(companies, {
    fields: [shipments.companyId],
    references: [companies.id],
  }),
  invoices: one(invoices),
  invoices_history: many(invoicesHistory),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  shipments: many(shipments),
}));
