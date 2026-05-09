import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="2" width="6" height="36" rx="0.5" />
            <rect x="28" y="2" width="6" height="36" rx="0.5" />
            <rect x="6" y="14" width="28" height="6" rx="0.5" />
            <rect x="17" y="26" width="6" height="12" rx="0.5" />
        </svg>
    );
}
