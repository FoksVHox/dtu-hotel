import { Head } from '@inertiajs/react';

interface Props {
    currentStep: number;
    hotel: object | null;
    buildings: object[];
    categories: object[];
}

export default function Wizard({ currentStep }: Props) {
    return (
        <>
            <Head title="Hotel Setup" />
            <div className="flex min-h-screen items-center justify-center">
                <p>Step {currentStep}</p>
            </div>
        </>
    );
}
