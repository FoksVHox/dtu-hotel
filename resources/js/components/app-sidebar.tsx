import { Link } from '@inertiajs/react';
import {
    BedDouble,
    BookOpen,
    CalendarDays,
    Folder,
    LayoutGrid,
    PhoneCall,
    Settings,
    Wrench,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';
import bookings from '@/routes/bookings';
import maintenance from '@/routes/maintenance';
import profile from '@/routes/profile';
import rooms from '@/routes/rooms';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Bookings',
        href: bookings.index(),
        icon: CalendarDays,
    },
    {
        title: 'Rooms',
        href: rooms.index(),
        icon: BedDouble,
    },
    {
        title: 'Maintenance',
        href: maintenance.index(),
        icon: Wrench,
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Contact IT Dept.',
        href: 'https://www.dtu.dk/english/about/organization/supportfunctions/it_service',
        icon: PhoneCall,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
