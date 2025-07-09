"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface HeaderProps {
  title?: string
  description?: string
  showRefresh?: boolean
  onRefresh?: () => void
}

export function Header({ title, description, showRefresh, onRefresh }: HeaderProps) {
  // If there's no title and no refresh button, don't render the header at all
  if (!title && !showRefresh) {
    return null;
  }
  
  return (
    <header className={`sticky top-0 z-40 w-full ${title ? 'border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60' : 'bg-transparent'}`}>
      <div className="flex h-16 items-center px-6">
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
