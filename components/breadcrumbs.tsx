"use client";

import LucideIcon from "@/components/lucide-icon";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocalStorageState } from "@/providers/localStore";
import { BreadcrumbSchemaI } from "@/utils/types";
import { Star } from "lucide-react";
import Link from "next/link";
import React, { Fragment } from "react";

export const BreadcrumbFallback: React.FC = () => {
  return <Skeleton className="h-8 w-40" />;
};

const ContainerBreadcrumb: React.FC<{
  breadcrumb: BreadcrumbSchemaI;
  toggle?: React.ReactNode;
}> = ({ breadcrumb, toggle }) => {
  const { state, addItem, removeItem } = useLocalStorageState("bevor:starred");

  const isFavorite = state?.find((item) => item.id === breadcrumb.favorite?.id);

  const toggleFavorite = React.useCallback(() => {
    if (!breadcrumb.favorite) return;
    if (isFavorite) {
      removeItem(breadcrumb.favorite.id);
    } else {
      addItem({
        id: breadcrumb.favorite.id,
        type: breadcrumb.favorite.type,
        teamId: breadcrumb.team_id,
        label: breadcrumb.favorite.display_name,
        url: breadcrumb.favorite.route,
      });
    }
  }, [isFavorite, removeItem, addItem, breadcrumb]);

  return (
    <div className="flex flex-row gap-2 items-center h-8">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.items.map((item) => (
            <Fragment key={item.route}>
              <BreadcrumbLink asChild>
                <Link href={item.route} className="flex flex-row gap-2 items-center max-w-40">
                  <LucideIcon assetType={item.type} className="size-4 shrink-0" />
                  <span className="truncate">{item.display_name}</span>
                </Link>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage className="flex flex-row gap-2 items-center max-w-40">
              <LucideIcon assetType={breadcrumb.page.type} className="size-4 shrink-0" />
              <span className="truncate">{breadcrumb.page.display_name}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {breadcrumb.favorite && (
        <Button variant="ghost" onClick={toggleFavorite} className="group" size="sm">
          <Star
            className={cn(
              "size-4 transition-colors",
              isFavorite
                ? "fill-yellow-500 text-yellow-500 group-hover:fill-muted-foreground group-hover:text-muted-foreground"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        </Button>
      )}
      {toggle && toggle}
      <div className="flex flex-row gap-2 items-center">
        {breadcrumb.navs.map((item) => (
          <Link href={item.route} key={item.route}>
            <Badge variant="outline" size="sm">
              {item.display_name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContainerBreadcrumb;
