import { Check } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Hotel' },
    { id: 2, label: 'Buildings' },
    { id: 3, label: 'Rooms' },
];

export default function WizardStepper({ currentStep }: { currentStep: number }) {
    return (
        <nav className="flex items-center justify-center gap-2" aria-label="Onboarding progress">
            {STEPS.map((step, idx) => {
                const isComplete = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                    <div key={step.id} className="flex items-center gap-2">
                        <div
                            className={[
                                'flex size-7 items-center justify-center rounded-full border text-xs font-medium',
                                isComplete && 'border-black bg-black text-white',
                                isCurrent && 'border-black text-black',
                                !isComplete && !isCurrent && 'border-neutral-300 text-neutral-400',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            {isComplete ? <Check className="size-4" /> : step.id}
                        </div>
                        <span
                            className={[
                                'text-sm',
                                isCurrent ? 'font-medium text-black' : 'text-neutral-500',
                            ].join(' ')}
                        >
                            {step.label}
                        </span>
                        {idx < STEPS.length - 1 && (
                            <div className="h-px w-8 bg-neutral-300" aria-hidden />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
