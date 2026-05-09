import { Head } from '@inertiajs/react';
import Cta from './landing/cta';
import Features from './landing/features';
import Footer from './landing/footer';
import Hero from './landing/hero';
import HowItWorks from './landing/how-it-works';
import Marquee from './landing/marquee';
import ProductShowcase from './landing/product-showcase';

interface WelcomeProps {
    canRegister: boolean;
}

export default function Welcome({ canRegister }: WelcomeProps) {
    return (
        <>
            <Head title="DTU Hotel — Hotel management, simplified." />
            <main className="min-h-screen bg-white text-black antialiased">
                <Hero canRegister={canRegister} />
                <Marquee />
                <HowItWorks />
                <ProductShowcase />
                <Features />
                <Cta canRegister={canRegister} />
                <Footer />
            </main>
        </>
    );
}
