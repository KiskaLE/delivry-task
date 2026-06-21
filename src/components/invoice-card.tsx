"use client";

import { cn } from "~/lib/utils";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import Image from "next/image";
import type { ShipmentModes, ShipmentProviders } from "~/types/shipment";

type InvoiceCardData = {
    provider: ShipmentProviders
    invoicedWeight: number
    invoicedPrice: number
    trackingNumber: string
    companyName: string
    shipmentCreatedAt: Date
    originCountry: string
    destinationCountry: string
    shipmentMode: ShipmentModes

}

function getDeliveryProviderLogo(provider: ShipmentProviders): React.ReactNode | null {
    switch (provider) {
        case "DPD":
            return <Image width={100} height={100} src={"/assets/dpd.svg"} alt="DPD logo" />

        case "GLS":
            return <Image width={100} height={100} src={"/assets/gls.svg"} alt="GLS logo" />

        case "FedEx":
            return <Image width={100} height={100} src={"/assets/fedex.svg"} alt="Fedex logo" />

        case "PPL":
            return <Image width={100} height={100} src={"/assets/ppl.svg"} alt="PPL logo" />

        case "UPS":
            return <Image width={50} height={100} src={"/assets/ups.svg"} alt="UPS logo" />
    }

    return null
}

export default function InvoiceCard({ provider, trackingNumber, companyName, shipmentCreatedAt, originCountry, destinationCountry, shipmentMode, invoicedPrice }: InvoiceCardData) {
    return (
        <Card className="flex-row gap-5 p-4">
            <div className="flex justify-center md:min-w-30">
                {getDeliveryProviderLogo(provider)}
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex flex-col">
                    <div className="text-base -mb-1"><b>TRK#</b> {trackingNumber}</div>
                    <div className="text-xm text-stone-600">{companyName}</div>
                </div>
                <Separator />
                <div className="flex justify-between ">
                    <span className="font-bold text-yellow-500 text-sm">{`${invoicedPrice} Kč`}</span>
                    <span>{shipmentCreatedAt.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center h-fit">
                    <div><span>{`${originCountry} -> ${destinationCountry}`}</span></div>
                    <div>
                        <div className={cn("py-0.5 px-2 rounded-4xl", shipmentMode === "EXPORT" ? "bg-purple-300" : "bg-amber-300")}>{shipmentMode}</div>
                    </div>
                </div>
            </div>
        </Card >
    )
}
