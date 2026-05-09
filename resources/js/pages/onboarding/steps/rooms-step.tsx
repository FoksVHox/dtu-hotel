export default function RoomsStep({ buildings, categories, onAdvance, onBack }: { buildings: object[]; categories: object[]; onAdvance: () => void; onBack: () => void }) {
    return (
        <div>
            <p>Rooms step placeholder</p>
            <button type="button" onClick={onBack}>Back</button>
            <button type="button" onClick={onAdvance}>Continue</button>
        </div>
    );
}
