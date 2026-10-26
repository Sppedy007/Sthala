import type { Metadata } from "next"
import { Workspace } from "@/components/workspace"

export const metadata: Metadata = {
  title: "Workspace — Sthala",
  description: "Configure a shelter and compare Budget, Balanced and High Insulation designs.",
}

export default function WorkspacePage() {
  return <Workspace />
}
