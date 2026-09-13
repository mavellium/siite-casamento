export function EventInfoDisplay({ time, address, note }: { time: string; address: string; note?: string }) {
  return (
    <>
      <p className="event-info-time">{time}</p>
      <p className="event-info-address">{address}</p>
      {note && <p className="event-info-note">{note}</p>}
    </>
  );
}
