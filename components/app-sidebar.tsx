"use client"

import { FileUp, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Import Data",
    url: "/import",
    icon: FileUp,
    color: "text-forest-600",
    bgColor: "bg-forest-50",
    description: "Upload GameChanger files",
  },
  {
    title: "Player Cards",
    url: "/players",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "View player analytics",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-xl text-gray-900">Greenseam AI</h2>
            <p className="text-sm text-gray-600">Baseball Analytics</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    className="h-16 rounded-xl hover:bg-gray-50 data-[active=true]:bg-forest-50 data-[active=true]:text-forest-700 data-[active=true]:border-forest-200 data-[active=true]:border"
                  >
                    <Link href={item.url} className="flex items-center gap-4 p-4">
                      <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="group-data-[collapsible=icon]:hidden">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
