import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import {
  BookOpen, Scale, ExternalLink, ShieldCheck, AlertTriangle, FileText,
  CheckCircle2, HelpCircle, Phone, Building2, Search, ChevronRight,
  Info, Gavel, ArrowLeft, Download, Copy, Check, Sparkles, MessageSquare
} from 'lucide-react';

interface LawItem {
  id: string;
  category: 'ACT_2009' | 'LMPC_RULES' | 'PENALTIES' | 'CONSUMER';
  sectionCode: string;
  actTitle: string;
  titleHi: string;
  titleEn: string;
  summaryHi: string;
  summaryEn: string;
  details: string[];
  penaltyOrAction?: string;
  officialRefUrl: string;
  officialRefText: string;
  tag: string;
  tagColor: string;
}

const OFFICIAL_LINKS = [
  {
    nameHi: 'उपभोक्ता मामले विभाग',
    nameEn: 'Department of Consumer Affairs (DOCA)',
    desc: 'Ministry of Consumer Affairs, Food & Public Distribution, GOI',
    url: 'https://consumeraffairs.nic.in',
    badge: 'Official Portal'
  },
  {
    nameHi: 'विधिक माप विज्ञान प्रभाग (अधिनियम व नियम)',
    nameEn: 'Legal Metrology Division — Acts & Rules',
    desc: 'Official statutory gazettes, notifications and amendments',
    url: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    badge: 'Acts & Rules'
  },
  {
    nameHi: 'राष्ट्रीय उपभोक्ता हेल्पलाइन',
    nameEn: 'National Consumer Helpline (NCH)',
    desc: 'Toll-free 1915 grievance redressal portal (Jago Grahak Jago)',
    url: 'https://consumerhelpline.gov.in',
    badge: 'Helpline 1915'
  },
  {
    nameHi: 'भारत का ई-राजपत्र',
    nameEn: 'The Gazette of India (e-Gazette)',
    desc: 'Official digital publications of Central statutory notifications',
    url: 'https://egazette.gov.in',
    badge: 'e-Gazette'
  }
];

const STATUTORY_ITEMS: LawItem[] = [
  {
    id: 'rule-6-1',
    category: 'LMPC_RULES',
    sectionCode: 'Rule 6(1)',
    actTitle: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    titleHi: 'पैकेज्ड वस्तुओं पर 8 अनिवार्य घोषणाएँ',
    titleEn: 'Eight Mandatory Declarations on Pre-packaged Commodities',
    summaryHi: 'प्रत्येक पूर्व-पैक वस्तु पर निर्माता/पैकर विवरण, उत्पाद नाम, शुद्ध मात्रा, विनिर्माण तिथि, एमआरपी और उपभोक्ता संपर्क का स्पष्ट अंकन अनिवार्य है।',
    summaryEn: 'Every pre-packaged commodity sold in India must visibly and legibly declare 8 statutory particulars without ambiguity.',
    details: [
      '6(1)(a): Name & Complete Postal Address of Manufacturer / Packer / Importer (premises, city, PIN code).',
      '6(1)(b): Generic or Common Name of the commodity packed inside.',
      '6(1)(c): Net Quantity in standard SI Metric Units (g, kg, ml, l, m, or numerical count N).',
      '6(1)(d): Month & Year of Manufacture, Packing, or Import.',
      '6(1)(e): Maximum Retail Price (MRP) inclusive of all taxes ("MRP ₹ xx.xx incl. of all taxes").',
      '6(1)(f): Consumer Grievance Contact (Name, Office Address, Helpline Phone, Email).',
      '6(1)(g): Unit Sale Price (USP) for items sold in non-standard units (e.g., ₹ per g or ₹ per ml).',
      '6(1)(h): Country of Origin for imported pre-packaged goods.'
    ],
    penaltyOrAction: 'Non-declaration is an offence under Section 36(1). Penalty up to ₹25,000 for 1st offence and seizure under Section 15.',
    officialRefUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    officialRefText: 'Rule 6(1) of LMPC Rules, 2011',
    tag: 'Mandatory Labels',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'rule-18-2',
    category: 'LMPC_RULES',
    sectionCode: 'Rule 18(2)',
    actTitle: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    titleHi: 'एमआरपी पर अतिरिक्त स्टीकर लगाने और अधिक मूल्य वसूली पर रोक',
    titleEn: 'Prohibition of Over-Stickering & Overcharging Above MRP',
    summaryHi: 'निर्माता द्वारा मुद्रित एमआरपी से अधिक वसूली करना या मूल्य छिपाने हेतु नया स्टीकर चिपकाना गैरकानूनी व दंडनीय अपराध है।',
    summaryEn: 'No wholesale dealer, retail dealer or other person shall alter, smudge, obliterate or stick fresh price stickers over printed MRP.',
    details: [
      'Strict ban on dual pricing / dual MRP for identical products in different outlets (e.g. cinema halls, airports, malls).',
      'Over-charging even 1 rupee above the printed MRP constitutes statutory violation.',
      'Shopkeepers cannot charge additional cooling, refrigeration or handling charges over MRP.',
      'Any over-stickering must have prior statutory exemption or Gazette notification.'
    ],
    penaltyOrAction: 'Fine up to ₹25,000 under Section 36(1). Compounding deposit or summary seizure of altered stocks.',
    officialRefUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    officialRefText: 'Rule 18 of LMPC Rules, 2011',
    tag: 'Pricing Protection',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'sec-15',
    category: 'ACT_2009',
    sectionCode: 'Section 15',
    actTitle: 'The Legal Metrology Act, 2009 (Act 1 of 2010)',
    titleHi: 'निरीक्षण, तलाशी, जब्ती एवं प्रवेश का वैधानिक अधिकार',
    titleEn: 'Power of Legal Metrology Officers to Inspect, Search & Seize',
    summaryHi: 'विधिक माप विज्ञान अधिकारी किसी भी व्यावसायिक परिसर में प्रवेश कर वजन, माप और पैकेटों का निरीक्षण व जब्ती कर सकते हैं।',
    summaryEn: 'Authorised officers hold statutory authority to inspect premises, examine packaged commodities, and effect on-site seizures.',
    details: [
      'Right to enter any premises at all reasonable times where weights, measures, or pre-packaged goods are manufactured or sold.',
      'Power to seize non-compliant commodities along with record ledgers, cash memos, and packaging material under Form IV.',
      'Authority to draw legal test samples for verification in certified testing laboratories.',
      'Obstruction of a Legal Metrology Officer in discharge of duty is a separate punishable offence under Section 44.'
    ],
    penaltyOrAction: 'Seizure memo Form IV issued on-spot. Seized goods stored in custody pending compounding or court proceeding.',
    officialRefUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    officialRefText: 'Section 15 of Legal Metrology Act, 2009',
    tag: 'Officer Authority',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'sec-36',
    category: 'PENALTIES',
    sectionCode: 'Section 36(1)',
    actTitle: 'The Legal Metrology Act, 2009 (Act 1 of 2010)',
    titleHi: 'अमानक पैकेज निर्माण एवं बिक्री पर वैधानिक अर्थदंड',
    titleEn: 'Statutory Penalties for Non-Standard Pre-packaged Commodities',
    summaryHi: 'नियमों के उल्लंघन पर ₹25,000 से लेकर ₹1,00,000 तक का जुर्माना और पुनरावृत्ति पर 1 वर्ष तक का कारावास हो सकता है।',
    summaryEn: 'Prescribes graduated monetary penalties and imprisonment for selling, distributing or manufacturing non-compliant packages.',
    details: [
      'First Offence: Penalty extending up to ₹25,000 per violation.',
      'Second Offence: Penalty extending up to ₹50,000.',
      'Subsequent Offences: Fine up to ₹1,00,000 or imprisonment for a term which may extend to one year, or both.',
      'Liability extends jointly to manufacturer, packer, distributor, and retailer selling un-declared packages.'
    ],
    penaltyOrAction: 'Fine of ₹25,000 to ₹1,00,000 and possible 1-year jail term on subsequent convictions.',
    officialRefUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    officialRefText: 'Section 36 of Legal Metrology Act, 2009',
    tag: 'Penalties & Fines',
    tagColor: 'bg-red-50 text-red-700 border-red-200'
  },
  {
    id: 'sec-48',
    category: 'PENALTIES',
    sectionCode: 'Section 48',
    actTitle: 'The Legal Metrology Act, 2009 (Act 1 of 2010)',
    titleHi: 'अपराधों का शमन (Spot Compounding of Offences)',
    titleEn: 'Statutory Compounding of Offences Without Court Trial',
    summaryHi: 'व्यापारी अदालत के मुकदमे से बचने के लिए निर्धारित वैधानिक शुल्क जमा कर ऑन-स्पॉट शमन का विकल्प चुन सकते हैं।',
    summaryEn: 'Provides facility for first and second time offenders to compound statutory contraventions by paying authorized fees.',
    details: [
      'Compounding fee is deposited within 14 days of statutory notice.',
      'Spot rate: Statutory deposit typically ₹5,000 to ₹25,000 depending on nature of defect.',
      'Once compounded, no prosecution shall be instituted or continued against the offender for that specific instance.',
      'Compounding is not permissible if an identical offence has been compounded within preceding three years.'
    ],
    penaltyOrAction: 'Statutory compounding deposit. Seizure is vacated upon payment and regularisation of package declarations.',
    officialRefUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    officialRefText: 'Section 48 of Legal Metrology Act, 2009',
    tag: 'Compounding',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'consumer-rights',
    category: 'CONSUMER',
    sectionCode: 'Citizen Charter',
    actTitle: 'Consumer Protection Act, 2019 & LM Act, 2009',
    titleHi: 'जागो ग्राहक जागो • उपभोक्ताओं के कानूनी अधिकार',
    titleEn: 'Jago Grahak Jago — Citizen Consumer Rights & Redressal',
    summaryHi: 'उपभोक्ताओं को शुद्ध माप, सही एमआरपी, समाप्ति तिथि और शिकायत निवारण का पूरा कानूनी अधिकार प्राप्त है।',
    summaryEn: 'Every Indian consumer possesses legal entitlements against short-weighment, deceptive packaging, and overpricing.',
    details: [
      'Right to accurate Net Quantity: Every scale in a shop must have valid government verification stamping.',
      'Right to inspect weight: Consumer may demand shopkeeper to weigh commodity on verified scales before purchase.',
      'Right against overcharging: Instant lodging of complaint via National Consumer Helpline 1915.',
      'Right to Unit Sale Price: Compare true cost per 100g / 1kg between competing pack sizes.'
    ],
    penaltyOrAction: 'File grievance on consumerhelpline.gov.in or dial 1915 (Toll Free). CCPA takes suo-motu action against errant brands.',
    officialRefUrl: 'https://consumerhelpline.gov.in',
    officialRefText: 'National Consumer Helpline Portal',
    tag: 'Citizen Rights',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200'
  }
];

const FAQS = [
  {
    qHi: 'क्या दुकानदार एमआरपी से अधिक ठंडा करने का शुल्क (Chilling Charge) ले सकता है?',
    qEn: 'Can a shopkeeper charge extra for cold storage or refrigeration over MRP?',
    ansHi: 'बिल्कुल नहीं। विधिक माप विज्ञान नियम 18(2) और उपभोक्ता संरक्षण अधिनियम के तहत एमआरपी में सभी कर और प्रभार शामिल होते हैं। फ्रिजिंग के नाम पर ₹1 भी अतिरिक्त लेना गैरकानूनी है।',
    ansEn: 'Strictly prohibited. Under Rule 18(2) and CCPA directives, MRP is all-inclusive. Charging any extra refrigeration, cooling, or handling fee is an explicit punishable statutory violation.'
  },
  {
    qHi: 'यदि पैकेट पर निर्माता का पूरा पता या पिन कोड न हो तो क्या करें?',
    qEn: 'What if a pre-packaged product lacks complete manufacturer address or PIN code?',
    ansHi: 'यह नियम 6(1)(a) का सीधा उल्लंघन है। विधिक माप विज्ञान अधिनियम की धारा 36(1) के अंतर्गत ऐसे सभी उत्पाद जब्त किए जा सकते हैं तथा विक्रेता व निर्माता दोनों पर ₹25,000 तक का जुर्माना लगाया जा सकता है।',
    ansEn: 'This is a clear violation of Rule 6(1)(a). The product is liable for immediate on-site seizure under Section 15, and the manufacturer/packer faces statutory fines up to ₹25,000.'
  },
  {
    qHi: 'उपभोक्ता नकली या गलत वजन की शिकायत कहाँ दर्ज करा सकते हैं?',
    qEn: 'Where can a citizen report weight discrepancies or overpricing?',
    ansHi: 'राष्ट्रीय उपभोक्ता हेल्पलाइन के टोल-फ्री नंबर 1915 पर कॉल करें या WhatsApp नंबर 8800001915 पर शिकायत भेजें। आप consumerhelpline.gov.in पर भी ऑनलाइन शिकायत दर्ज कर सकते हैं।',
    ansEn: 'Dial toll-free 1915 or WhatsApp to 8800001915. Complaints can also be registered 24/7 on consumerhelpline.gov.in with photo proof.'
  }
];

export const LawAwareness: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LMPC_RULES' | 'ACT_2009' | 'PENALTIES' | 'CONSUMER'>('ALL');
  const [copiedLink, setCopiedLink] = useState(false);

  const filteredLaws = useMemo(() => {
    return STATUTORY_ITEMS.filter(item => {
      const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.sectionCode.toLowerCase().includes(q) ||
        item.titleHi.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.summaryHi.toLowerCase().includes(q) ||
        item.summaryEn.toLowerCase().includes(q) ||
        item.details.some(d => d.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="gov-page text-base-content pb-24">
      {/* Header */}
      <Header title="विधिक नियम व जागरूकता • Acts & Rules" showBack={true} />

      {/* Main Container */}
      <div className="max-w-xl lg:max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* ── TOP STATUTORY AUTHORITY HERO BANNER ── */}
        <div className="gov-card overflow-hidden bg-navy-950 text-white border border-amber-500/30 shadow-md">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                विधिक माप विज्ञान नियम व अधिनियम • Acts & Rules
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Legal Metrology Act, 2009 & LMPC Rules, 2011 Reference Guide
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:1915"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>हेल्पलाइन 1915</span>
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
          <div className="gov-tricolor" />
        </div>

        {/* ── OFFICIAL GOVERNMENT WEBSITES DIRECT ACCESS ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>आधिकारिक सरकारी पोर्टल • Official Government Links</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Verified .gov.in / .nic.in</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OFFICIAL_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-amber-400 transition-all shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {link.badge}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                  </div>
                  <h4 className="text-xs font-bold text-navy-950 group-hover:text-amber-700 transition-colors leading-snug">
                    {link.nameHi}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    {link.nameEn}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2">
                    {link.desc}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400 truncate max-w-[180px]">
                    {link.url.replace(/^https?:\/\//, '')}
                  </span>
                  <span className="font-bold text-amber-600 group-hover:underline flex items-center gap-0.5">
                    <span>Visit Portal</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── SEARCH & CATEGORY FILTER ── */}
        <div className="space-y-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खोजें: धारा 15, नियम 6(1), एमआरपी, पेनल्टी, जब्ती या अधिकार..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'ALL', label: 'सभी प्रावधान • All Laws' },
              { id: 'LMPC_RULES', label: 'पैकेज्ड रूल्स 2011 (LMPC)' },
              { id: 'ACT_2009', label: 'विधिक माप अधिनियम 2009' },
              { id: 'PENALTIES', label: 'दंड व शमन (Penalties)' },
              { id: 'CONSUMER', label: 'उपभोक्ता अधिकार (Rights)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition-all ${
                  activeCategory === tab.id
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── STATUTORY LAWS & RULES CARDS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-navy-900" />
              <span>वैधानिक प्रावधान एवं नियम विवरण ({filteredLaws.length})</span>
            </h3>
            {searchQuery && (
              <span className="text-[11px] text-amber-700 font-semibold">
                "{searchQuery}" के परिणाम
              </span>
            )}
          </div>

          {filteredLaws.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2 shadow-xs">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">कोई प्रावधान नहीं मिला</h4>
              <p className="text-xs text-slate-500">
                "{searchQuery}" से संबंधित कोई धारा या नियम नहीं मिला। कृपया दूसरा कीवर्ड खोजें।
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs shadow-sm mt-2 transition-all cursor-pointer"
              >
                फ़िल्टर रीसेट करें • Clear Filter
              </button>
            </div>
          ) : (
            filteredLaws.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-navy-900 text-white">
                        {item.sectionCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-navy-950 mt-1">
                      {item.titleHi}
                    </h4>
                    <p className="text-xs font-semibold text-slate-700">
                      {item.titleEn}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {item.actTitle}
                    </p>
                  </div>

                  <a
                    href={item.officialRefUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 transition"
                    title={`View official legal text on ${item.officialRefText}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.summaryHi}
                </p>

                {/* Bulleted Details */}
                <div className="space-y-1 pt-1">
                  <ul className="space-y-1 text-xs text-slate-600">
                    {item.details.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Penalty & Action Callout */}
                {item.penaltyOrAction && (
                  <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">वैधानिक कार्रवाई एवं दंड: </span>
                      <span>{item.penaltyOrAction}</span>
                    </div>
                  </div>
                )}

                {/* Footer Link */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    आधिकारिक स्रोत: {item.officialRefText}
                  </span>
                  <a
                    href={item.officialRefUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <span>मूल राजपत्र देखें</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FREQUENTLY ASKED QUESTIONS (FAQ) ── */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2 px-1">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              अक्सर पूछे जाने वाले वैधानिक प्रश्न • FAQ & Clarifications
            </h3>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, fIdx) => (
              <div key={fIdx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-navy-950 flex items-start gap-2">
                    <span className="text-amber-600 font-mono font-extrabold">Q{fIdx + 1}.</span>
                    <span>{faq.qHi}</span>
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 pl-5">
                    {faq.qEn}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 pl-5 border-l-2 border-amber-500 space-y-1">
                  <p className="leading-relaxed font-medium text-slate-800">
                    {faq.ansHi}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {faq.ansEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CITIZEN COMPLAINT & HELPLINE CARD ── */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-base shadow-sm shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy-950">
                उपभोक्ता शिकायत निवारण सेल • Consumer Grievance Desk
              </h4>
              <p className="text-xs text-slate-600">
                उपभोक्ता मामलों के विभाग (GOI) द्वारा 24x7 संचालित
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            यदि कोई दुकानदार या ई-कॉमर्स विक्रेता विधिक माप विज्ञान नियमों का उल्लंघन करता है, कम तौलता है अथवा एमआरपी से अधिक शुल्क वसूलता है, तो नागरिक सीधे केंद्रीय उपभोक्ता पोर्टल पर शिकायत दर्ज करा सकते हैं।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <a
              href="tel:1915"
              className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition flex items-center justify-between shadow-xs font-semibold text-navy-900"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-[10px] text-slate-500">Toll-Free Helpline</div>
                  <div className="font-mono font-bold text-sm">1915</div>
                </div>
              </div>
              <span className="btn btn-xs bg-emerald-100 text-emerald-800 border-none font-bold">Call</span>
            </a>

            <a
              href="https://consumerhelpline.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 transition flex items-center justify-between shadow-xs font-semibold text-navy-900"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="text-[10px] text-slate-500">Online Redressal</div>
                  <div className="font-bold text-xs">consumerhelpline.gov.in</div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Bottom Back / Dashboard Button */}
        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/inspector/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all cursor-pointer active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-amber-400" />
            <span>कार्यक्षेत्र डैशबोर्ड पर लौटें • Return to Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  );
};
