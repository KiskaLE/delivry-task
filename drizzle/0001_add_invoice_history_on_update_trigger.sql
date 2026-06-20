-- Custom SQL migration file, put your code below! --
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION create_invoice_history_on_update()
RETURNS trigger AS $$
BEGIN
  INSERT INTO "delivry-task_invoices_history" (
    "invoiceId",
    "shipmentId",
    "weight",
    "price",
    "createdAt",
    "updatedAt"
  ) VALUES (
    OLD."id",
    OLD."shipmentId",
    OLD."weight",
    OLD."price",
    OLD."createdAt",
    OLD."updatedAt"
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_history_on_update_trigger
AFTER UPDATE ON "delivry-task_invoices"
FOR EACH ROW
EXECUTE FUNCTION create_invoice_history_on_update();
