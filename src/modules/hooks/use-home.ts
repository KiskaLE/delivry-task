"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type ShipmentsListData = RouterOutputs["shipment"]["list"];
type CompaniesFindData = RouterOutputs["company"]["find"];
export type Company = CompaniesFindData["data"][number];

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function useHome() {
  const [companyId, setCompanyId] = useState<string | undefined>();
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const utils = api.useUtils();

  const companiesQuery = api.company.find.useInfiniteQuery(
    {
      filter: {
        search: companySearch || undefined,
      },
      limit: 30,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const shipmentsQuery = api.shipment.list.useInfiniteQuery(
    {
      filter: {
        companyId,
      },
      limit: 30,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  function handleCompanyFilter(company: Company | null) {
    setSelectedCompany(company);
    setCompanyId(company?.id);
  }

  function handleCompanySearch(value: string) {
    if (value === companySearch) {
      return;
    }

    setCompanySearch(value);
  }

  function handleCompanyListScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 80;

    if (
      isNearBottom &&
      companiesQuery.hasNextPage &&
      !companiesQuery.isFetchingNextPage
    ) {
      void companiesQuery.fetchNextPage();
    }
  }

  async function handleInvoiceImportSuccess() {
    await Promise.all([
      utils.shipment.list.invalidate(),
      utils.company.find.invalidate(),
    ]);
  }

  const shipmentsData = uniqueById(
    shipmentsQuery.data?.pages.flatMap(
      (page: ShipmentsListData) => page.data,
    ) ?? [],
  );
  const companiesData = uniqueById(
    companiesQuery.data?.pages.flatMap(
      (page: CompaniesFindData) => page.data,
    ) ?? [],
  );
  const nextCursor = shipmentsQuery.data?.pages.at(-1)?.nextCursor ?? null;
  const isInitialLoading =
    shipmentsQuery.isLoading && shipmentsData.length === 0;
  const {
    fetchNextPage: fetchNextShipmentPage,
    hasNextPage: hasNextShipmentPage,
    isFetchingNextPage: isFetchingNextShipmentPage,
  } = shipmentsQuery;

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !nextCursor) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          hasNextShipmentPage &&
          !isFetchingNextShipmentPage
        ) {
          void fetchNextShipmentPage();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [
    fetchNextShipmentPage,
    hasNextShipmentPage,
    isFetchingNextShipmentPage,
    nextCursor,
  ]);

  return {
    companiesData,
    isFetching: companiesQuery.isFetching,
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
