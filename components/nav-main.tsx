"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

function isPathActive(pathname: string, url: string) {
  return url === "/"
    ? pathname === url
    : pathname === url || pathname.startsWith(`${url}/`)
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setOpenItems((currentOpenItems) => {
      let hasChanges = false
      const nextOpenItems = { ...currentOpenItems }

      for (const item of items) {
        if (!item.items?.length) {
          continue
        }

        const shouldBeOpen = Boolean(
          item.isActive ||
            item.items.some((subItem) => isPathActive(pathname, subItem.url))
        )

        if (!(item.title in nextOpenItems)) {
          nextOpenItems[item.title] = shouldBeOpen
          hasChanges = true
          continue
        }

        if (shouldBeOpen && !nextOpenItems[item.title]) {
          nextOpenItems[item.title] = true
          hasChanges = true
        }
      }

      return hasChanges ? nextOpenItems : currentOpenItems
    })
  }, [items, pathname])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isDirectLinkActive = isPathActive(pathname, item.url)
          const hasActiveSubItem = item.items?.some((subItem) =>
            isPathActive(pathname, subItem.url)
          )

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  data-active={isDirectLinkActive}
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              open={openItems[item.title] ?? Boolean(item.isActive || hasActiveSubItem)}
              onOpenChange={(open) =>
                setOpenItems((currentOpenItems) => ({
                  ...currentOpenItems,
                  [item.title]: open,
                }))
              }
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const isActive = isPathActive(pathname, subItem.url)

                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          data-active={isActive}
                          render={<Link href={subItem.url} />}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
