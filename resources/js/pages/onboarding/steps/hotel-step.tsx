export default function HotelStep({ hotel, onAdvance }: { hotel: object | null; onAdvance: () => void }) {
    return (
        <div>
            <p>Hotel step placeholder</p>
            <button type="button" onClick={onAdvance}>Continue</button>
        </div>
    );
}
