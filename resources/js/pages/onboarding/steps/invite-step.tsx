import { router } from '@inertiajs/react';
import { Users } from 'lucide-react';

interface InviteStepProps {
    onBack: () => void;
}

export default function InviteStep({ onBack }: InviteStepProps) {
    const finish = () => {
        router.post('/onboarding/complete');
    };

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Invite your team</h1>
                <p className="text-sm text-neutral-500">Coming soon.</p>
            </header>

            <div className="flex flex-col items-center gap-4 rounded border border-neutral-200 px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <Users className="size-6" />
                </div>
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold">Staff accounts coming soon</h2>
                    <p className="max-w-sm text-sm text-neutral-500">
                        You'll be able to invite reception staff, managers, and housekeeping to your hotel here.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="text-sm text-neutral-500 hover:text-black">Back</button>
                <button type="button" onClick={finish} className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800">Skip for now</button>
            </div>
        </div>
    );
}
