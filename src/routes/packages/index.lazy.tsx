import { createLazyFileRoute } from "@tanstack/react-router";
import { PackagesListPage } from "@/components/pages/packages/PackagesListPage";

export const Route = createLazyFileRoute("/packages/")({
  component: PackagesListPage
});
