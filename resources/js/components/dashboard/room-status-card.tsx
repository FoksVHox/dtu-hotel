import { Building2, CheckCircle, DoorOpen, LogOut, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { RoomStatus } from '@/types/dashboard';

function StatusRow({
    icon: Icon,
    label,
    count,
    percent,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count: number;
    percent?: number;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
            </span>
            <span className="text-sm font-semibold">
                {count}
                {percent !== undefined && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({percent}%)
                    </span>
                )}
            </span>
        </div>
    );
}

export function RoomStatusCard({ status }: { status: RoomStatus }) {
    return (
        <Card className="gap-4 py-5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="size-4 text-muted-foreground" />
                    Room Status
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <StatusRow
                    icon={Building2}
                    label="Total rooms"
                    count={status.totalRooms}
                />
                <StatusRow
                    icon={CheckCircle}
                    label="Occupied"
                    count={status.occupied}
                    percent={status.occupiedPercent}
                />
                <StatusRow
                    icon={DoorOpen}
                    label="Available"
                    count={status.available}
                    percent={status.availablePercent}
                />
                <StatusRow
                    icon={Wrench}
                    label="Maintenance"
                    count={status.maintenance}
                    percent={status.maintenancePercent}
                />
                <StatusRow
                    icon={LogOut}
                    label="Checked out today"
                    count={status.checkedOutToday}
                />
                <Separator />
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Occupancy
                        </span>
                        <span className="text-xs font-medium">
                            {status.occupiedPercent}%
                        </span>
                    </div>
                    <Progress value={status.occupiedPercent} />
                </div>
            </CardContent>
        </Card>
    );
}
