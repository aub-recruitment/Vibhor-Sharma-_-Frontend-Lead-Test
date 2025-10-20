import { createFileRoute } from "@tanstack/react-router";
import { PackageDetailsPage } from "@/components/pages/packages/PackageDetailsPage";

export type PackageSearch = {
  type: "npm" | "gh";
};

export const Route = createFileRoute("/packages/$packageName")({
  component: PackageDetailsPage,
  validateSearch: (search: Record<string, unknown>): PackageSearch => {
    return {
      type: search.type as PackageSearch["type"]
    };
  }
});
