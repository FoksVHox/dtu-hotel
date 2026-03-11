export interface TodayActivity {
    checkInsToday: number;
    checkOutsToday: number;
    currentlyCheckedIn: number;
    expectedOccupancy: number;
    pendingConfirmations: number;
}

export interface RoomStatus {
    totalRooms: number;
    occupied: number;
    available: number;
    maintenance: number;
    checkedOutToday: number;
    occupiedPercent: number;
    availablePercent: number;
    maintenancePercent: number;
}

export interface BookingPipeline {
    thisWeekBookings: number;
    nextWeekBookings: number;
    pendingConfirmations: number;
    cancelledThisWeek: number;
    occupancyThisWeek: number;
    occupancyLastWeek: number;
}
