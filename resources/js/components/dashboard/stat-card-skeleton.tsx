import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatCardSkeleton() {
    return (
        <Card className="gap-4 py-5">
            <CardHeader className="gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-full" />
            </CardContent>
        </Card>
    );
}
