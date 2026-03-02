import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import maintenance from '@/routes/maintenance';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Room Status Management',
        href: maintenance.index().url,
    },
];

export default function MaintenanceIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Room Status Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
