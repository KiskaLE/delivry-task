"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";

import { api, type RouterOutputs } from "~/trpc/react";

const INVOICE_CARD_ROW_HEIGHT = 300;
const LOADING_ROW_HEIGHT = 44;
const GRID_GAP = 20;

type ShipmentsListData = RouterOutputs["shipment"]["list"];
type CompaniesFindData = RouterOutputs["company"]["find"];
export type Company = CompaniesFindData["data"][number];
export type Shipment = ShipmentsListData["data"][number];

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

function useInvoiceGridColumnCount() {
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    function updateColumnCount() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setColumnCount(3);
        return;
      }

      if (window.matchMedia("(min-width: 768px)").matches) {
        setColumnCount(2);
        return;
      }

      setColumnCount(1);
    }

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);

    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  return columnCount;
}

export function useHome() {
  const [companyId, setCompanyId] = useState<string | undefined>();
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const shipmentGridContainerRef = useRef<HTMLDivElement>(null);
  const hasShipmentGridScrolledRef = useRef(false);
  const [shipmentGridContainerWidth, setShipmentGridContainerWidth] =
    useState(0);
  const columnCount = useInvoiceGridColumnCount();
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
    hasShipmentGridScrolledRef.current = false;
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

  const shipmentsData = useMemo(
    () =>
      uniqueById(
        shipmentsQuery.data?.pages.flatMap(
          (page: ShipmentsListData) => page.data,
        ) ?? [],
      ),
    [shipmentsQuery.data?.pages],
  );
  const companiesData = useMemo(
    () =>
      uniqueById(
        companiesQuery.data?.pages.flatMap(
          (page: CompaniesFindData) => page.data,
        ) ?? [],
      ),
    [companiesQuery.data?.pages],
  );
  const nextCursor = shipmentsQuery.data?.pages.at(-1)?.nextCursor ?? null;
  const isInitialLoading =
    shipmentsQuery.isLoading && shipmentsData.length === 0;
  const shipmentRowCount = Math.ceil(shipmentsData.length / columnCount);
  const virtualShipmentRowCount =
    shipmentRowCount + (shipmentsQuery.isFetchingNextPage ? 1 : 0);
  const shipmentGridWidth =
    shipmentGridContainerWidth > 0 ? shipmentGridContainerWidth + GRID_GAP : 0;
  const shipmentColumnWidth =
    shipmentGridWidth > 0 ? shipmentGridWidth / columnCount : 0;
  const {
    fetchNextPage: fetchNextShipmentPage,
    hasNextPage: hasNextShipmentPage,
    isFetchingNextPage: isFetchingNextShipmentPage,
  } = shipmentsQuery;

  const handleShipmentCellsRendered = useCallback(
    ({
      rowStopIndex,
    }: {
      columnStartIndex: number;
      columnStopIndex: number;
      rowStartIndex: number;
      rowStopIndex: number;
    }) => {
      const lastRenderedItemIndex = (rowStopIndex + 1) * columnCount - 1;
      const isNearEnd =
        shipmentsData.length - lastRenderedItemIndex <= columnCount * 2;

      if (
        hasShipmentGridScrolledRef.current &&
        isNearEnd &&
        hasNextShipmentPage &&
        !isFetchingNextShipmentPage
      ) {
        void fetchNextShipmentPage();
      }
    },
    [
      columnCount,
      fetchNextShipmentPage,
      hasNextShipmentPage,
      isFetchingNextShipmentPage,
      shipmentsData.length,
    ],
  );

  const handleShipmentGridScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (event.currentTarget.scrollTop > 0) {
        hasShipmentGridScrolledRef.current = true;
      }
    },
    [],
  );

  const getVirtualShipmentRowHeight = useCallback(
    (index: number) =>
      index < shipmentRowCount ? INVOICE_CARD_ROW_HEIGHT : LOADING_ROW_HEIGHT,
    [shipmentRowCount],
  );

  useEffect(() => {
    const gridContainer = shipmentGridContainerRef.current;

    if (!gridContainer) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      setShipmentGridContainerWidth(entry.contentRect.width);
    });

    resizeObserver.observe(gridContainer);

    return () => resizeObserver.disconnect();
  }, []);

  return {
    companiesData,
    isFetching: companiesQuery.isFetching,
    handleCompanyFilter,
    handleInvoiceImportSuccess,
    handleCompanyListScroll,
    handleCompanySearch,
    isInitialLoading,
    nextCursor,
    selectedCompany,
    shipmentGrid: {
      columnWidth: shipmentColumnWidth,
      columnCount,
      containerRef: shipmentGridContainerRef,
      gap: GRID_GAP,
      getRowHeight: getVirtualShipmentRowHeight,
      key: `${selectedCompany?.id ?? "all"}-${columnCount}`,
      onCellsRendered: handleShipmentCellsRendered,
      onScroll: handleShipmentGridScroll,
      rowCount: virtualShipmentRowCount,
      shipmentRowCount,
      width: shipmentGridWidth,
    },
    shipmentsData,
    shipmentsQuery,
  };
}
