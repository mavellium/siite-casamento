export function LocationInfo({
  venueName,
  address,
  howToArrive,
  mapEmbedUrl,
}: {
  venueName: string;
  address: string;
  howToArrive: string;
  mapEmbedUrl?: string;
}) {
  return (
    <>
      <p className="event-info-time">{venueName}</p>
      <p className="event-info-address">{address}</p>
      <p className="page-text">{howToArrive}</p>
      {mapEmbedUrl ? (
        <iframe src={mapEmbedUrl} className="location-map" title="Mapa do local" loading="lazy" />
      ) : (
        <div className="location-map location-map-placeholder">mapa em breve [a confirmar]</div>
      )}
    </>
  );
}
