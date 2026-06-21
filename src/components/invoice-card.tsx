"use client";

import { cn } from "~/lib/utils";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import Image from "next/image";
import type { ShipmentModes, ShipmentProviders } from "~/types/shipment";
import { Skeleton } from "./ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon } from "@hugeicons/core-free-icons";

type InvoiceCardData = {
  provider: ShipmentProviders;
  invoicedWeight: number;
  invoicedPrice: number;
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
}: InvoiceCardData) {
  const isExport = shipmentMode === "EXPORT";

  return (
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
            <div className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
              TRK {trackingNumber}
            </div>
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase",
            isExport
              ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
              : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
          )}
        >
          {shipmentMode}
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
                isExport ? "text-sky-700" : "text-emerald-700",
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
