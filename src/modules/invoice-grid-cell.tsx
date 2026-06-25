import type { InvoiceCardData } from "~/components/invoice-card";
import type { Shipment } from "./hooks/use-home";
import type { CSSProperties } from "react";
import InvoiceCard from "~/components/invoice-card";

type InvoiceGridCellProps = {
    columnCount: number;
    onInvoiceHistoryOpenAction: (invoice: InvoiceCardData) => void;
    shipmentRowCount: number;
    shipments: Shipment[];
};

export function InvoiceGridCell({
    ariaAttributes,
    columnCount,
    columnIndex,
    onInvoiceHistoryOpenAction,
    rowIndex,
    shipmentRowCount,
    shipments,
    style,
}: InvoiceGridCellProps & {
    ariaAttributes: {
        "aria-colindex": number;
        role: "gridcell";
    };
    columnIndex: number;
    rowIndex: number;
    style: CSSProperties;
}) {
    if (rowIndex >= shipmentRowCount) {
        if (columnIndex > 0) {
            return null;
        }

        return (
            <>
                <div
                    {...ariaAttributes}
                    style={{ ...style }}
                    className="text-muted-foreground box-border flex items-center justify-center w-full! text-sm"
                >
                    Loading...
                </div>
            </>
        );
    }

    const shipmentIndex = rowIndex * columnCount + columnIndex;
    const shipment = shipments[shipmentIndex];

    if (!shipment?.invoices) {
        return null;
    }

    return (
        <div
            {...ariaAttributes}
            style={style}
            className="box-border px-2.5 pt-1 pb-5"
        >
            <InvoiceCard
                companyName={shipment.company.name}
                provider={shipment.provider}
                trackingNumber={shipment.trackingNumber}
                shipmentMode={shipment.mode}
                originCountry={shipment.originCountry}
                destinationCountry={shipment.destinationCountry}
                invoicedPrice={shipment.invoices.price}
                invoicedWeight={shipment.invoices.weight}
                invoiceHistory={shipment.invoices_history}
                shipmentCreatedAt={shipment.createdAt}
                onInvoiceHistoryOpenAction={onInvoiceHistoryOpenAction}
            />
        </div>
    );
}
