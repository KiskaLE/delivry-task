ALTER TABLE "delivry-task_invoices_history" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "delivry-task_invoices_history" ADD COLUMN "invoiceId" text NOT NULL;--> statement-breakpoint
CREATE INDEX "shipment_created_at_id_idx" ON "delivry-task_shipments" USING btree ("createdAt","id");