import { Head } from '@inertiajs/react';
import Features from './landing/features';
import Footer from './landing/footer';
import Hero from './landing/hero';

interface WelcomeProps {
    canRegister: boolean;
}

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <>
            <Head title="DTU Hotel" />
            <main className="min-h-screen bg-white text-black">
                <Hero canRegister={canRegister} />
                <Features />
                <Footer />
            </main>
        </>
    );
}
