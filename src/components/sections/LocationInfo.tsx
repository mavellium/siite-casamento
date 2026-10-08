import { MapPin, Navigation, Compass } from "lucide-react";
import { TextoPendente } from "./TextoPendente";

/**
 * Conteúdo do objeto "Globo" — onde é a festa.
 *
 * Tem DOIS estados, e isso é deliberado: enquanto o casal não fechar o local
 * (data/location.ts ainda está com marcadores "[a confirmar]" e mapEmbedUrl
 * vazio), mostrar um iframe quebrado ou um botão de rota que abriria uma
 * busca por "Endereço completo [a confirmar]" seria pior do que não mostrar
 * nada. O estado pendente é desenhado pra parecer intencional; o mapa e o
 * botão de rota aparecem sozinhos quando os dados reais entrarem.
 */
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
  const temMapa = Boolean(mapEmbedUrl);
  // Só vale oferecer rota com endereço de verdade — ver comentário acima.
  const enderecoReal = !/\[a confirmar\]/i.test(address);

  return (
    <div className="section-local">
      <p className="section-local-venue">
        <TextoPendente>{venueName}</TextoPendente>
      </p>

      <p className="section-local-address">
        <MapPin size={16} aria-hidden="true" />
        <span>
          <TextoPendente>{address}</TextoPendente>
        </span>
      </p>

      <p className="page-text">{howToArrive}</p>

      {temMapa ? (
        <iframe src={mapEmbedUrl} className="location-map" title="Mapa do local" loading="lazy" />
      ) : (
        <div className="section-local-pendente">
          <Compass size={28} aria-hidden="true" />
          <p className="section-local-pendente-texto">mapa em breve</p>
        </div>
      )}

      {enderecoReal && (
        <a
          className="section-local-cta"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={15} aria-hidden="true" /> Como chegar
        </a>
      )}
    </div>
  );
}
