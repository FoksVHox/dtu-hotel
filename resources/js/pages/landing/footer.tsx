import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="bg-white">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <AppLogoIcon className="size-6 fill-current" />
                        <span className="text-sm font-semibold">DTU Hotel</span>
                    </div>
                    <p className="text-sm text-neutral-500">Hotel management, simplified.</p>
                </div>
                <FooterColumn title="Product" links={[
                    { label: 'Sign in', href: '/login' },
                    { label: 'Get started', href: '/register' },
                ]} />
                <FooterColumn title="Resources" links={[
                    { label: 'Documentation', href: '#' },
                    { label: 'Support', href: '#' },
                ]} />
                <FooterColumn title="Legal" links={[
                    { label: 'Terms', href: '#' },
                    { label: 'Privacy', href: '#' },
                ]} />
            </div>
            <div className="border-t border-neutral-200">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-neutral-500">
                    <span>© {new Date().getFullYear()} DTU Hotel</span>
                    <span>Built at DTU.</span>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="flex flex-col gap-2">
                {links.map((l) => (
                    <li key={l.label}>
                        <Link href={l.href} className="text-sm text-neutral-500 hover:text-black">
                            {l.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
