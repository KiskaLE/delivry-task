"use client";

import { PackageIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import InvoiceCard, {
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
    loadMoreRef,
    nextCursor,
    selectedCompany,
    shipmentsData,
    shipmentsQuery,
  } = useHome();

  return (
    <main className="flex min-h-screen flex-col items-center gap-5 p-5 pt-10">
      <div className="flex w-full max-w-300 flex-col gap-3">
        <div className="flex w-full max-w-300 justify-between">
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
                {isFetching && companiesData.length === 0 ? "Loading..." : "No items found."}
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

        <div className="grid w-full gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {shipmentsQuery.isError ? null : isInitialLoading ? (
            Array.from({ length: 30 }).map((_, index) => (
              <InvoiceCardSkeleton key={index} />
            ))
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
            shipmentsData.map((data) => {
              if (!data.invoices) {
                return null;
              }
              return (
                <InvoiceCard
                  key={data.id}
                  companyName={data.company.name}
                  provider={data.provider}
                  trackingNumber={data.trackingNumber}
                  shipmentMode={data.mode}
                  originCountry={data.originCountry}
                  destinationCountry={data.destinationCountry}
                  invoicedPrice={data.invoices.price}
                  invoicedWeight={data.invoices.weight}
                  invoiceHistory={data.invoices_history}
                  shipmentCreatedAt={data.createdAt}
                  onInvoiceHistoryOpenAction={setSelectedInvoiceHistory}
                />
              );
            })
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
        <div
          ref={loadMoreRef}
          className="text-muted-foreground h-8 self-center text-sm"
        >
          {nextCursor && shipmentsQuery.isFetching ? "Loading..." : null}
        </div>
      </div>
    </main>
  );
}
