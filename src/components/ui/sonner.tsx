"use client"

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Toasts follow design/system.md: white card, 16px radius, the type shown by a coloured icon
// (never colour alone: every toast has words), one pill action button.
// Usage: toast.success("Application rejected", { description, action: { label: "Open", onClick } })
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      gap={8}
      visibleToasts={4}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="text-success size-[18px]" />,
        info: <InfoIcon className="text-info size-[18px]" />,
        warning: <TriangleAlertIcon className="text-warning size-[18px]" />,
        error: <OctagonXIcon className="text-danger size-[18px]" />,
        loading: <Loader2Icon className="text-muted-foreground size-[18px] animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-card !text-foreground !border-border !rounded-2xl !shadow-[0_12px_32px_-12px_oklch(0.2_0.01_60/0.3)] !gap-3 !px-4 !py-3.5 !font-sans",
          title: "!text-[14px] !font-medium",
          description: "!text-[13px] !text-muted-foreground",
          actionButton: "!bg-foreground !text-background !rounded-full !h-7 !px-3 !text-[12px] !font-medium",
          cancelButton: "!bg-muted !text-foreground !rounded-full !h-7 !px-3 !text-[12px]",
          closeButton: "!bg-card !border-border",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
