import { router, useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { FormEvent } from 'react';

interface Floor { id: number; name: string; code: string; }
interface Building { id: number; name: string; floors: Floor[]; }
interface Category { id: number; name: string; }
interface Rule {
    start_number: number;
    end_number: number;
    floor_id: number;
    category_id: number;
}

interface RoomsStepProps {
    buildings: Building[];
    categories: Category[];
    onBack: () => void;
}

export default function RoomsStep({ buildings, categories, onBack }: RoomsStepProps) {
    const firstFloor = buildings[0]?.floors[0]?.id ?? 0;
    const firstCategory = categories[0]?.id ?? 0;

    const form = useForm<{ rules: Rule[] }>({
        rules: [{ start_number: 101, end_number: 110, floor_id: firstFloor, category_id: firstCategory }],
    });

    const addRule = () => {
        form.setData('rules', [...form.data.rules, { start_number: 1, end_number: 5, floor_id: firstFloor, category_id: firstCategory }]);
    };
    const removeRule = (idx: number) => {
        form.setData('rules', form.data.rules.filter((_, i) => i !== idx));
    };
    const update = (idx: number, key: keyof Rule, value: number) => {
        const next = [...form.data.rules];
        next[idx] = { ...next[idx], [key]: value };
        form.setData('rules', next);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/onboarding/rooms', {
            preserveScroll: true,
            onSuccess: () => router.post('/onboarding/complete'),
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Add your rooms</h1>
                <p className="text-sm text-neutral-500">Define one or more numbering rules. We'll create the rooms for you.</p>
            </header>

            <div className="flex flex-col gap-3">
                {form.data.rules.map((rule, idx) => (
                    <div key={idx} className="flex flex-wrap items-end gap-3 rounded border border-neutral-200 p-4">
                        <Inline label="From">
                            <input type="number" min={1} value={rule.start_number} onChange={(e) => update(idx, 'start_number', Number(e.target.value))} className="h-11 w-24 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                        </Inline>
                        <Inline label="To">
                            <input type="number" min={1} value={rule.end_number} onChange={(e) => update(idx, 'end_number', Number(e.target.value))} className="h-11 w-24 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
                        </Inline>
                        <Inline label="Floor">
                            <select value={rule.floor_id} onChange={(e) => update(idx, 'floor_id', Number(e.target.value))} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                                {buildings.flatMap((b) => b.floors.map((f) => (
                                    <option key={f.id} value={f.id}>{b.name} · {f.name}</option>
                                )))}
                            </select>
                        </Inline>
                        <Inline label="Category">
                            <select value={rule.category_id} onChange={(e) => update(idx, 'category_id', Number(e.target.value))} className="h-11 rounded border border-neutral-300 px-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </Inline>
                        {form.data.rules.length > 1 && (
                            <button type="button" onClick={() => removeRule(idx)} className="flex size-11 items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100" aria-label="Remove rule">
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                ))}

                {form.errors.rules && <p className="text-sm text-red-600">{form.errors.rules}</p>}

                <button type="button" onClick={addRule} disabled={form.data.rules.length >= 10} className="flex items-center justify-center gap-2 self-start rounded border border-dashed border-neutral-400 px-4 py-2 text-sm hover:border-black disabled:opacity-50">
                    <Plus className="size-4" /> Add another rule
                </button>
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="text-sm text-neutral-500 hover:text-black">Back</button>
                <button type="submit" disabled={form.processing} className="h-11 rounded bg-black px-6 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">Finish setup</button>
            </div>
        </form>
    );
}

function Inline({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</span>
            {children}
        </label>
    );
}
