<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MaintenanceLogController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'action' => ['required', 'string', 'max:255'],
            'maintained_by' => ['nullable', 'string', 'max:255'],
            'performed_at' => ['required', 'date'],
        ]);

        MaintenanceLog::create([
            'room_id' => $validated['room_id'],
            'action' => $validated['action'],
            'maintained_by' => $validated['maintained_by'] ?? null,
            'performed_at' => $validated['performed_at'],
        ]);

        return redirect()->back();
    }
}
