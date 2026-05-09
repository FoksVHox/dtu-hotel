import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Hotel {
    id: number;
    name: string;
    phone: string;
    cvr: string;
    address: string;
    currency: string;
}

interface HotelStepProps {
    hotel: Hotel | null;
    onAdvance: () => void;
}

export default function HotelStep({ hotel, onAdvance }: HotelStepProps) {
    const form = useForm({
        name: hotel?.name ?? '',
        phone: hotel?.phone ?? '',
        cvr: hotel?.cvr ?? '',
        address: hotel?.address ?? '',
        currency: hotel?.currency ?? 'DKK',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/hotel', {
            preserveScroll: true,
            onSuccess: () => onAdvance(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Tell us about your hotel</h1>
                <p className="text-sm text-neutral-500">We'll use this everywhere your hotel appears across the product.</p>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <Field label="Hotel name" error={form.errors.name}>
                    <input type="text" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </Field>
                <Field label="Phone" error={form.errors.phone}>
                    <input type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </Field>
                <Field label="CVR" error={form.errors.cvr}>
                    <input type="text" value={form.data.cvr} onChange={(e) => form.setData('cvr', e.target.value)} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </Field>
                <Field label="Address" error={form.errors.address}>
                    <input type="text" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                </Field>
                <Field label="Currency" error={form.errors.currency}>
                    <select value={form.data.currency} onChange={(e) => form.setData('currency', e.target.value)} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                        <option value="DKK">DKK</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </Field>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={form.processing} className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
                    Continue
                </button>
            </div>
        </form>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {children}
            {error && <span className="text-sm text-red-600">{error}</span>}
        </label>
    );
}
