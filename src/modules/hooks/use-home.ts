"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type ShipmentsListData = RouterOutputs["shipment"]["list"];
type ShipmentCursor = NonNullable<ShipmentsListData["nextCursor"]>;
type CompaniesFindData = RouterOutputs["company"]["find"];
export type Company = CompaniesFindData["data"][number];
type CompanyCursor = NonNullable<CompaniesFindData["nextCursor"]>;

export function useHome() {
  const [cursor, setCursor] = useState<ShipmentCursor>();
  const [shipmentPages, setShipmentPages] = useState<ShipmentsListData[]>([]);
  const [companyId, setCompanyId] = useState<string | undefined>();
  const [companySearch, setCompanySearch] = useState("");
  const [companyCursor, setCompanyCursor] = useState<CompanyCursor>();
  const [companyPages, setCompanyPages] = useState<CompaniesFindData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const utils = api.useUtils();

  const companiesQuery = api.company.find.useQuery({
    filter: {
      search: companySearch || undefined,
    },
    paginate: {
      pageSize: 30,
      cursor: companyCursor,
    },
  });

  const shipmentsQuery = api.shipment.list.useQuery({
    filter: {
      companyId,
    },
    paginate: {
      pageSize: 30,
      cursor,
    },
  });

  function handleCompanyFilter(company: Company | null) {
    setSelectedCompany(company);
    setCompanyId(company?.id);
    setCursor(undefined);
    setShipmentPages([]);
  }

  function handleCompanySearch(value: string) {
    if (value === companySearch) {
      return;
    }

    setCompanySearch(value);
    setCompanyCursor(undefined);
    setCompanyPages([]);
  }

  function handleCompanyListScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 80;
    const nextCompanyCursor = companyPages.at(-1)?.nextCursor;

    if (isNearBottom && nextCompanyCursor && !companiesQuery.isFetching) {
      setCompanyCursor(nextCompanyCursor);
    }
  }

  async function handleInvoiceImportSuccess() {
    setCursor(undefined);
    setShipmentPages([]);
    setCompanyCursor(undefined);
    setCompanyPages([]);

    await Promise.all([
      utils.shipment.list.invalidate(),
      utils.company.find.invalidate(),
    ]);
  }

  useEffect(() => {
    if (!shipmentsQuery.isLoading && shipmentsQuery.data) {
      setShipmentPages((pages) =>
        cursor ? [...pages, shipmentsQuery.data] : [shipmentsQuery.data],
      );
    }
  }, [cursor, shipmentsQuery.data, shipmentsQuery.isLoading]);

  useEffect(() => {
    if (!companiesQuery.isLoading && companiesQuery.data) {
      setCompanyPages((pages) =>
        companyCursor ? [...pages, companiesQuery.data] : [companiesQuery.data],
      );
    }
  }, [companyCursor, companiesQuery.data, companiesQuery.isLoading]);

  const shipmentsData = shipmentPages.flatMap((page) => page.data);
  const companiesData = companyPages.flatMap((page) => page.data);
  const nextCursor = shipmentPages.at(-1)?.nextCursor;
  const isInitialLoading =
    shipmentsQuery.isLoading && shipmentsData.length === 0;

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !shipmentsQuery.isFetching) {
          setCursor(nextCursor);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [nextCursor, shipmentsQuery.isFetching]);

  return {
    companiesData,
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
  };
}
