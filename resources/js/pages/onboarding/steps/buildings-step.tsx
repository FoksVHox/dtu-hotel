import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import type { FormEvent } from 'react';

interface Building {
    id: number;
    name: string;
    floors: Array<{ id: number }>;
}

interface BuildingsStepProps {
    buildings: Building[];
    onAdvance: () => void;
    onBack: () => void;
}

export default function BuildingsStep({
    buildings,
    onAdvance,
    onBack,
}: BuildingsStepProps) {
    const initial =
        buildings.length > 0
            ? buildings.map((b) => ({
                  name: b.name,
                  floors_count: b.floors.length,
              }))
            : [{ name: 'Main Building', floors_count: 1 }];

    const form = useForm<{
        buildings: Array<{ name: string; floors_count: number }>;
    }>({ buildings: initial });

    const addBuilding = () => {
        form.setData('buildings', [
            ...form.data.buildings,
            { name: '', floors_count: 1 },
        ]);
    };
    const removeBuilding = (idx: number) => {
        form.setData(
            'buildings',
            form.data.buildings.filter((_, i) => i !== idx),
        );
    };
    const updateBuilding = (
        idx: number,
        key: 'name' | 'floors_count',
        value: string | number,
    ) => {
        const next = [...form.data.buildings];
        next[idx] = { ...next[idx], [key]: value };
        form.setData('buildings', next);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/buildings', {
            preserveScroll: true,
            onSuccess: () => onAdvance(),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Set up your buildings
                </h1>
                <p className="text-sm text-neutral-500">
                    Each building has its own floors. We'll number floors
                    automatically.
                </p>
            </header>

            <div className="flex flex-col gap-3">
                {form.data.buildings.map((b, idx) => (
                    <div
                        key={idx}
                        className="flex items-end gap-3 rounded border border-neutral-200 p-4"
                    >
                        <label className="flex flex-1 flex-col gap-1.5">
                            <span className="text-sm font-medium">
                                Building name
                            </span>
                            <input
                                type="text"
                                value={b.name}
                                onChange={(e) =>
                                    updateBuilding(idx, 'name', e.target.value)
                                }
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                            />
                        </label>
                        <label className="flex w-32 flex-col gap-1.5">
                            <span className="text-sm font-medium">Floors</span>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={b.floors_count}
                                onChange={(e) =>
                                    updateBuilding(
                                        idx,
                                        'floors_count',
                                        Number(e.target.value),
                                    )
                                }
                                className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:ring-1 focus:ring-black focus:outline-none"
                            />
                        </label>
                        {form.data.buildings.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeBuilding(idx)}
                                className="flex size-11 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100"
                                aria-label="Remove building"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                ))}

                {form.errors.buildings && (
                    <p className="text-sm text-red-600">
                        {form.errors.buildings}
                    </p>
                )}

                <button
                    type="button"
                    onClick={addBuilding}
                    disabled={form.data.buildings.length >= 10}
                    className="flex items-center justify-center gap-2 self-start rounded border border-dashed border-neutral-400 px-4 py-2 text-sm hover:border-black disabled:opacity-50"
                >
                    <Plus className="size-4" /> Add another building
                </button>
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-neutral-500 hover:text-black"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                    Continue
                </button>
            </div>
        </form>
    );
}
