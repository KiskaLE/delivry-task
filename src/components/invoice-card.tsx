"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import Image from "next/image";
import type { ShipmentModes, ShipmentProviders } from "~/types/shipment";
import { Skeleton } from "./ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarClockIcon,
  Copy01Icon,
  PackageIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

type InvoiceHistoryData = {
  id: number;
  invoiceId: string;
  weight: number;
  price: number;
  createdAt: Date;
  updatedAt: Date | null;
};

type InvoiceCardData = {
  provider: ShipmentProviders;
  invoicedWeight: number;
  invoicedPrice: number;
  invoiceHistory: InvoiceHistoryData[];
  trackingNumber: string;
  companyName: string;
  shipmentCreatedAt: Date;
  originCountry: string;
  destinationCountry: string;
  shipmentMode: ShipmentModes;
};

function getDeliveryProviderLogo(
  provider: ShipmentProviders,
): React.ReactNode | null {
  switch (provider) {
    case "DPD":
      return (
        <Image
          width={80}
          height={52}
          src={"/assets/dpd.svg"}
          alt="DPD logo"
          className="max-h-10 w-auto object-contain"
        />
      );

    case "GLS":
      return (
        <Image
          width={80}
          height={52}
          src={"/assets/gls.svg"}
          alt="GLS logo"
          className="max-h-10 w-auto object-contain"
        />
      );

    case "FedEx":
      return (
        <Image
          width={80}
          height={52}
          src={"/assets/fedex.svg"}
          alt="Fedex logo"
          className="max-h-10 w-auto object-contain"
        />
      );

    case "PPL":
      return (
        <Image
          width={92}
          height={52}
          src={"/assets/ppl.svg"}
          alt="PPL logo"
          className="max-h-10 w-auto object-contain"
        />
      );

    case "UPS":
      return (
        <Image
          width={48}
          height={52}
          src={"/assets/ups.svg"}
          alt="UPS logo"
          className="max-h-10 w-auto object-contain"
        />
      );
  }

  return null;
}

export default function InvoiceCard({
  provider,
  trackingNumber,
  companyName,
  shipmentCreatedAt,
  originCountry,
  destinationCountry,
  shipmentMode,
  invoicedPrice,
  invoicedWeight,
  invoiceHistory,
}: InvoiceCardData) {
  const [isTrackingCopied, setIsTrackingCopied] = useState(false);
  const historyCount = invoiceHistory.length;

  async function handleCopyTrackingNumber() {
    await navigator.clipboard.writeText(trackingNumber);
    setIsTrackingCopied(true);
    window.setTimeout(() => setIsTrackingCopied(false), 1200);
  }

  return (
    <Sheet>
      <Card className="w-full gap-0 p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="bg-muted/30 flex items-start justify-between gap-3 border-b p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-background ring-border/70 flex h-13 w-18 shrink-0 items-center justify-center rounded-md p-2 ring-1">
              {getDeliveryProviderLogo(provider)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm leading-tight font-semibold">
                {companyName}
              </div>
              <button
                type="button"
                onClick={handleCopyTrackingNumber}
                className="group/copy text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:ring-ring/40 mt-0.5 flex max-w-full cursor-copy items-center gap-1.5 rounded-sm font-mono text-[11px] transition outline-none focus-visible:ring-2"
                aria-label={`Copy tracking number ${trackingNumber}`}
                title={
                  isTrackingCopied ? "Tracking copied" : "Copy tracking number"
                }
              >
                <span className="truncate">TRK {trackingNumber}</span>
                <span
                  className={cn(
                    "shrink-0 opacity-0 transition group-hover/copy:opacity-100 group-focus-visible/copy:opacity-100",
                    isTrackingCopied && "text-emerald-600 opacity-100",
                  )}
                >
                  <HugeiconsIcon
                    icon={isTrackingCopied ? Tick02Icon : Copy01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </span>
              </button>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
                shipmentMode === "EXPORT"
                  ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
                  : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
              )}
            >
              {shipmentMode}
            </div>
            {historyCount > 0 ? (
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground cursor-pointer hover:text-foreground relative"
                  aria-label={`Open invoice history, ${historyCount} records`}
                  title="Invoice history"
                >
                  <HugeiconsIcon
                    icon={CalendarClockIcon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  <span className="bg-muted text-muted-foreground ring-background absolute -right-1 -bottom-1 rounded-sm px-1 text-[9px] leading-3 ring-1">
                    {historyCount.toLocaleString("cs-CZ")}
                  </span>
                </Button>
              </SheetTrigger>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                Invoice
              </div>
              <div className="text-foreground text-lg font-semibold">{`${invoicedPrice.toLocaleString("cs-CZ")} Kč`}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                Created
              </div>
              <div className="font-medium">
                {shipmentCreatedAt.toLocaleDateString("cs-CZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="min-w-0 text-left">
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                From
              </div>
              <div className="truncate font-medium">{originCountry}</div>
            </div>
            <div className="relative flex w-24 items-center justify-center">
              <span className="border-muted-foreground/35 absolute inset-x-1 top-1/2 h-px -translate-y-1/2 border-t border-dashed" />
              <span
                className={cn(
                  "bg-background relative z-10 flex size-8 shrink-0 items-center justify-center",
                  shipmentMode === "EXPORT"
                    ? "text-sky-700"
                    : "text-emerald-700",
                )}
              >
                <HugeiconsIcon
                  icon={PackageIcon}
                  strokeWidth={2}
                  className="size-5"
                />
              </span>
            </div>
            <div className="min-w-0 text-right">
              <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                To
              </div>
              <div className="truncate font-medium">{destinationCountry}</div>
            </div>
          </div>

          <div className="bg-muted/40 flex items-center justify-between rounded-md px-3 py-2 text-xs">
            <span className="text-muted-foreground">Weight</span>
            <span className="font-medium">{`${invoicedWeight.toLocaleString("cs-CZ")} kg`}</span>
          </div>
        </div>
      </Card>

      {historyCount > 0 ? (
        <SheetContent className="w-full overflow-hidden sm:max-w-xl">
          <SheetHeader className="shrink-0 border-b pr-14">
            <SheetTitle>Invoice history</SheetTitle>
            <SheetDescription>
              {companyName} - TRK {trackingNumber}
            </SheetDescription>
          </SheetHeader>

          <div className="shrink-0 border-b px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 rounded-md p-3">
                <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  Current price
                </div>
                <div className="text-base font-semibold">
                  {`${invoicedPrice.toLocaleString("cs-CZ")} Kč`}
                </div>
              </div>
              <div className="bg-muted/40 rounded-md p-3">
                <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  Current weight
                </div>
                <div className="text-base font-semibold">
                  {`${invoicedWeight.toLocaleString("cs-CZ")} kg`}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-3">
              {invoiceHistory.map((history) => (
                <Card key={history.id} className="gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Changed
                      </div>
                      <div className="font-medium">
                        {history.createdAt.toLocaleDateString("cs-CZ", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-muted-foreground bg-muted max-w-36 truncate rounded-sm px-1.5 py-0.5 font-mono text-[10px]">
                      {history.invoiceId}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-md px-3 py-2">
                      <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Price
                      </div>
                      <div className="font-semibold">
                        {`${history.price.toLocaleString("cs-CZ")} Kč`}
                      </div>
                    </div>
                    <div className="bg-muted/40 rounded-md px-3 py-2">
                      <div className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                        Weight
                      </div>
                      <div className="font-semibold">
                        {`${history.weight.toLocaleString("cs-CZ")} kg`}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

export function InvoiceCardSkeleton() {
  return (
    <Card className="w-full gap-0 p-0">
      <div className="bg-muted/30 flex items-start justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-13 w-18 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <div className="relative flex w-24 items-center justify-center">
            <Skeleton className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2" />
            <Skeleton className="bg-background relative z-10 size-5 shrink-0" />
          </div>
          <Skeleton className="h-4 w-20 justify-self-end" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </Card>
  );
}
