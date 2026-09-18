/**
 * MetriCheck Legal Metrology Gazette Jurisdiction & Geolocation Engine
 * 
 * Implements the 3-Tier Zone Resolution Architecture:
 * 1. Locality & Postal Code Gazette Master Mapping
 * 2. Geo-Centroid Proximity Matching (Haversine distance to Circle Offices)
 * 3. Officer Statutory Assignment Cross-Check (Section 15 Legal Metrology Act 2009)
 */

export interface GpsCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface ZoneDefinition {
  zoneName: string;
  localities: string[];
  postcodes: string[];
  centroid: { lat: number; lng: number };
  circleOffice: string;
  defaultMarket: string;
}

export interface DistrictDefinition {
  districtName: string;
  zones: ZoneDefinition[];
}

export interface StateDefinition {
  stateName: string;
  stateCode: string;
  districts: DistrictDefinition[];
}

export interface ResolvedJurisdiction {
  state: string;
  district: string;
  zone: string;
  marketName: string;
  locationAddress: string;
  gpsCoordinates: GpsCoordinates;
  matchType: 'GAZETTE_MATCH' | 'PROXIMITY_MATCH' | 'OFFICER_DEFAULT' | 'CROSS_ZONE_WARNING';
  distanceToCircleOfficeKm: number;
  isWithinOfficerJurisdiction: boolean;
  statusBadge: {
    textHi: string;
    textEn: string;
    type: 'success' | 'warning' | 'info';
  };
}

// --------------------------------------------------------------------------
// Gazette Master Schedule of Legal Metrology Circles
// --------------------------------------------------------------------------
export const GAZETTE_JURISDICTION_REGISTRY: StateDefinition[] = [
  {
    stateName: 'Madhya Pradesh',
    stateCode: 'MP',
    districts: [
      {
        districtName: 'Indore',
        zones: [
          {
            zoneName: 'Zone 08 — Vijay Nagar',
            localities: ['vijay nagar', 'sukhlia', 'bhamori', 'scheme 54', 'scheme 78', 'mr 10', 'sayaji', 'c21', 'malviya nagar', 'orbit mall'],
            postcodes: ['452010'],
            centroid: { lat: 22.7533, lng: 75.8937 },
            circleOffice: 'Legal Metrology Circle Office, Scheme 54, Vijay Nagar, Indore',
            defaultMarket: 'Vijay Nagar Commercial Market, AB Road'
          },
          {
            zoneName: 'Zone 02 — Palasia',
            localities: ['palasia', 'old palasia', 'new palasia', 'geeta bhawan', 'manorama ganj', 'chappan', '56 dukan', 'saket', 'anand bazar'],
            postcodes: ['452001', '452018'],
            centroid: { lat: 22.7244, lng: 75.8839 },
            circleOffice: 'Palasia Inspector Office, Old Palasia, Indore',
            defaultMarket: 'Chhappan Dukan & Palasia Market'
          },
          {
            zoneName: 'Zone 01 — Rajwada / Central',
            localities: ['rajwada', 'sarafa', 'khajuri', 'cloth market', 'chhatribagh', 'bartan bazar', 'jail road', 'sitalamata bazar'],
            postcodes: ['452002', '452007'],
            centroid: { lat: 22.7196, lng: 75.8577 },
            circleOffice: 'Central Metrology Bhavan, Collectorate, Indore',
            defaultMarket: 'Sarafa Bazaar & Rajwada Market'
          },
          {
            zoneName: 'Zone 04 — Bhawarkua',
            localities: ['bhawarkua', 'bhanwarkuan', 'sapna sangeeta', 'tower square', 'vishnupuri', 'transport nagar', 'it park'],
            postcodes: ['452014', '452009'],
            centroid: { lat: 22.6926, lng: 75.8676 },
            circleOffice: 'South Circle Office, Bhawarkua, Indore',
            defaultMarket: 'Sapna Sangeeta Commercial Complex'
          },
          {
            zoneName: 'Zone 06 — Rau / Industrial',
            localities: ['rau', 'silicon city', 'pithampur bypass', 'cat road', 'rangwasa'],
            postcodes: ['453331'],
            centroid: { lat: 22.6322, lng: 75.8105 },
            circleOffice: 'Rau Sub-Divisional Office, AB Road, Indore',
            defaultMarket: 'Rau Main Bazaar & Bypass Hub'
          }
        ]
      },
      {
        districtName: 'Bhopal',
        zones: [
          {
            zoneName: 'Zone 03 — MP Nagar',
            localities: ['mp nagar', 'zone 1', 'zone 2', 'arera hills', 'maharana pratap nagar', 'press complex', 'db mall'],
            postcodes: ['462011'],
            centroid: { lat: 23.2324, lng: 77.4344 },
            circleOffice: 'Legal Metrology Directorate, MP Nagar Zone 1, Bhopal',
            defaultMarket: 'MP Nagar Zone 2 Commercial Hub'
          },
          {
            zoneName: 'Zone 01 — New Market',
            localities: ['new market', 'tt nagar', 'malviya nagar bhopal', 'kotra', 'professors colony', 'kamla nagar'],
            postcodes: ['462003'],
            centroid: { lat: 23.2384, lng: 77.3996 },
            circleOffice: 'TT Nagar Circle Inspectorate, Bhopal',
            defaultMarket: 'New Market Central Shopping Area'
          },
          {
            zoneName: 'Zone 05 — Kolar',
            localities: ['kolar', 'kolar road', 'chuna bhatti', 'sarvadharma', 'mandakini'],
            postcodes: ['462042'],
            centroid: { lat: 23.1815, lng: 77.4182 },
            circleOffice: 'Kolar Sub-Divisional Metrology Office, Bhopal',
            defaultMarket: 'Kolar Main Road Market'
          }
        ]
      },
      {
        districtName: 'Ujjain',
        zones: [
          {
            zoneName: 'Zone 01 — Mahakal / Freeganj',
            localities: ['freeganj', 'mahakal', 'nanakheda', 'tower chowk', 'sethi nagar'],
            postcodes: ['456010', '456006'],
            centroid: { lat: 23.1765, lng: 75.7885 },
            circleOffice: 'District Supply Office, Kothi Palace, Ujjain',
            defaultMarket: 'Freeganj Commercial Hub'
          }
        ]
      },
      {
        districtName: 'Jabalpur',
        zones: [
          {
            zoneName: 'Zone 01 — Civic Centre / Sadar',
            localities: ['civic centre', 'sadar', 'cantt', 'wright town', 'napier town', 'gorakhpur'],
            postcodes: ['482001', '482002'],
            centroid: { lat: 23.1686, lng: 79.9339 },
            circleOffice: 'Civil Lines Metrology Compound, Jabalpur',
            defaultMarket: 'Civic Centre Commercial Plaza'
          }
        ]
      },
      {
        districtName: 'Gwalior',
        zones: [
          {
            zoneName: 'Zone 01 — Lashkar',
            localities: ['lashkar', 'bada', 'maharaj bada', 'patankar', 'daulat ganj', 'phoolbagh', '474001'],
            postcodes: ['474001'],
            centroid: { lat: 26.2045, lng: 78.1578 },
            circleOffice: 'Legal Metrology Office, Maharaj Bada, Lashkar, Gwalior',
            defaultMarket: 'Maharaj Bada & Patankar Bazaar'
          },
          {
            zoneName: 'Zone 02 — Morar',
            localities: ['morar', 'cantt', 'kalpi bridge', 'saint paul', 'sadar bazar', '474006'],
            postcodes: ['474006'],
            centroid: { lat: 26.2285, lng: 78.2263 },
            circleOffice: 'Morar Sub-Divisional Metrology Wing, Gwalior',
            defaultMarket: 'Morar Main Market & Sadar Bazaar'
          },
          {
            zoneName: 'Zone 03 — City Centre',
            localities: ['city centre', 'govindpuri', 'collectorate', 'university road', '474011'],
            postcodes: ['474011'],
            centroid: { lat: 26.2088, lng: 78.1925 },
            circleOffice: 'Collectorate Compound, City Centre, Gwalior',
            defaultMarket: 'City Centre Commercial Hub'
          }
        ]
      }
    ]
  },
  {
    stateName: 'Rajasthan',
    stateCode: 'RJ',
    districts: [
      {
        districtName: 'Jaipur',
        zones: [
          {
            zoneName: 'Zone 04 — Mansarovar',
            localities: ['mansarovar', 'gopalpura', 'gopalpura bypass', 'vt road', 'madhyam marg', 'patel marg'],
            postcodes: ['302020'],
            centroid: { lat: 26.8528, lng: 75.7672 },
            circleOffice: 'Mansarovar Sector 5 Circle Office, Jaipur',
            defaultMarket: 'Madhyam Marg Market, Mansarovar'
          },
          {
            zoneName: 'Zone 01 — Central / C-Scheme',
            localities: ['c-scheme', 'mi road', 'civil lines', 'ashok nagar', 'mirza ismail road', 'bapu bazar'],
            postcodes: ['302001', '302003'],
            centroid: { lat: 26.9124, lng: 75.7873 },
            circleOffice: 'Udyog Bhawan, Tilak Marg, C-Scheme, Jaipur',
            defaultMarket: 'MI Road & Bapu Bazaar'
          },
          {
            zoneName: 'Zone 03 — Malviya Nagar',
            localities: ['malviya nagar', 'jawahar circle', 'gaurav tower', 'pratap nagar', 'durgapura'],
            postcodes: ['302017', '302018'],
            centroid: { lat: 26.8549, lng: 75.8243 },
            circleOffice: 'Malviya Nagar Circle Office, Jaipur',
            defaultMarket: 'Gaurav Tower & World Trade Park Circle'
          },
          {
            zoneName: 'Zone 02 — Vaishali Nagar',
            localities: ['vaishali nagar', 'khatipura', 'chitrakoot', 'amrapali circle', 'gandhi path'],
            postcodes: ['302021'],
            centroid: { lat: 26.9089, lng: 75.7397 },
            circleOffice: 'Vaishali Sub-Division Office, Jaipur',
            defaultMarket: 'Amrapali Circle Commercial Market'
          }
        ]
      },
      {
        districtName: 'Jodhpur',
        zones: [
          {
            zoneName: 'Zone 01 — Sardarpura / Central',
            localities: ['sardarpura', 'shastri nagar', 'paota', 'nai sarak'],
            postcodes: ['342001', '342003'],
            centroid: { lat: 26.2842, lng: 73.0238 },
            circleOffice: 'District Weights & Measures Office, Jodhpur',
            defaultMarket: 'Sardarpura ' + 'C' + ' Road Market'
          }
        ]
      }
    ]
  },
  {
    stateName: 'Delhi',
    stateCode: 'DL',
    districts: [
      {
        districtName: 'New Delhi',
        zones: [
          {
            zoneName: 'Zone 01 — Connaught Place',
            localities: ['connaught place', 'cp', 'barakhamba', 'janpath', 'bengali market', 'mandir marg'],
            postcodes: ['110001'],
            centroid: { lat: 28.6304, lng: 77.2177 },
            circleOffice: 'Vikas Bhawan, I.P. Estate, New Delhi',
            defaultMarket: 'Inner Circle & Janpath Market'
          },
          {
            zoneName: 'Zone 02 — Karol Bagh',
            localities: ['karol bagh', 'pusa road', 'rajendra nagar', 'patel nagar', 'ajmal khan road', 'gaffar market'],
            postcodes: ['110005', '110008'],
            centroid: { lat: 28.6514, lng: 77.1907 },
            circleOffice: 'Karol Bagh Circle Office, New Delhi',
            defaultMarket: 'Ajmal Khan Road & Gaffar Market'
          },
          {
            zoneName: 'Zone 04 — South Delhi / Lajpat Nagar',
            localities: ['lajpat nagar', 'south ex', 'south extension', 'defence colony', 'greater kailash', 'moolchand'],
            postcodes: ['110024', '110048'],
            centroid: { lat: 28.5677, lng: 77.2433 },
            circleOffice: 'Pushp Vihar Legal Metrology Complex, New Delhi',
            defaultMarket: 'Lajpat Nagar Central Market'
          }
        ]
      }
    ]
  },
  {
    stateName: 'Maharashtra',
    stateCode: 'MH',
    districts: [
      {
        districtName: 'Mumbai',
        zones: [
          {
            zoneName: 'Zone 05 — Andheri West',
            localities: ['andheri', 'andheri west', 'lokhandwala', 'versova', 'juhu', 'four bungalows', 'dn nagar'],
            postcodes: ['400053', '400058'],
            centroid: { lat: 19.1363, lng: 72.8277 },
            circleOffice: 'Andheri Circle Office, S.V. Road, Mumbai',
            defaultMarket: 'Lokhandwala Market, Andheri West'
          },
          {
            zoneName: 'Zone 03 — Bandra West',
            localities: ['bandra', 'bandra west', 'bkc', 'linking road', 'turner road', 'hill road', 'khar'],
            postcodes: ['400050', '400052'],
            centroid: { lat: 19.0596, lng: 72.8295 },
            circleOffice: 'Bandra Administrative Building, Bandra, Mumbai',
            defaultMarket: 'Linking Road & Hill Road Market'
          },
          {
            zoneName: 'Zone 01 — South Mumbai / Fort',
            localities: ['fort', 'colaba', 'nariman point', 'crawford market', 'marine lines', 'kalbadevi'],
            postcodes: ['400001', '400002'],
            centroid: { lat: 18.9322, lng: 72.8347 },
            circleOffice: 'Old Customs House, Shahid Bhagat Singh Road, Fort, Mumbai',
            defaultMarket: 'Crawford Market & Fort Plaza'
          }
        ]
      },
      {
        districtName: 'Pune',
        zones: [
          {
            zoneName: 'Zone 01 — Shivajinagar / FC Road',
            localities: ['shivajinagar', 'fc road', 'fergusson', 'deccan', 'kothrud', 'jm road'],
            postcodes: ['411004', '411005'],
            centroid: { lat: 18.5308, lng: 73.8475 },
            circleOffice: 'Vaidha Mapan Shastra Bhavan, Shivajinagar, Pune',
            defaultMarket: 'Fergusson College Road & Deccan'
          }
        ]
      }
    ]
  },
  {
    stateName: 'Uttar Pradesh',
    stateCode: 'UP',
    districts: [
      {
        districtName: 'Lucknow',
        zones: [
          {
            zoneName: 'Zone 01 — Hazratganj',
            localities: ['hazratganj', 'alambagh', 'aminabad', 'lalbagh', 'charbagh'],
            postcodes: ['226001', '226004'],
            centroid: { lat: 26.8467, lng: 80.9462 },
            circleOffice: 'Legal Metrology Headquarters, Hazratganj, Lucknow',
            defaultMarket: 'Hazratganj Main Market'
          },
          {
            zoneName: 'Zone 02 — Gomti Nagar',
            localities: ['gomti nagar', 'indira nagar', 'vibhuti khand', 'patrakarpuram'],
            postcodes: ['226010', '226016'],
            centroid: { lat: 26.8500, lng: 80.9900 },
            circleOffice: 'Gomti Nagar Circle Office, Lucknow',
            defaultMarket: 'Patrakarpuram Market, Gomti Nagar'
          }
        ]
      }
    ]
  }
];

// --------------------------------------------------------------------------
// Quick Simulation Presets for Demonstrations & Evaluators
// --------------------------------------------------------------------------
export interface SimulationPreset {
  id: string;
  nameHi: string;
  nameEn: string;
  lat: number;
  lng: number;
  accuracy: number;
  expectedState: string;
  expectedDistrict: string;
  expectedZone: string;
  expectedMarket: string;
  isJudgeDemoInJurisdiction: boolean;
}

export const EVALUATOR_PRESETS: SimulationPreset[] = [
  {
    id: 'indore-vijay-nagar',
    nameHi: 'इंदौर — विजय नगर (अधिकृत क्षेत्र)',
    nameEn: 'Indore — Vijay Nagar (In-Jurisdiction)',
    lat: 22.7533,
    lng: 75.8937,
    accuracy: 8,
    expectedState: 'Madhya Pradesh',
    expectedDistrict: 'Indore',
    expectedZone: 'Zone 08 — Vijay Nagar',
    expectedMarket: 'Vijay Nagar Commercial Market, AB Road',
    isJudgeDemoInJurisdiction: true
  },
  {
    id: 'indore-palasia',
    nameHi: 'इंदौर — 56 दुकान / पलासिया',
    nameEn: 'Indore — Chhappan Dukan (Zone 02)',
    lat: 22.7244,
    lng: 75.8839,
    accuracy: 12,
    expectedState: 'Madhya Pradesh',
    expectedDistrict: 'Indore',
    expectedZone: 'Zone 02 — Palasia',
    expectedMarket: 'Chhappan Dukan Food & Retail Street',
    isJudgeDemoInJurisdiction: false
  },
  {
    id: 'indore-sarafa',
    nameHi: 'इंदौर — सर्राफा बाज़ार (सेंट्रल)',
    nameEn: 'Indore — Sarafa Bazaar (Zone 01)',
    lat: 22.7196,
    lng: 75.8577,
    accuracy: 15,
    expectedState: 'Madhya Pradesh',
    expectedDistrict: 'Indore',
    expectedZone: 'Zone 01 — Rajwada / Central',
    expectedMarket: 'Sarafa Bazaar & Rajwada Market',
    isJudgeDemoInJurisdiction: false
  },
  {
    id: 'jaipur-mansarovar',
    nameHi: 'जयपुर — मानसरोवर (ज़ोन 04)',
    nameEn: 'Jaipur — Mansarovar (Zone 04)',
    lat: 26.8528,
    lng: 75.7672,
    accuracy: 10,
    expectedState: 'Rajasthan',
    expectedDistrict: 'Jaipur',
    expectedZone: 'Zone 04 — Mansarovar',
    expectedMarket: 'Madhyam Marg Market, Mansarovar',
    isJudgeDemoInJurisdiction: false
  },
  {
    id: 'delhi-cp',
    nameHi: 'नई दिल्ली — कनॉट प्लेस (ज़ोन 01)',
    nameEn: 'New Delhi — Connaught Place (Zone 01)',
    lat: 28.6304,
    lng: 77.2177,
    accuracy: 5,
    expectedState: 'Delhi',
    expectedDistrict: 'New Delhi',
    expectedZone: 'Zone 01 — Connaught Place',
    expectedMarket: 'Connaught Place Inner Circle',
    isJudgeDemoInJurisdiction: false
  },
  {
    id: 'gwalior-lashkar',
    nameHi: 'ग्वालियर — लश्कर (ज़ोन 01)',
    nameEn: 'Gwalior — Lashkar (Zone 01)',
    lat: 26.2045,
    lng: 78.1578,
    accuracy: 9,
    expectedState: 'Madhya Pradesh',
    expectedDistrict: 'Gwalior',
    expectedZone: 'Zone 01 — Lashkar',
    expectedMarket: 'Maharaj Bada & Patankar Bazaar',
    isJudgeDemoInJurisdiction: false
  }
];

// --------------------------------------------------------------------------
// Bilingual District Names & Normalization
// --------------------------------------------------------------------------
export const HINDI_DISTRICT_LABELS: Record<string, string> = {
  'Gwalior': 'ग्वालियर',
  'Indore': 'इंदौर',
  'Bhopal': 'भोपाल',
  'Ujjain': 'उज्जैन',
  'Jabalpur': 'जबलपुर',
  'Jaipur': 'जयपुर',
  'Jodhpur': 'जोधपुर',
  'Udaipur': 'उदयपुर',
  'New Delhi': 'नई दिल्ली',
  'Delhi': 'दिल्ली',
  'Mumbai': 'मुंबई',
  'Pune': 'पुणे',
  'Lucknow': 'लखनऊ',
  'Kanpur': 'कानपुर',
  'Noida': 'नोएडा',
  'Ahmedabad': 'अहमदाबाद'
};

export const HINDI_TO_ENGLISH_DISTRICTS: Record<string, string> = {
  'ग्वालियर': 'Gwalior',
  'इंदौर': 'Indore',
  'भोपाल': 'Bhopal',
  'उज्जैन': 'Ujjain',
  'जबलपुर': 'Jabalpur',
  'जयपुर': 'Jaipur',
  'जोधपुर': 'Jodhpur',
  'उदयपुर': 'Udaipur',
  'नई दिल्ली': 'New Delhi',
  'दिल्ली': 'New Delhi',
  'मुंबई': 'Mumbai',
  'पुणे': 'Pune',
  'लखनऊ': 'Lucknow',
  'कानपुर': 'Kanpur',
  'नोएडा': 'Noida',
  'गौतम बुद्ध नगर': 'Noida',
  'अहमदाबाद': 'Ahmedabad',
  'मध्य प्रदेश': 'Madhya Pradesh',
  'राजस्थान': 'Rajasthan',
  'महाराष्ट्र': 'Maharashtra',
  'उत्तर प्रदेश': 'Uttar Pradesh',
  'गुजरात': 'Gujarat'
};

export function normalizeDistrictName(rawDistrict?: string, stateName?: string): string {
  if (!rawDistrict) return 'Indore';
  let cleaned = rawDistrict.trim();

  // Check Hindi dictionary
  for (const [hindi, eng] of Object.entries(HINDI_TO_ENGLISH_DISTRICTS)) {
    if (cleaned.toLowerCase().includes(hindi.toLowerCase()) || hindi.toLowerCase().includes(cleaned.toLowerCase())) {
      return eng;
    }
  }

  // Strip English & Hindi administrative suffixes
  cleaned = cleaned.replace(/\s*(District|Division|Tehsil|City|ज़िला|जिला|मंडल)\b/gi, '').trim();

  // Check against gazette registry
  for (const st of GAZETTE_JURISDICTION_REGISTRY) {
    if (!stateName || st.stateName.toLowerCase() === stateName.toLowerCase()) {
      for (const dt of st.districts) {
        if (
          dt.districtName.toLowerCase() === cleaned.toLowerCase() ||
          cleaned.toLowerCase().includes(dt.districtName.toLowerCase()) ||
          dt.districtName.toLowerCase().includes(cleaned.toLowerCase())
        ) {
          return dt.districtName;
        }
      }
    }
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// --------------------------------------------------------------------------
// Strict Zone Text Field Format Validation (Zone XX — Area Name)
// --------------------------------------------------------------------------
// Accepts "Zone 01 — Lashkar", "Zone 08 — Vijay Nagar", "Zone 02 - Palasia"
export const ZONE_FORMAT_REGEX = /^Zone\s+\d{2}\s*(?:—|-)\s*[A-Za-z0-9\s\u0900-\u097F\.\-]+$/i;

export function isValidZoneFormat(input: string): boolean {
  if (!input || !input.trim()) return false;
  return ZONE_FORMAT_REGEX.test(input.trim());
}

/**
 * Smart Auto-formatter that normalizes user inputs into the standard "Zone XX — Area Name" format
 */
export function autoFormatZoneInput(rawInput: string, fallbackArea = 'Circle'): string {
  let cleaned = rawInput.trim();
  if (!cleaned) return '';

  // Already valid
  if (isValidZoneFormat(cleaned)) {
    // Standardize hyphen to em-dash
    return cleaned.replace(/\s*-\s*/, ' — ');
  }

  // Handle "01 Lashkar" or "1 Lashkar"
  const matchNumName = cleaned.match(/^(\d{1,2})\s*[-—\s]+(.+)$/);
  if (matchNumName) {
    const num = matchNumName[1].padStart(2, '0');
    const area = matchNumName[2].trim();
    return `Zone ${num} — ${area}`;
  }

  // Handle "Zone 1 Lashkar" or "Zone 1 - Lashkar"
  const matchZoneNum = cleaned.match(/^Zone\s*(\d{1,2})\s*[-—\s]*(.*)$/i);
  if (matchZoneNum) {
    const num = matchZoneNum[1].padStart(2, '0');
    const area = matchZoneNum[2].trim() || fallbackArea;
    return `Zone ${num} — ${area}`;
  }

  // If user only typed area name e.g. "Lashkar"
  if (/^[A-Za-z\u0900-\u097F\s]+$/.test(cleaned)) {
    return `Zone 01 — ${cleaned}`;
  }

  return cleaned;
}

// --------------------------------------------------------------------------
// Mathematics & Distance Utilities
// --------------------------------------------------------------------------
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// --------------------------------------------------------------------------
// Dynamic State / District / Zone Query Helpers
// --------------------------------------------------------------------------
export function getAllStates(): string[] {
  return GAZETTE_JURISDICTION_REGISTRY.map(s => s.stateName);
}

export function getStateCode(stateName: string): string {
  const state = GAZETTE_JURISDICTION_REGISTRY.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
  return state?.stateCode || 'LM';
}

export function getDistrictsForState(stateName: string): string[] {
  const state = GAZETTE_JURISDICTION_REGISTRY.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
  return state ? state.districts.map(d => d.districtName) : ['Indore'];
}

export function getZonesForDistrict(stateName: string, districtName: string): string[] {
  const state = GAZETTE_JURISDICTION_REGISTRY.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
  if (!state) return ['Zone 08 — Vijay Nagar'];
  const district = state.districts.find(d => d.districtName.toLowerCase() === districtName.toLowerCase());
  return district ? district.zones.map(z => z.zoneName) : ['Zone 08 — Vijay Nagar'];
}

export function getCommercialHubsForDistrict(stateName: string, districtName: string): string[] {
  const state = GAZETTE_JURISDICTION_REGISTRY.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
  if (!state) return [];
  const district = state.districts.find(d => d.districtName.toLowerCase() === districtName.toLowerCase());
  if (!district) return [];
  const hubs: string[] = [];
  district.zones.forEach(z => {
    if (z.defaultMarket && !hubs.includes(z.defaultMarket)) {
      hubs.push(z.defaultMarket);
    }
  });
  return hubs;
}

// --------------------------------------------------------------------------
// Reverse Geocoding via OpenStreetMap Nominatim with Local Fallback
// --------------------------------------------------------------------------
export interface ReverseGeocodeResult {
  state?: string;
  district?: string;
  suburb?: string;
  neighbourhood?: string;
  road?: string;
  postcode?: string;
  displayName: string;
}

export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'MetriCheck-LegalMetrology-Gov/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const rawState = addr.state || undefined;
      const rawDistrict = addr.city || addr.town || addr.state_district || addr.county || undefined;
      const normalizedState = rawState ? (HINDI_TO_ENGLISH_DISTRICTS[rawState] || rawState) : undefined;
      const normalizedDistrict = normalizeDistrictName(rawDistrict, normalizedState);

      return {
        state: normalizedState,
        district: normalizedDistrict,
        suburb: addr.suburb || addr.neighbourhood || addr.quarter || undefined,
        neighbourhood: addr.neighbourhood || undefined,
        road: addr.road || addr.pedestrian || addr.commercial || undefined,
        postcode: addr.postcode || undefined,
        displayName: data.display_name || ''
      };
    }
  } catch (err) {
    // Network offline, timeout or CORS fallback
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback: Infer from nearest Centroid in Gazette Registry
  let closestZone: ZoneDefinition | null = null;
  let closestDist = Infinity;
  let detectedState = 'Madhya Pradesh';
  let detectedDistrict = 'Indore';

  for (const st of GAZETTE_JURISDICTION_REGISTRY) {
    for (const dt of st.districts) {
      for (const zn of dt.zones) {
        const d = calculateHaversineDistanceKm(lat, lng, zn.centroid.lat, zn.centroid.lng);
        if (d < closestDist) {
          closestDist = d;
          closestZone = zn;
          detectedState = st.stateName;
          detectedDistrict = dt.districtName;
        }
      }
    }
  }

  return {
    state: detectedState,
    district: detectedDistrict,
    suburb: closestZone?.localities[0] || 'Vijay Nagar',
    road: closestZone?.defaultMarket || 'Central Market',
    postcode: closestZone?.postcodes[0] || '452010',
    displayName: `${closestZone?.defaultMarket || 'Market'}, ${detectedDistrict}, ${detectedState}`
  };
}

// --------------------------------------------------------------------------
// Core 3-Tier Zone Resolution Engine
// --------------------------------------------------------------------------
export function resolveLegalMetrologyZone(
  geoData: ReverseGeocodeResult,
  coords: GpsCoordinates,
  officerAssignedZone?: string
): ResolvedJurisdiction {
  // Step 1: Normalize inputs
  const rawState = (geoData.state || '').toLowerCase();
  const rawDistrict = (geoData.district || '').toLowerCase();
  const searchTerms = [
    geoData.suburb || '',
    geoData.neighbourhood || '',
    geoData.road || '',
    geoData.postcode || '',
    geoData.displayName || ''
  ].join(' ').toLowerCase();

  // Find candidate State in Registry
  let matchedState = GAZETTE_JURISDICTION_REGISTRY.find(
    s => rawState.includes(s.stateName.toLowerCase()) || s.stateName.toLowerCase().includes(rawState)
  );
  if (!matchedState) {
    matchedState = GAZETTE_JURISDICTION_REGISTRY[0]; // MP Default
  }

  // Find candidate District in State
  let matchedDistrict = matchedState.districts.find(
    d => rawDistrict.includes(d.districtName.toLowerCase()) || d.districtName.toLowerCase().includes(rawDistrict)
  );
  if (!matchedDistrict) {
    matchedDistrict = matchedState.districts[0]; // Default District
  }

  // Step 2: TIER 1 - Gazette Master Dictionary Match (Locality / Postal code)
  let resolvedZone: ZoneDefinition | null = null;
  let matchType: ResolvedJurisdiction['matchType'] = 'GAZETTE_MATCH';

  for (const zone of matchedDistrict.zones) {
    // Check postcodes
    const hasPostcodeMatch = zone.postcodes.some(p => searchTerms.includes(p));
    // Check localities
    const hasLocalityMatch = zone.localities.some(loc => searchTerms.includes(loc.toLowerCase()));

    if (hasPostcodeMatch || hasLocalityMatch) {
      resolvedZone = zone;
      matchType = 'GAZETTE_MATCH';
      break;
    }
  }

  // Step 3: TIER 2 - Proximity Centroid Match (Closest Circle Office)
  if (!resolvedZone) {
    let minDistance = Infinity;
    for (const zone of matchedDistrict.zones) {
      const dist = calculateHaversineDistanceKm(coords.lat, coords.lng, zone.centroid.lat, zone.centroid.lng);
      if (dist < minDistance) {
        minDistance = dist;
        resolvedZone = zone;
      }
    }
    matchType = 'PROXIMITY_MATCH';
  }

  // Fallback guard
  if (!resolvedZone) {
    resolvedZone = matchedDistrict.zones[0];
    matchType = 'OFFICER_DEFAULT';
  }

  const distanceToOffice = calculateHaversineDistanceKm(
    coords.lat,
    coords.lng,
    resolvedZone.centroid.lat,
    resolvedZone.centroid.lng
  );

  // Step 4: TIER 3 - Officer Statutory Jurisdiction Cross-Check
  const assigned = officerAssignedZone ? officerAssignedZone.trim().toLowerCase() : '';
  const resolved = resolvedZone.zoneName.toLowerCase();
  const isWithinOfficerJurisdiction = !assigned || resolved.includes(assigned) || assigned.includes(resolved);

  let statusBadge: ResolvedJurisdiction['statusBadge'];
  if (isWithinOfficerJurisdiction) {
    statusBadge = {
      textHi: 'कार्यक्षेत्र सत्यापित • अधिकृत मंडल',
      textEn: `Verified In Jurisdiction (${resolvedZone.zoneName.split('—')[0].trim()})`,
      type: 'success'
    };
  } else {
    statusBadge = {
      textHi: 'अन्य कार्यक्षेत्र • विशेष/संयुक्त निरीक्षण',
      textEn: `Cross-Zone Alert: Standing in ${resolvedZone.zoneName.split('—')[0].trim()}`,
      type: 'warning'
    };
  }

  const market = geoData.road 
    ? `${geoData.road}, ${geoData.suburb || resolvedZone.localities[0]}`
    : resolvedZone.defaultMarket;

  const locationAddress = geoData.displayName 
    ? geoData.displayName.split(',').slice(0, 3).join(', ')
    : `${market}, ${matchedDistrict.districtName}, ${matchedState.stateName}`;

  return {
    state: matchedState.stateName,
    district: matchedDistrict.districtName,
    zone: resolvedZone.zoneName,
    marketName: market,
    locationAddress,
    gpsCoordinates: coords,
    matchType: isWithinOfficerJurisdiction ? matchType : 'CROSS_ZONE_WARNING',
    distanceToCircleOfficeKm: distanceToOffice,
    isWithinOfficerJurisdiction,
    statusBadge
  };
}
