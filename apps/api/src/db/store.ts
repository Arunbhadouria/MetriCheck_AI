import fs from 'fs';
import path from 'path';
import { 
  User, Inspection, Product, Declaration, RuleResult, Evidence, Case, AuditEvent, DashboardSummary, ImageAsset 
} from '@metricheck/shared-types';
import { RuleEngine } from '@metricheck/rule-engine';
import bcrypt from 'bcryptjs';

export const STATE_CODES: Record<string, string> = {
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Uttar Pradesh': 'UP',
  'Delhi': 'DL',
  'Gujarat': 'GJ',
  'Rajasthan': 'RJ',
  'Karnataka': 'KA',
  'Tamil Nadu': 'TN',
  'West Bengal': 'WB',
  'Bihar': 'BR',
  'Punjab': 'PB',
  'Haryana': 'HR',
  'Telangana': 'TS',
  'Andhra Pradesh': 'AP',
  'Kerala': 'KL',
  'Odisha': 'OD',
  'Assam': 'AS',
  'Jharkhand': 'JH',
  'Chhattisgarh': 'CG',
  'Uttarakhand': 'UK'
};

interface DBData {
  users: User[];
  inspections: Inspection[];
  products: Product[];
  declarations: Declaration[];
  ruleResults: RuleResult[];
  evidence: Evidence[];
  cases: Case[];
  auditEvents: AuditEvent[];
  assets: ImageAsset[];
}

const resolveStorageDir = (): string => {
  const rootAppStorage = path.resolve(process.cwd(), 'apps', 'api', 'storage');
  if (fs.existsSync(rootAppStorage)) {
    return rootAppStorage;
  }
  const cwdStorage = path.resolve(process.cwd(), 'storage');
  if (fs.existsSync(cwdStorage)) {
    return cwdStorage;
  }
  fs.mkdirSync(rootAppStorage, { recursive: true });
  return rootAppStorage;
};

const STORAGE_DIR = resolveStorageDir();
const DB_FILE = path.join(STORAGE_DIR, 'db.json');

const INITIAL_DATA: DBData = {
  users: [
    {
      id: 'usr_inspector_1',
      employeeId: 'LM-MP-0421',
      name: 'Amit Verma',
      email: 'inspector@demo.local',
      role: 'INSPECTOR',
      department: 'M.P. Legal Metrology Department',
      jurisdictionState: 'Madhya Pradesh',
      jurisdictionDistrict: 'Indore',
      jurisdictionZone: 'Zone 08 — Vijay Nagar',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr_admin_1',
      employeeId: 'ADMIN-001',
      name: 'System Admin',
      email: 'admin@demo.local',
      role: 'ADMIN',
      department: 'Department of Consumer Affairs',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  inspections: [
    {
      id: 'insp_001',
      inspectionNumber: 'LM/MP/IND/2026/00987',
      inspectorId: 'usr_inspector_1',
      inspectorName: 'Amit Verma (LM-MP-0421)',
      status: 'REVIEW',
      inspectionType: 'Routine',
      jurisdictionState: 'Madhya Pradesh',
      jurisdictionDistrict: 'Indore',
      jurisdictionZone: 'Zone 08 — Vijay Nagar',
      marketName: 'Malviya Nagar Market',
      shopName: 'Sharma General Store',
      shopkeeperName: 'Rajesh Sharma',
      licenseNumber: 'MP/LM/2024/8842',
      locationAddress: 'Shop 14, Malviya Nagar Market, Vijay Nagar, Indore, M.P.',
      gpsCoordinates: { lat: 22.7533, lng: 75.8937, accuracy: 8 },
      consumerComplaintsCount: 7,
      startedAt: '2026-09-06T08:18:00.000Z',
      syncStatus: 'SYNCED',
      createdAt: '2026-09-06T08:18:00.000Z',
      updatedAt: '2026-09-06T08:42:00.000Z'
    }
  ],
  products: [
    {
      id: 'prod_001',
      inspectionId: 'insp_001',
      productName: 'Annapurna Chilli Powder',
      brand: 'Annapurna',
      category: 'Packaged food',
      sku: 'ANN-8591-500G',
      barcode: '8901234567890',
      countryOfOrigin: 'India',
      complianceStatus: 'FAIL',
      violationsCount: 1,
      evidencePhotoCount: 3,
      createdAt: '2026-09-06T08:20:00.000Z',
      updatedAt: '2026-09-06T08:35:00.000Z'
    },
    {
      id: 'prod_002',
      inspectionId: 'insp_001',
      productName: 'Tata Salt 1 kg',
      brand: 'Tata',
      category: 'Packaged food',
      barcode: '8901058000012',
      countryOfOrigin: 'India',
      complianceStatus: 'PASS',
      violationsCount: 0,
      evidencePhotoCount: 2,
      createdAt: '2026-09-06T08:25:00.000Z',
      updatedAt: '2026-09-06T08:36:00.000Z'
    }
  ],
  declarations: [
    {
      id: 'decl_101',
      productId: 'prod_001',
      field: 'MRP',
      rawValue: 'MRP ₹52.00',
      normalizedValue: { amount: 52, currency: 'INR' },
      confidence: 0.96,
      sourceType: 'AI_OCR',
      verifiedBy: 'usr_inspector_1',
      verifiedAt: '2026-09-06T08:22:00.000Z'
    },
    {
      id: 'decl_102',
      productId: 'prod_001',
      field: 'NET_QUANTITY',
      rawValue: '500 g',
      normalizedValue: { value: 500, unit: 'g' },
      confidence: 0.97,
      sourceType: 'AI_OCR',
      verifiedBy: 'usr_inspector_1',
      verifiedAt: '2026-09-06T08:22:00.000Z'
    },
    {
      id: 'decl_103',
      productId: 'prod_001',
      field: 'MFG_DATE',
      rawValue: '02/08/2026',
      normalizedValue: { month: 8, year: 2026 },
      confidence: 0.95,
      sourceType: 'AI_OCR'
    },
    {
      id: 'decl_104',
      productId: 'prod_001',
      field: 'EXPIRY_DATE',
      rawValue: '01/02/2027',
      normalizedValue: { month: 2, year: 2027 },
      confidence: 0.95,
      sourceType: 'AI_OCR'
    },
    {
      id: 'decl_105',
      productId: 'prod_001',
      field: 'MANUFACTURER',
      rawValue: 'Annapurna Foods Pvt. Ltd.',
      normalizedValue: { name: 'Annapurna Foods Pvt. Ltd.' },
      confidence: 0.94,
      sourceType: 'AI_OCR'
    },
    {
      id: 'decl_106',
      productId: 'prod_001',
      field: 'ADDRESS',
      rawValue: 'Indore, Madhya Pradesh',
      normalizedValue: { address: 'Indore, Madhya Pradesh' },
      confidence: 0.82,
      sourceType: 'AI_OCR'
    }
  ],
  ruleResults: [
    {
      id: 'rr_101',
      inspectionId: 'insp_001',
      productId: 'prod_001',
      ruleId: 'rule_6_1_a',
      ruleCode: 'RULE-6-1-A',
      ruleTitle: 'Manufacturer / Packer Identity & Address',
      sourceReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)',
      status: 'FAIL',
      severity: 'HIGH',
      message: 'Manufacturer address incomplete on package label. Lacks full postal details, premises name and PIN code.',
      observedValue: 'Indore, Madhya Pradesh',
      expectedValue: 'Full premises address with City, State and PIN code',
      confidence: 0.82,
      evidenceIds: ['ev_101'],
      createdAt: '2026-09-06T08:23:00.000Z'
    }
  ],
  evidence: [
    {
      id: 'ev_101',
      inspectionId: 'insp_001',
      ruleResultId: 'rr_101',
      productId: 'prod_001',
      imageAssetId: 'img_101',
      caption: 'Manufacturer label crop showing incomplete address',
      createdAt: '2026-09-06T08:24:00.000Z'
    }
  ],
  cases: [
    {
      id: 'case_001',
      caseNumber: 'CASE-2026-00042',
      inspectionId: 'insp_001',
      status: 'OPEN',
      assignedTo: 'usr_inspector_1',
      priority: 'HIGH',
      notes: 'Issued notice under Rule 32 for incomplete manufacturer address.',
      createdAt: '2026-09-06T08:45:00.000Z',
      updatedAt: '2026-09-06T08:45:00.000Z'
    }
  ],
  auditEvents: [
    {
      id: 'aud_001',
      actorUserId: 'usr_inspector_1',
      actorName: 'Amit Verma',
      action: 'INSPECTION_CREATED',
      entityType: 'INSPECTION',
      entityId: 'insp_001',
      createdAt: '2026-09-06T08:18:00.000Z'
    }
  ],
  assets: []
};

export interface OtpChallenge {
  challengeId: string;
  userId: string;
  employeeId: string;
  otp: string;
  expiresAt: number;
  attemptsLeft: number;
  maskedPhone: string;
  maskedEmail: string;
  createdAt: number;
}

export class DBStore {
  private data: DBData;
  private otpChallenges: Map<string, OtpChallenge> = new Map();

  constructor() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.assets) {
          this.data.assets = [];
        }
      } catch (err) {
        this.data = INITIAL_DATA;
        this.save();
      }
    } else {
      this.data = INITIAL_DATA;
      this.save();
    }
  }

  private save(): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // ── OTP Challenges ────────────────────────────────────────────────────────
  public createOtpChallenge(user: User): {
    challengeId: string;
    otp: string;
    maskedPhone: string;
    maskedEmail: string;
    expiresInSeconds: number;
  } {
    // Invalidate any previous challenges for this officer
    for (const [id, ch] of this.otpChallenges.entries()) {
      if (ch.userId === user.id) {
        this.otpChallenges.delete(id);
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = `ch_otp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Mask phone e.g. +91 ••••••3210
    const rawPhone = user.mobileNumber || '9876543210';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const last4 = cleanPhone.slice(-4) || '3210';
    const maskedPhone = `+91 ••••••${last4}`;

    // Mask email e.g. a•••••@gmail.com
    const [local, domain] = (user.email || 'officer@lm.gov.in').split('@');
    const maskedLocal = local.length > 2 ? `${local[0]}••••${local.slice(-1)}` : `${local[0]}•••`;
    const maskedEmail = `${maskedLocal}@${domain || 'gov.in'}`;

    const challenge: OtpChallenge = {
      challengeId,
      userId: user.id,
      employeeId: user.employeeId,
      otp: code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attemptsLeft: 5,
      maskedPhone,
      maskedEmail,
      createdAt: Date.now()
    };

    this.otpChallenges.set(challengeId, challenge);

    return {
      challengeId,
      otp: code,
      maskedPhone,
      maskedEmail,
      expiresInSeconds: 300
    };
  }

  public verifyOtpChallenge(challengeId: string, inputOtp: string): {
    success: boolean;
    user?: User;
    error?: string;
    attemptsLeft?: number;
  } {
    const challenge = this.otpChallenges.get(challengeId);
    if (!challenge) {
      return {
        success: false,
        error: 'सत्यापन सत्र समाप्त या अमान्य है • Verification session expired or invalid. Please login again.'
      };
    }

    if (Date.now() > challenge.expiresAt) {
      this.otpChallenges.delete(challengeId);
      return {
        success: false,
        error: 'OTP की समय सीमा समाप्त हो गई है • OTP has expired. Please request a new code.'
      };
    }

    if (challenge.attemptsLeft <= 0) {
      this.otpChallenges.delete(challengeId);
      return {
        success: false,
        error: 'अधिकतम प्रयास सीमा पार हो गई • Maximum attempts exceeded. Please login again.',
        attemptsLeft: 0
      };
    }

    const cleanInput = (inputOtp || '').trim().replace(/\D/g, '');
    if (cleanInput !== challenge.otp) {
      challenge.attemptsLeft -= 1;
      if (challenge.attemptsLeft <= 0) {
        this.otpChallenges.delete(challengeId);
        return {
          success: false,
          error: 'गलत OTP। सुरक्षा कारणों से सत्र समाप्त कर दिया गया है • Incorrect OTP. Session locked for security.',
          attemptsLeft: 0
        };
      }
      return {
        success: false,
        error: `अमान्य OTP कोड। आपके पास ${challenge.attemptsLeft} प्रयास शेष हैं • Invalid OTP code. ${challenge.attemptsLeft} attempt(s) remaining.`,
        attemptsLeft: challenge.attemptsLeft
      };
    }

    // Success: consume challenge so it cannot be reused
    this.otpChallenges.delete(challengeId);
    const user = this.getUserById(challenge.userId);
    return {
      success: true,
      user
    };
  }

  public resendOtpChallenge(challengeId: string): {
    success: boolean;
    data?: {
      challengeId: string;
      otp: string;
      maskedPhone: string;
      maskedEmail: string;
      expiresInSeconds: number;
    };
    error?: string;
  } {
    const challenge = this.otpChallenges.get(challengeId);
    if (!challenge) {
      return {
        success: false,
        error: 'सत्यापन सत्र अमान्य है • Session invalid. Please login again.'
      };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    challenge.otp = newCode;
    challenge.attemptsLeft = 5;
    challenge.expiresAt = Date.now() + 5 * 60 * 1000;

    return {
      success: true,
      data: {
        challengeId,
        otp: newCode,
        maskedPhone: challenge.maskedPhone,
        maskedEmail: challenge.maskedEmail,
        expiresInSeconds: 300
      }
    };
  }

  // Users
  public generateUniqueOfficerId(state?: string): string {
    const stateCode = (state && STATE_CODES[state]) || 'MP';
    let candidate = '';
    let exists = true;
    while (exists) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      candidate = `LM-${stateCode}-${randomNum}`;
      exists = !!this.data.users.find(u => u.employeeId.toUpperCase() === candidate.toUpperCase());
    }
    return candidate;
  }

  public getUserByEmailOrEmpId(identifier: string): User | undefined {
    const cleaned = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.email.toLowerCase() === cleaned || u.employeeId.toLowerCase() === cleaned
    );
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(params: {
    name: string;
    email: string;
    password: string;
    mobileNumber?: string;
    jurisdictionState?: string;
    jurisdictionDistrict?: string;
    jurisdictionZone?: string;
    department?: string;
    role?: 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN';
  }): User {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (this.data.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An officer with this email address is already registered.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(params.password, salt);
    const employeeId = this.generateUniqueOfficerId(params.jurisdictionState);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      employeeId,
      name: params.name.trim(),
      email: normalizedEmail,
      passwordHash,
      mobileNumber: params.mobileNumber?.trim() || '9876543210',
      role: params.role || 'INSPECTOR',
      department: params.department || 'Legal Metrology Department • विधिक माप विज्ञान विभाग',
      jurisdictionState: params.jurisdictionState || 'Madhya Pradesh',
      jurisdictionDistrict: params.jurisdictionDistrict || 'Indore',
      jurisdictionZone: params.jurisdictionZone || 'Zone 01',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public verifyCredentials(identifier: string, password: string): { user?: User; error?: string } {
    const user = this.getUserByEmailOrEmpId(identifier);
    if (!user) {
      return { error: 'कर्मचारी आईडी या ईमेल नहीं मिला • Employee ID or Email not found' };
    }

    if (user.passwordHash) {
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return { error: 'गलत पासवर्ड • Invalid password entered' };
      }
    } else {
      // Demo seeded accounts without passwordHash allow demo password
      if (password !== 'password123' && password !== 'demo123') {
        return { error: 'गलत पासवर्ड • Invalid password entered' };
      }
    }

    return { user };
  }

  // Inspections
  public getInspections(officerId?: string, officerEmpId?: string): Inspection[] {
    let inspections = this.data.inspections;
    if (officerId) {
      const isDemoInspector = officerId === 'usr_inspector_1' || officerEmpId?.toUpperCase() === 'LM-MP-0421';
      if (!isDemoInspector) {
        inspections = this.data.inspections.filter(
          i => i.inspectorId === officerId || 
               (officerEmpId && (i.inspectorId === officerEmpId || i.inspectorName?.includes(officerEmpId)))
        );
      }
    }
    return inspections.map(insp => ({
      ...insp,
      products: this.getProductsForInspection(insp.id)
    }));
  }

  public getInspectionById(id: string): Inspection | undefined {
    const insp = this.data.inspections.find(i => i.id === id || i.inspectionNumber === id);
    if (!insp) return undefined;
    return {
      ...insp,
      products: this.getProductsForInspection(insp.id)
    };
  }

  public createInspection(inspection: Inspection): Inspection {
    this.data.inspections.unshift(inspection);
    this.save();
    return inspection;
  }

  public updateInspection(id: string, patch: Partial<Inspection>): Inspection | undefined {
    const idx = this.data.inspections.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    this.data.inspections[idx] = { ...this.data.inspections[idx], ...patch, updatedAt: new Date().toISOString() };
    this.save();
    return this.getInspectionById(id);
  }

  // Products
  public getProductsForInspection(inspectionId: string): Product[] {
    return this.data.products
      .filter(p => p.inspectionId === inspectionId)
      .map(p => ({
        ...p,
        declarations: this.getDeclarationsForProduct(p.id),
        ruleResults: this.getRuleResultsForProduct(p.id)
      }));
  }

  public getProductById(id: string): Product | undefined {
    const prod = this.data.products.find(p => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      declarations: this.getDeclarationsForProduct(prod.id),
      ruleResults: this.getRuleResultsForProduct(prod.id)
    };
  }

  public createProduct(product: Product): Product {
    this.data.products.push(product);
    this.save();
    return product;
  }

  public updateProduct(id: string, patch: Partial<Product>): Product | undefined {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.products[idx] = { ...this.data.products[idx], ...patch, updatedAt: new Date().toISOString() };
    this.save();
    return this.getProductById(id);
  }

  // Declarations
  public getDeclarationsForProduct(productId: string): Declaration[] {
    return this.data.declarations.filter(d => d.productId === productId);
  }

  public updateDeclaration(id: string, patch: Partial<Declaration>, actorUserId: string): Declaration | undefined {
    const idx = this.data.declarations.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    const before = { ...this.data.declarations[idx] };
    const updated = { ...before, ...patch, verifiedBy: actorUserId, verifiedAt: new Date().toISOString() };
    this.data.declarations[idx] = updated;

    this.addAuditEvent({
      id: `aud_${Date.now()}`,
      actorUserId,
      actorName: this.getUserById(actorUserId)?.name ?? 'Inspector',
      action: 'DECLARATION_EDITED',
      entityType: 'DECLARATION',
      entityId: id,
      beforeJson: before,
      afterJson: updated,
      createdAt: new Date().toISOString()
    });

    this.save();
    return updated;
  }

  public setDeclarationsForProduct(productId: string, decls: Declaration[]): void {
    this.data.declarations = this.data.declarations.filter(d => d.productId !== productId);
    this.data.declarations.push(...decls);
    this.save();
  }

  // Rule Results
  public getRuleResultsForProduct(productId: string): RuleResult[] {
    return this.data.ruleResults.filter(r => r.productId === productId);
  }

  public setRuleResultsForInspection(inspectionId: string, productId: string, results: RuleResult[]): void {
    this.data.ruleResults = this.data.ruleResults.filter(r => r.productId !== productId);
    this.data.ruleResults.push(...results);
    this.save();
  }

  public updateRuleResult(id: string, patch: Partial<RuleResult>, actorUserId: string): RuleResult | undefined {
    const idx = this.data.ruleResults.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    const before = { ...this.data.ruleResults[idx] };
    const updated = { ...before, ...patch };
    this.data.ruleResults[idx] = updated;

    this.addAuditEvent({
      id: `aud_${Date.now()}`,
      actorUserId,
      actorName: this.getUserById(actorUserId)?.name ?? 'Inspector',
      action: 'RULE_RESULT_OVERRIDDEN',
      entityType: 'RULE_RESULT',
      entityId: id,
      beforeJson: before,
      afterJson: updated,
      createdAt: new Date().toISOString()
    });

    this.save();
    return updated;
  }

  // Audit Events
  public addAuditEvent(event: AuditEvent): void {
    this.data.auditEvents.unshift(event);
    this.save();
  }

  public getAuditEvents(): AuditEvent[] {
    return this.data.auditEvents;
  }

  // Image Assets
  public getAssetsForInspection(inspectionId: string): ImageAsset[] {
    return this.data.assets.filter(a => a.inspectionId === inspectionId);
  }

  public createAsset(asset: ImageAsset): ImageAsset {
    this.data.assets.push(asset);
    this.save();
    return asset;
  }

  // Dashboard Metrics
  public getDashboardSummary(officerId?: string, officerEmpId?: string): DashboardSummary {
    let inspections = this.data.inspections;

    if (officerId) {
      const isDemoInspector = officerId === 'usr_inspector_1' || officerEmpId?.toUpperCase() === 'LM-MP-0421';
      if (!isDemoInspector) {
        inspections = this.data.inspections.filter(
          i => i.inspectorId === officerId || 
               (officerEmpId && (i.inspectorId === officerEmpId || i.inspectorName?.includes(officerEmpId)))
        );
      }
    }

    const inspectionIds = new Set(inspections.map(i => i.id));
    const products = this.data.products.filter(p => inspectionIds.has(p.inspectionId));

    let compliant = 0;
    let nonCompliant = 0;
    let reviewRequired = 0;

    products.forEach(p => {
      if (p.complianceStatus === 'PASS') compliant++;
      else if (p.complianceStatus === 'FAIL') nonCompliant++;
      else reviewRequired++;
    });

    const populatedInspections = inspections.map(insp => ({
      ...insp,
      products: this.getProductsForInspection(insp.id)
    }));

    return {
      todayInspections: inspections.length,
      totalInspections: inspections.length,
      compliant,
      nonCompliant,
      reviewRequired,
      openCases: this.data.cases.filter(c => c.status === 'OPEN' && (!officerId || inspectionIds.has(c.inspectionId) || officerId === 'usr_inspector_1')).length,
      pendingSync: inspections.filter(i => i.syncStatus !== 'SYNCED').length,
      recentInspections: populatedInspections
    };
  }
}

export const dbStore = new DBStore();
