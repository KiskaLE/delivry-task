CREATE TABLE "delivry-task_companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "delivry-task_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"shipmentId" text NOT NULL,
	"weight" numeric NOT NULL,
	"price" numeric NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "delivry-task_invoices_shipmentId_unique" UNIQUE("shipmentId")
);
--> statement-breakpoint
CREATE TABLE "delivry-task_invoices_history" (
	"id" text PRIMARY KEY NOT NULL,
	"shipmentId" text NOT NULL,
	"weight" numeric NOT NULL,
	"price" numeric NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "delivry-task_shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"companyId" text NOT NULL,
	"trackingNumber" text NOT NULL,
	"shipmentCreatedAt" timestamp with time zone NOT NULL,
	"mode" text NOT NULL,
	"provider" text NOT NULL,
	"originCountry" text NOT NULL,
	"destinationCountry" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "delivry-task_shipments_trackingNumber_unique" UNIQUE("trackingNumber")
);
--> statement-breakpoint
ALTER TABLE "delivry-task_invoices" ADD CONSTRAINT "delivry-task_invoices_shipmentId_delivry-task_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."delivry-task_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivry-task_invoices_history" ADD CONSTRAINT "delivry-task_invoices_history_shipmentId_delivry-task_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."delivry-task_shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivry-task_shipments" ADD CONSTRAINT "delivry-task_shipments_companyId_delivry-task_companies_id_fk" FOREIGN KEY ("companyId") REFERENCES "public"."delivry-task_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "company_created_at_idx" ON "delivry-task_companies" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "invoice_shipment_id_idx" ON "delivry-task_invoices" USING btree ("shipmentId");--> statement-breakpoint
CREATE INDEX "invoice_created_at_idx" ON "delivry-task_invoices" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "invoice_history_shipment_id_idx" ON "delivry-task_invoices_history" USING btree ("shipmentId");--> statement-breakpoint
CREATE INDEX "invoice_history_created_at_idx" ON "delivry-task_invoices_history" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "shipment_company_id_idx" ON "delivry-task_shipments" USING btree ("companyId");--> statement-breakpoint
CREATE INDEX "shipment_created_at_idx" ON "delivry-task_shipments" USING btree ("createdAt");