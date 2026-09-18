import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import {
  FileCheck, PlusCircle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Package, AlertTriangle, ShieldCheck, Loader2
} from 'lucide-react';
import { fetchApi } from '../services/api';

interface Declaration {
  id: string;
  field: string;
  rawValue: string;
  confidence: number;
}

interface RuleResult {
  id: string;
  ruleCode: string;
  ruleTitle: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  severity: string;
  message: string;
}

interface Product {
  id: string;
  productName: string;
  brand: string;
  complianceStatus: 'PASS' | 'FAIL' | 'PENDING';
  violationsCount: number;
  declarations: Declaration[];
  ruleResults: RuleResult[];
  createdAt: string;
}

interface Inspection {
  id: string;
  inspectionNumber: string;
  shopName: string;
  marketName: string;
  inspectorName: string;
  startedAt: string;
  products: Product[];
}

const FIELD_LABELS: Record<string, string> = {
  PRODUCT_NAME: 'Product Name',
  MRP: 'MRP',
  NET_QUANTITY: 'Net Quantity',
  MFG_DATE: 'Mfg. Date',
  EXPIRY_DATE: 'Expiry Date',
  MANUFACTURER: 'Manufacturer',
  ADDRESS: 'Address',
  COUNTRY_OF_ORIGIN: 'Country of Origin',
};

const ProductAccordionItem: React.FC<{
  product: Product;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ product, index, isOpen, onToggle }) => {
  const isPass = product.complianceStatus === 'PASS';
  const failedRules = product.ruleResults?.filter(r => r.status === 'FAIL') ?? [];

  return (
    <div
      className={`gov-card transition-colors ${
        isPass ? 'border-base-300 hover:border-success/50' : 'border-error/40 hover:border-error/70'
      }`}
    >
      {/* ── Accordion Header ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-base-200/70"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0 ${
              isPass ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy-900 truncate">{product.productName}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {product.brand && product.brand !== 'Unknown' ? product.brand + ' • ' : ''}
              {product.violationsCount > 0
                ? `${product.violationsCount} violation${product.violationsCount > 1 ? 's' : ''}`
                : 'No violations detected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPass ? (
            <div className="badge badge-success badge-sm font-semibold gap-1 text-[10px]">
              <CheckCircle className="w-3 h-3" /> PASS
            </div>
          ) : (
            <div className="badge badge-error badge-sm font-semibold gap-1 text-[10px] text-white">
              <XCircle className="w-3 h-3" /> FAIL
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-base-content/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-base-content/50" />
          )}
        </div>
      </button>

      {/* ── Accordion Body ── */}
      {isOpen && (
        <div className="border-t border-base-300 p-4 space-y-3 bg-base-200/40">
          {/* Declarations */}
          {product.declarations?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                OCR Declarations ({product.declarations.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.declarations.map(d => (
                  <div
                    key={d.id}
                    className="p-2 bg-white border border-base-300 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {FIELD_LABELS[d.field] || d.field}
                    </span>
                    <span className="font-semibold text-navy-900 text-right truncate max-w-[150px]">
                      {d.rawValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed rules list */}
          {failedRules.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase text-error tracking-wider">
                Legal Violations ({failedRules.length})
              </p>
              <div className="space-y-1.5">
                {failedRules.map(r => (
                  <div key={r.id} className="p-2.5 bg-error/10 border border-error/30 rounded-xl space-y-0.5">
                    <p className="text-xs font-semibold text-error flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {r.ruleTitle}
                    </p>
                    <p className="text-[10px] text-base-content/70 font-medium pl-5">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All rules passed */}
          {failedRules.length === 0 && product.ruleResults?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-success font-semibold">
              <ShieldCheck className="w-4 h-4 text-success" />
              All Legal Metrology compliance checks passed
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SessionSummary: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'insp_001' } = useParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchApi<Inspection>(`/inspections/${id}`)
      .then(data => setInspection(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const products: Product[] = inspection?.products ?? [];

  const totalProducts = products.length;
  const compliantCount = products.filter(p => p.complianceStatus === 'PASS').length;
  const nonCompliantCount = products.filter(p => p.complianceStatus === 'FAIL').length;
  const totalViolations = products.reduce((sum, p) => sum + (p.violationsCount ?? 0), 0);
  const complianceRate = totalProducts > 0 ? Math.round((compliantCount / totalProducts) * 100) : 0;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="gov-page text-base-content pb-24">
      <Header title="सत्र सारांश • Session Summary" />

      <div className="max-w-xl mx-auto p-4 md:p-6 space-y-4">
        {/* ── Session Info Card ── */}
        <div className="gov-card">
          <div className="card-body p-4 sm:p-5 flex flex-row items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                INSPECTION SESSION
              </span>
              <p className="font-mono font-semibold text-orange-700 text-sm truncate mt-0.5">
                {inspection?.inspectionNumber || id}
              </p>
              <p className="text-xs text-navy-900 font-semibold truncate mt-0.5">
                {inspection?.shopName || 'Sharma General Store'}
              </p>
              {inspection?.startedAt && (
                <p className="text-[10px] text-base-content/50 font-medium mt-0.5">
                  {formatDate(inspection.startedAt)}
                </p>
              )}
            </div>
            <div className="badge badge-warning badge-sm font-semibold text-[9px] uppercase shrink-0">
              {inspection?.inspectorName?.split('(')[1]?.replace(')', '') || 'LM-MP-0421'}
            </div>
          </div>
        </div>

        {/* ── DaisyUI Stats Grid ── */}
        <div className="stats stats-horizontal bg-white border border-base-300 w-full text-center">
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-semibold text-base-content/60">कुल</div>
            <div className="stat-value text-base sm:text-xl font-semibold text-base-content">
              {loading ? '–' : totalProducts}
            </div>
            <div className="stat-desc text-[9px] font-bold">Total</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-semibold text-success">सही</div>
            <div className="stat-value text-base sm:text-xl font-semibold text-success">
              {loading ? '–' : compliantCount}
            </div>
            <div className="stat-desc text-[9px] font-bold text-success">Pass</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-semibold text-error">उल्लंघन</div>
            <div className="stat-value text-base sm:text-xl font-semibold text-error">
              {loading ? '–' : nonCompliantCount}
            </div>
            <div className="stat-desc text-[9px] font-bold text-error">Fail</div>
          </div>
          <div className="stat py-2.5 px-2">
            <div className="stat-title text-[10px] uppercase font-semibold text-orange-700">दोष</div>
            <div className="stat-value text-base sm:text-xl font-semibold text-orange-700">
              {loading ? '–' : totalViolations}
            </div>
            <div className="stat-desc text-[9px] font-bold text-orange-700">Issues</div>
          </div>
        </div>

        {/* Compliance Progress Bar Card */}
        {!loading && totalProducts > 0 && (
          <div className="gov-card p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Compliance Rate</span>
              <span className={complianceRate >= 70 ? 'text-success' : 'text-error'}>
                {complianceRate}%
              </span>
            </div>
            <progress
              className={`progress w-full h-2.5 ${
                complianceRate >= 70 ? 'progress-success' : complianceRate >= 40 ? 'progress-warning' : 'progress-error'
              }`}
              value={complianceRate}
              max="100"
            />
          </div>
        )}

        {/* ── Products Accordion List ── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1 mb-1">
            <h3 className="text-xs font-semibold text-navy-900 uppercase tracking-wider">
              स्कैन किए गए उत्पाद • Products ({products.length})
            </h3>
            {!loading && totalProducts > 0 && (
              <button
                onClick={() => setOpenIndex(null)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                समीक्षा समेटें • Collapse All
              </button>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-base-content/50">
              <Loader2 className="w-6 h-6 animate-spin text-orange-700" />
              <span className="text-xs font-bold">Loading products…</span>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="gov-card p-8 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto opacity-40 text-orange-700" />
              <p className="text-xs font-semibold">No products scanned yet in this session</p>
            </div>
          )}

          {!loading && products.map((product, idx) => (
            <ProductAccordionItem
              key={product.id}
              product={product}
              index={idx}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>

        {/* ── Rule 32 Notice Alert ── */}
        {!loading && nonCompliantCount > 0 && (
          <div className="alert alert-warning text-xs p-3.5 font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">{nonCompliantCount} non-compliant package(s) detected</p>
              <p className="text-[10px] font-medium opacity-90">Notice under Rule 32 Legal Metrology Rules required</p>
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate(`/inspector/inspections/${id}/report`)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-700/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span>रिपोर्ट पूर्वावलोकन • Preview Legal Report</span>
          </button>

          <button
            onClick={() => navigate(`/inspector/inspections/${id}/scan`)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>और उत्पाद स्कैन करें • Add More Products</span>
          </button>
        </div>
      </div>
    </div>
  );
};
