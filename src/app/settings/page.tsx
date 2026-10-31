import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  description: "Backup, restore, and manage your local Kiroshi Vault data.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
