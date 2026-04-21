"use client";

import {
  IconActivity,
  IconBookOpen,
  IconBuilding,
  IconCalendar,
  IconCode,
  IconDashboard,
  IconLayers,
  IconPackage,
  IconPhone,
  IconSettings,
  IconShield,
  IconTruck,
  IconUsers,
} from "@/components/icons";

const ICON_CLS = "w-full h-full";

const WORKBENCH_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: IconDashboard,
  phone: IconPhone,
  activity: IconActivity,
  users: IconUsers,
  shield: IconShield,
  layers: IconLayers,
  settings: IconSettings,
  Building: IconBuilding,
  Code: IconCode,
  Package: IconPackage,
  Calendar: IconCalendar,
  BookOpen: IconBookOpen,
  Truck: IconTruck,
};

export function resolveWorkbenchIcon(name: string): React.ReactNode {
  const Icon = WORKBENCH_ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={ICON_CLS} />;
}
