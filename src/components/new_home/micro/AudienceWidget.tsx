"use client";

const MAP_W = 1010;
const MAP_H = 666;

/** Equirectangular — lon/lat → map coordinates (matches @svg-maps/world viewBox). */
function project(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * MAP_W,
    y: ((90 - lat) / 180) * MAP_H,
  };
}

/** Land-only city anchors — no ocean coordinates. */
const HOTSPOTS = [
  /* North America */
  { lon: -74.0, lat: 40.7 },
  { lon: -118.2, lat: 34.1 },
  { lon: -87.6, lat: 41.9 },
  { lon: -79.4, lat: 43.7 },
  { lon: -99.1, lat: 19.4 },
  { lon: -80.2, lat: 25.8 },
  { lon: -122.4, lat: 37.8 },
  /* South America */
  { lon: -46.6, lat: -23.5 },
  { lon: -58.4, lat: -34.6 },
  { lon: -74.0, lat: 4.7 },
  { lon: -77.0, lat: -12.0 },
  { lon: -47.9, lat: -15.8 },
  /* Europe */
  { lon: -0.1, lat: 51.5 },
  { lon: 2.3, lat: 48.9 },
  { lon: 13.4, lat: 52.5 },
  { lon: -3.7, lat: 40.4 },
  { lon: 12.5, lat: 41.9 },
  { lon: 21.0, lat: 52.2 },
  { lon: 18.1, lat: 59.3 },
  { lon: 4.9, lat: 52.4 },
  /* Africa & Middle East */
  { lon: 3.4, lat: 6.5 },
  { lon: 31.2, lat: 30.0 },
  { lon: 28.0, lat: -26.2 },
  { lon: 36.8, lat: -1.3 },
  { lon: 55.3, lat: 25.2 },
  { lon: 29.0, lat: 41.0 },
  /* Asia-Pacific */
  { lon: 72.8, lat: 19.1 },
  { lon: 77.2, lat: 28.6 },
  { lon: 88.4, lat: 22.6 },
  { lon: 116.4, lat: 39.9 },
  { lon: 121.5, lat: 31.2 },
  { lon: 139.7, lat: 35.7 },
  { lon: 127.0, lat: 37.5 },
  { lon: 100.5, lat: 13.7 },
  { lon: 106.8, lat: -6.2 },
  { lon: 121.0, lat: 14.6 },
  { lon: 103.8, lat: 1.3 },
  /* Oceania */
  { lon: 151.2, lat: -33.9 },
  { lon: 174.8, lat: -36.9 },
] as const;

export function AudienceWidget() {
  return (
    <div className="nh-audience" aria-hidden>
      <div className="nh-audience__map-wrap">
        <div className="nh-audience__map-stack">
          <img
            src="/home/world-map.svg"
            alt=""
            className="nh-audience__map-geo"
            aria-hidden
            draggable={false}
          />
          <svg className="nh-audience__map nh-audience__map-dots" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden>
            <defs>
              <filter id="nh-map-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {HOTSPOTS.map((spot, i) => {
              const { x, y } = project(spot.lon, spot.lat);
              const r = i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3.5;
              const halo = r * 2.4;
              return (
                <g key={`${spot.lon}-${spot.lat}`} filter="url(#nh-map-dot-glow)">
                  <circle className="nh-audience__map-dot-halo" cx={x} cy={y} r={halo} />
                  <circle
                    className="nh-audience__map-dot"
                    cx={x}
                    cy={y}
                    r={r}
                    style={{ animationDelay: `${(i * 0.17) % 2.6}s` }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
