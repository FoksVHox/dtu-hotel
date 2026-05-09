import AppLogoIcon from '@/components/app-logo-icon';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import BuildingsStep from './steps/buildings-step';
import HotelStep from './steps/hotel-step';
import InviteStep from './steps/invite-step';
import RoomsStep from './steps/rooms-step';
import WizardStepper from './wizard-stepper';

interface Floor {
    id: number;
    name: string;
    code: string;
}

interface Building {
    id: number;
    name: string;
    floors: Floor[];
}

interface Hotel {
    id: number;
    name: string;
    currency: string;
}

interface Category {
    id: number;
    name: string;
}

interface WizardProps {
    currentStep: number;
    hotel: Hotel | null;
    buildings: Building[];
    categories: Category[];
}

export default function Wizard({ currentStep: initialStep, hotel, buildings, categories }: WizardProps) {
    const [step, setStep] = useState(initialStep);

    return (
        <>
            <Head title="Set up your hotel" />
            <div className="min-h-screen bg-white text-black">
                <header className="flex items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-2">
                        <AppLogoIcon className="size-6 fill-current" />
                        <span className="text-sm font-semibold">DTU Hotel</span>
                    </div>
                    <Link href="/logout" method="post" as="button" className="text-sm text-neutral-500 hover:text-black">
                        Sign out
                    </Link>
                </header>

                <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
                    <WizardStepper currentStep={step} />

                    {step === 1 && <HotelStep hotel={hotel} onAdvance={() => setStep(2)} />}
                    {step === 2 && <BuildingsStep buildings={buildings} onAdvance={() => setStep(3)} onBack={() => setStep(1)} />}
                    {step === 3 && <RoomsStep buildings={buildings} categories={categories} onAdvance={() => setStep(4)} onBack={() => setStep(2)} />}
                    {step === 4 && <InviteStep onBack={() => setStep(3)} />}
                </main>
            </div>
        </>
    );
}
