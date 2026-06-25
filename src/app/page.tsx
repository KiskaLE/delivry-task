"use client";

import { PackageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";
import { Grid } from "react-window";

import {
  InvoiceCardSkeleton,
  InvoiceHistorySheetContent,
  type InvoiceCardData,
} from "~/components/invoice-card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";
import { Sheet } from "~/components/ui/sheet";
import type { Company } from "~/modules/hooks/use-home";
import { useHome } from "~/modules/hooks/use-home";
import { InvoiceGridCell } from "~/modules/invoice-grid-cell";
import InvoiceUploadDialog from "~/modules/invoice-upload-dialog";

export default function Home() {
  const [selectedInvoiceHistory, setSelectedInvoiceHistory] =
    useState<InvoiceCardData | null>(null);
  const {
    companiesData,
    isFetching,
    handleCompanyFilter,
    handleInvoiceImportSuccess,
    handleCompanyListScroll,
    handleCompanySearch,
    isInitialLoading,
    selectedCompany,
    shipmentGrid,
    shipmentsData,
    shipmentsQuery,
  } = useHome();
  const rowProps = useMemo(
    () => ({
      columnCount: shipmentGrid.columnCount,
      onInvoiceHistoryOpenAction: setSelectedInvoiceHistory,
      shipmentRowCount: shipmentGrid.shipmentRowCount,
      shipments: shipmentsData,
    }),
    [shipmentGrid.columnCount, shipmentGrid.shipmentRowCount, shipmentsData],
  );
  return (
    <main className="flex h-screen flex-col items-center overflow-hidden p-5 pt-10">
      <div className="flex min-h-0 w-full max-w-300 flex-1 flex-col gap-3">
        <div className="flex w-full max-w-300 shrink-0 justify-between">
          <Combobox
            items={companiesData}
            value={selectedCompany}
            itemToStringLabel={(company) => company.name}
            itemToStringValue={(company) => company.id}
            isItemEqualToValue={(item, value) => item.id === value.id}
            onInputValueChange={handleCompanySearch}
            onValueChange={handleCompanyFilter}
          >
            <ComboboxInput placeholder="Select company" showClear />
            <ComboboxContent>
              <ComboboxEmpty>
                {isFetching && companiesData.length === 0
                  ? "Loading..."
                  : "No items found."}
              </ComboboxEmpty>
              <ComboboxList onScroll={handleCompanyListScroll}>
                {(item: Company) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <InvoiceUploadDialog
            onImportSuccessAction={handleInvoiceImportSuccess}
          />
        </div>

        <div
          ref={shipmentGrid.containerRef}
          className="min-h-0 w-full flex-1 px-0.5"
        >
          {shipmentsQuery.isError ? null : isInitialLoading ? (
            <div className="grid w-full gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 30 }).map((_, index) => (
                <InvoiceCardSkeleton key={index} />
              ))}
            </div>
          ) : shipmentsData.length === 0 ? (
            <div className="border-border/70 bg-card col-span-full flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
              <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-md">
                <HugeiconsIcon
                  icon={PackageIcon}
                  strokeWidth={2}
                  className="size-6"
                />
              </div>
              <h2 className="mt-4 text-base font-semibold">
                No shipments found
              </h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                {selectedCompany
                  ? "This company does not have any imported shipments yet."
                  : "Upload invoice JSON files to create shipments and review their invoice details here."}
              </p>
              <div className="mt-5">
                <InvoiceUploadDialog
                  onImportSuccessAction={handleInvoiceImportSuccess}
                />
              </div>
            </div>
          ) : (
            <Grid
              key={shipmentGrid.key}
              className="-mx-2.5"
              cellComponent={InvoiceGridCell}
              cellProps={rowProps}
              columnCount={shipmentGrid.columnCount}
              columnWidth={shipmentGrid.columnWidth}
              defaultHeight={720}
              defaultWidth={shipmentGrid.width}
              onCellsRendered={shipmentGrid.onCellsRendered}
              overscanCount={3}
              rowCount={shipmentGrid.rowCount}
              rowHeight={shipmentGrid.getRowHeight}
              style={{
                height: "100%",
                maxWidth: shipmentGrid.width,
                width: shipmentGrid.width,
              }}
            />
          )}
        </div>
        <Sheet
          open={selectedInvoiceHistory !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedInvoiceHistory(null);
            }
          }}
        >
          {selectedInvoiceHistory ? (
            <InvoiceHistorySheetContent {...selectedInvoiceHistory} />
          ) : null}
        </Sheet>
      </div>
    </main>
  );
}
