import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const Route = createRootRoute({
  component: () => (
    <SidebarProvider>
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 bg-layout-background">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
});
