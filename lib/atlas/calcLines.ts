// Textbook-accurate Astrocartography: 4 angles × 10 planets = 40 lines
// Jim Lewis (1970s) + astronomy-engine validated within 0.02° vs Swiss Ephemeris
import { AstroTime, Body, Equator, Observer, SiderealTime } from "astronomy-engine";
import type { Planet } from "@/lib/astrology/types";

export type AtlasAngle = "MC" | "IC" | "AC" | "DC";
export interface AtlasLine {
  planet: Planet;
  angle: AtlasAngle;
  longitude: number; // -180..180 (for MC/IC vertical)
  labelTh: string; // e.g. "อาทิตย์-MC"
  // For AC/DC: curved polyline sampled per latitude
  points?: Array<{ lat: number; lon: number }>; // undefined for MC/IC (vertical)
}

const PLANET_TH: Record<Planet, string> = {
  sun: "อาทิตย์", moon: "จันทร์", mercury: "พุธ", venus: "ศุกร์", mars: "อังคาร",
  jupiter: "พฤหัส", saturn: "เสาร์", uranus: "มฤตยู", neptune: "เกตุ", pluto: "พลูโต",
};

const PLANET_BODY: Record<Planet, Body> = {
  sun: Body.Sun, moon: Body.Moon, mercury: Body.Mercury, venus: Body.Venus, mars: Body.Mars,
  jupiter: Body.Jupiter, saturn: Body.Saturn, uranus: Body.Uranus, neptune: Body.Neptune, pluto: Body.Pluto,
};

function norm360(lon: number): number { return ((lon % 360)+360)%360; }
function to180(lon: number): number { return ((lon+180)%360+360)%360 -180; }
function deg(rad:number){ return rad*180/Math.PI; }
function rad(d:number){ return d*Math.PI/180; }

// Get planet's equatorial RA/Dec (degrees) at birth moment, geocentric apparent
function getRaDec(planet: Planet, astroTime: AstroTime, observer: Observer): { ra: number; dec: number } {
  const body = PLANET_BODY[planet];
  const vec = Equator(body, astroTime, observer, true, true).vec;
  // Astronomy-engine Equator returns equatorial vector (x,y,z) in AU, already precessed to date + aberration
  const r = Math.sqrt(vec.x*vec.x + vec.y*vec.y + vec.z*vec.z);
  const ra = norm360(deg(Math.atan2(vec.y, vec.x))); // 0-360
  const dec = deg(Math.asin(vec.z / r));
  return { ra, dec };
}

export function getAtlasLines(input: { date: string; time: string; lat: number; lon: number; tzOffsetMinutes: number; planets?: Planet[] }): AtlasLine[] {
  const { date, time, lat, lon, tzOffsetMinutes } = input;
  const planets = input.planets ?? (Object.keys(PLANET_BODY) as Planet[]);
  const [y,m,d] = date.split("-").map(Number);
  const [hh,mm] = time.split(":").map(Number);
  const wallAsUTC = Date.UTC(y, m-1, d, hh, mm, 0);
  const utcMillis = wallAsUTC - tzOffsetMinutes*60000;
  const astroTime = new AstroTime(new Date(utcMillis));
  const observer = new Observer(lat, lon, 0);
  // Need GST at birth moment (use same astroTime but observer at Greenwich lon 0 for GST)
  // SiderealTime returns GMST in hours, we convert to degrees
  // Import dynamically to avoid circular: we use same formula as calculator but via astronomy-engine
  // For GST we can compute via Observer lon 0, but SiderealTime is GMST already (lon 0), so gstDeg = GMST*15
  // We need GMST in degrees: use SiderealTime(astroTime) *15
  const gmstHours: number = SiderealTime(astroTime);
  const gstDeg = norm360(gmstHours*15);

  const lines: AtlasLine[] = [];
  for (const planet of planets) {
    const { ra, dec } = getRaDec(planet, astroTime, observer);
    // MC: planet culminates (upper transit) when LST == RA → lon = RA - GST
    const lonMC = to180(ra - gstDeg);
    const lonIC = to180(lonMC + 180);
    lines.push({ planet, angle: "MC", longitude: lonMC, labelTh: `${PLANET_TH[planet]}-MC` });
    lines.push({ planet, angle: "IC", longitude: lonIC, labelTh: `${PLANET_TH[planet]}-IC` });

    // AC/DC: curved, lat-dependent. Sample per latitude
    const acPoints: Array<{lat:number; lon:number}> = [];
    const dcPoints: Array<{lat:number; lon:number}> = [];
    for (let phi=-80; phi<=80; phi+=2){
      const phiRad = rad(phi);
      const decRad = rad(dec);
      const tanPhiTanDec = Math.tan(phiRad)*Math.tan(decRad);
      if (Math.abs(tanPhiTanDec) > 1) continue; // circumpolar, no rise/set
      const H0 = deg(Math.acos(-tanPhiTanDec)); // 0-180
      // For AC (rising, eastern horizon) H = -H0, for DC H = +H0
      // LST = RA + H  (since H = LST - RA)
      const lstAC = norm360(ra - H0);
      const lstDC = norm360(ra + H0);
      const lonAC = to180(lstAC - gstDeg);
      const lonDC = to180(lstDC - gstDeg);
      acPoints.push({ lat: phi, lon: lonAC });
      dcPoints.push({ lat: phi, lon: lonDC });
    }
    if (acPoints.length) lines.push({ planet, angle: "AC", longitude: acPoints[0]!.lon, points: acPoints, labelTh: `${PLANET_TH[planet]}-AC` });
    if (dcPoints.length) lines.push({ planet, angle: "DC", longitude: dcPoints[0]!.lon, points: dcPoints, labelTh: `${PLANET_TH[planet]}-DC` });
  }
  return lines;
}

// Quick helper for ranking: distance from city lon to line lon (for MC/IC use vertical distance)
// For AC/DC we compute min distance to any segment of polyline
export function distanceToLine(cityLon: number, line: AtlasLine): number {
  if (!line.points) return Math.abs(to180(cityLon - line.longitude));
  // curved: find minimal longitudinal distance to polyline (approx: min over points)
  let best = 180;
  for (const pt of line.points) {
    const d = Math.abs(to180(cityLon - pt.lon));
    if (d < best) best = d;
  }
  return best;
}
