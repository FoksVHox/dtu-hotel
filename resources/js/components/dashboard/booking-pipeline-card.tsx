import { CalendarRange, Clock, TrendingUp, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import type { BookingPipeline } from '@/types/dashboard';

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

export function BookingPipelineCard({
    pipeline,
}: {
    pipeline: BookingPipeline;
}) {
    return (
        <Card className="gap-4 py-5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="size-4 text-muted-foreground" />
                    Booking Pipeline
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <StatRow
                    icon={CalendarRange}
                    label="This week bookings"
                    value={pipeline.thisWeekBookings}
                />
                <StatRow
                    icon={CalendarRange}
                    label="Next week bookings"
                    value={pipeline.nextWeekBookings}
                />
                <StatRow
                    icon={Clock}
                    label="Pending confirmations"
                    value={pipeline.pendingConfirmations}
                />
                <StatRow
                    icon={XCircle}
                    label="Cancelled this week"
                    value={pipeline.cancelledThisWeek}
                />
                <Separator />
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Occupancy this week
                    </span>
                    <span className="text-xs font-medium">
                        {pipeline.occupancyThisWeek}%
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Occupancy last week
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium">
                        {pipeline.occupancyLastWeek}%
                        <TrendIndicator
                            current={pipeline.occupancyThisWeek}
                            previous={pipeline.occupancyLastWeek}
                        />
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
