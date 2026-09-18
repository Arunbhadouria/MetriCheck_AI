export type Role = 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN';

export type InspectionStatus = 'DRAFT' | 'PROCESSING' | 'REVIEW' | 'FINALIZED' | 'ARCHIVED';
export type ComplianceStatus = 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'NOT_APPLICABLE' | 'NOT_DETECTABLE';
export type RuleSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SyncStatus = 'LOCAL_ONLY' | 'QUEUED' | 'UPLOADING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
export type InspectionType = 'Routine' | 'Complaint' | 'Special';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  jurisdictionState?: string;
  jurisdictionDistrict?: string;
  jurisdictionZone?: string;
  mobileNumber?: string;
  passwordHash?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  inspectionNumber: string; // e.g. LM/MP/IND/2026/00987
  inspectorId: string;
  inspectorName?: string;
  status: InspectionStatus;
  inspectionType: InspectionType;
  jurisdictionState: string;
  jurisdictionDistrict: string;
  jurisdictionZone: string;
  marketName: string;
  shopName: string;
  shopkeeperName: string;
  licenseNumber: string;
  locationAddress: string;
  gpsCoordinates?: { lat: number; lng: number; accuracy: number };
  consumerComplaintsCount?: number;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface Product {
  id: string;
  inspectionId: string;
  productName: string;
  brand: string;
  category: string;
  sku?: string;
  barcode?: string;
  countryOfOrigin?: string;
  complianceStatus: ComplianceStatus;
  violationsCount: number;
  evidencePhotoCount: number;
  declarations?: Declaration[];
  ruleResults?: RuleResult[];
  manualObservations?: ManualObservation[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageAsset {
  id: string;
  inspectionId: string;
  productId?: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  sha256?: string;
  captureType: 'FRONT' | 'BACK' | 'SIDE' | 'TOP' | 'BOTTOM' | 'EVIDENCE';
  sequence: number;
  previewUrl?: string;
  createdAt: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRBlock {
  id: string;
  imageAssetId: string;
  text: string;
  normalizedText: string;
  confidence: number;
  bbox: BoundingBox;
  language: string;
  provider: string;
  providerVersion: string;
}

export type DeclarationField = 
  | 'MANUFACTURER'
  | 'ADDRESS'
  | 'PRODUCT_NAME'
  | 'NET_QUANTITY'
  | 'MRP'
  | 'MFG_DATE'
  | 'EXPIRY_DATE'
  | 'BATCH_NUMBER'
  | 'CONSUMER_CARE'
  | 'COUNTRY_OF_ORIGIN'
  | 'UNIT_SALE_PRICE';

export interface Declaration {
  id: string;
  productId: string;
  field: DeclarationField;
  rawValue: string;
  normalizedValue: Record<string, unknown>;
  confidence: number;
  sourceType: 'AI_OCR' | 'INSPECTOR_MANUAL' | 'INSPECTOR_VERIFIED';
  sourceOcrBlockId?: string;
  sourceImageAssetId?: string;
  bbox?: BoundingBox;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RuleSet {
  id: string;
  name: string;
  version: string; // e.g. 2026.01
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'DRAFT' | 'SUPERSEDED';
  checksum: string;
}

export interface Rule {
  id: string;
  ruleSetId: string;
  code: string;
  title: string;
  description: string;
  sourceReference: string;
  applicability: string;
  severity: RuleSeverity;
  enabled: boolean;
}

export interface RuleResult {
  id: string;
  inspectionId: string;
  productId: string;
  ruleId: string;
  ruleCode: string;
  ruleTitle: string;
  sourceReference: string;
  status: ComplianceStatus;
  severity: RuleSeverity;
  message: string;
  observedValue?: unknown;
  expectedValue?: unknown;
  confidence?: number;
  evidenceIds: string[];
  finalInspectorStatus?: ComplianceStatus;
  inspectorNote?: string;
  createdAt: string;
}

export interface ManualObservation {
  id: string;
  productId: string;
  category: 'Label issue' | 'Weight discrepancy' | 'Price issue' | 'Date issue' | 'Other';
  severity: 'Minor' | 'Major' | 'Critical';
  detailedNote: string;
  hasAudioNote?: boolean;
  photoIds?: string[];
  createdAt: string;
}

export interface Evidence {
  id: string;
  inspectionId: string;
  ruleResultId?: string;
  productId?: string;
  imageAssetId: string;
  cropStorageKey?: string;
  cropUrl?: string;
  bbox?: BoundingBox;
  caption: string;
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  inspectionId: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'NOTICE_ISSUED' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  requestId?: string;
  createdAt: string;
}

export interface DashboardSummary {
  todayInspections: number;
  totalInspections: number;
  compliant: number;
  nonCompliant: number;
  reviewRequired: number;
  openCases: number;
  pendingSync: number;
  recentInspections: Inspection[];
}

export interface AnalysisJobResponse {
  analysisId: string;
  inspectionId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  productCount: number;
  ruleResultsCount: number;
  summary: {
    compliant: number;
    nonCompliant: number;
    reviewRequired: number;
  };
}
