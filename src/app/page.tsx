"use client";

import InvoiceCard, { InvoiceCardSkeleton } from "~/components/invoice-card";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "~/components/ui/combobox";
import type { Company } from "~/modules/hooks/use-home";
import { useHome } from "~/modules/hooks/use-home";
import InvoiceUploadDialog from "~/modules/incoice-upload-dialog";

export default function Home() {
  const {
    companiesData,
    handleCompanyFilter,
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
    <main className="flex flex-col gap-5 min-h-screen items-center p-5 pt-10">
      <div className="flex w-full max-w-300 flex-col gap-3">
        <div className="flex justify-between max-w-300 w-full">
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
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList onScroll={handleCompanyListScroll}>
                {(item: Company) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <InvoiceUploadDialog />
        </div>

        <div className="grid w-full sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shipmentsQuery.isError ? null : isInitialLoading ? (
            Array.from({ length: 30 }).map((_, index) => (
              <InvoiceCardSkeleton key={index} />
            ))
          ) : (
            shipmentsData.map((data) => {
              if (!data.invoices) {
                return null
              }
              return <InvoiceCard
                key={data.id}
                companyName={data.company.name}
                provider={data.provider}
                trackingNumber={data.trackingNumber}
                shipmentMode={data.mode}
                originCountry={data.originCountry}
                destinationCountry={data.destinationCountry}
                invoicedPrice={data.invoices.price}
                invoicedWeight={data.invoices.weight}
                shipmentCreatedAt={data.createdAt}
              />
            })
          )}
        </div>
        <div ref={loadMoreRef} className="h-8 self-center text-sm text-muted-foreground">
          {nextCursor && shipmentsQuery.isFetching ? "Loading..." : null}
        </div>
      </div>

    </main>
  );
}
