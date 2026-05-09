export default function BuildingsStep({ buildings, onAdvance, onBack }: { buildings: object[]; onAdvance: () => void; onBack: () => void }) {
    return (
        <div>
            <p>Buildings step placeholder</p>
            <button type="button" onClick={onBack}>Back</button>
            <button type="button" onClick={onAdvance}>Continue</button>
        </div>
    );
}
