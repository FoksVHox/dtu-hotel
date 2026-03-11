import { CalendarCheck, Clock, LogIn, LogOut, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TodayActivity } from '@/types/dashboard';

function StatRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
            </span>
            <span className="text-sm font-semibold">{value}</span>
        </div>
    );
}

export function TodayActivityCard({ activity }: { activity: TodayActivity }) {
    return (
        <Card className="gap-4 py-5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarCheck className="size-4 text-muted-foreground" />
                    Today&apos;s Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <StatRow
                    icon={LogIn}
                    label="Check-ins today"
                    value={activity.checkInsToday}
                />
                <StatRow
                    icon={LogOut}
                    label="Check-outs today"
                    value={activity.checkOutsToday}
                />
                <StatRow
                    icon={Users}
                    label="Currently checked in"
                    value={activity.currentlyCheckedIn}
                />
                <StatRow
                    icon={CalendarCheck}
                    label="Expected occupancy"
                    value={`${activity.expectedOccupancy}%`}
                />
                <Separator />
                <StatRow
                    icon={Clock}
                    label="Pending confirmations"
                    value={activity.pendingConfirmations}
                />
            </CardContent>
        </Card>
    );
}
