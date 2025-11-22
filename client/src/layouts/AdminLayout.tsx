import { type ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Usuarios',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Diagramas',
    url: '/admin/diagrams',
    icon: FileText,
  },
  {
    title: 'Finanzas',
    url: '/admin/finance',
    icon: DollarSign,
  },
  {
    title: 'Configuración',
    url: '/admin/settings',
    icon: Settings,
  },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo className="text-lg" />
          <span className="text-xs text-muted-foreground">Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/search" data-testid="link-back-to-search">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver a Búsqueda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium" data-testid="text-admin-username">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Panel de Administración</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
