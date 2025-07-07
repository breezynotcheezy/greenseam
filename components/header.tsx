"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface HeaderProps {
  title?: string
  description?: string
  showRefresh?: boolean
  onRefresh?: () => void
}

export function Header({ title, description, showRefresh, onRefresh }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-6">
        <SidebarTrigger className="mr-4 h-8 w-8 rounded-lg hover:bg-gray-100" />

        {title && (
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
        )}

        {showRefresh && onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="ml-auto bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    </header>
  )
}
