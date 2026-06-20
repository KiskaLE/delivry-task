"use client";

import { cn } from "~/lib/utils";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import Image from "next/image";

type InvoiceCardData = {
    id: string
    shipment: {
        id: string
        createdAt: string
        trackingNumber: string
        company: {
            id: string
            name: string
        },
        provider: string
        mode: string
        originCountry: string
        destinationCountry: string
    },
    invoicedWeight: number
    invoicedPrice: number
}

function getDeliveryProviderLogo(provider: string): React.ReactNode | null {
    const imageWidth = 120;
    const imageHeight = 100
    switch (provider) {
        case "DPD":
            return <Image width={imageWidth} height={imageHeight} src={"/assets/dpd.svg"} alt="DPD logo" />

        case "GLS":
            return <Image width={imageWidth} height={imageHeight} src={"/assets/gls.svg"} alt="GLS logo" />

        case "FEDEX":
            return <Image width={imageWidth} height={imageHeight} src={"/assets/fedex.svg"} alt="Fedex logo" />

        case "PPL":
            return <Image width={imageWidth} height={imageHeight} src={"/assets/ppl.svg"} alt="PPL logo" />

        case "UPS":
            return <Image width={imageWidth} height={imageHeight} src={"/assets/ups.svg"} alt="UPS logo" />
    }

    return null
}

export default function InvoiceCard({ id, shipment, invoicedPrice, invoicedWeight }: InvoiceCardData) {
    return (
        <Card className="flex-row gap-5 p-4">
            <div className="flex justify-center">
                {getDeliveryProviderLogo(shipment.provider)}
            </div>
            <div className="flex flex-col gap-1 min-w-60">
                <div className="flex flex-col">
                    <div className="text-base -mb-1"><b>TRK#</b> {shipment.trackingNumber}</div>
                    <div className="text-xm text-stone-600">{shipment.company.name}</div>
                </div>
                <Separator />
                <div className="flex justify-between ">
                    <span className="font-bold text-yellow-500 text-sm">{`${invoicedPrice} Kč`}</span>
                    <span>{new Date(shipment.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center h-fit">
                    <div><span>{`${shipment.originCountry} -> ${shipment.destinationCountry}`}</span></div>
                    <div>
                        <div className={cn("py-0.5 px-2 rounded-4xl", shipment.mode === "EXPORT" ? "bg-purple-300" : "bg-amber-300")}>{shipment.mode}</div>
                    </div>
                </div>
            </div>
        </Card >
    )
}
