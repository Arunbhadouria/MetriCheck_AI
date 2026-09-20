import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { dbStore, STATE_CODES } from './db/store.js';
import { initializeDatabase, syncUserToPostgres, getDatabaseStatus } from './db/dbConnection.js';
import { generateInspectionPDF } from './services/pdfGenerator.js';
import { sendOtpSms } from './services/smsService.js';
import { RuleEngine } from '@metricheck/rule-engine';
import { Inspection, Product, Declaration, RuleResult, ImageAsset } from '@metricheck/shared-types';

dotenv.config();

// Ensure GEMINI_API_KEY is discovered from ai-service/.env if not present in main .env
if (!process.env.GEMINI_API_KEY) {
  const possiblePaths = [
    path.resolve(process.cwd(), 'apps', 'ai-service', '.env'),
    path.resolve(process.cwd(), '..', 'ai-service', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      if (process.env.GEMINI_API_KEY) break;
    }
  }
}

// Use environment variable for security (injected via .env locally or Render Dashboard in production)
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

// Initialize database connection
initializeDatabase().catch(err => console.error('Database init error:', err));

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'metricheck_secret_key_2026';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

const resolveUploadsDir = (): string => {
  const rootAppUploads = path.resolve(process.cwd(), 'apps', 'api', 'storage', 'uploads');
  if (fs.existsSync(path.resolve(process.cwd(), 'apps', 'api', 'storage'))) {
    if (!fs.existsSync(rootAppUploads)) fs.mkdirSync(rootAppUploads, { recursive: true });
    return rootAppUploads;
  }
  const cwdUploads = path.resolve(process.cwd(), 'storage', 'uploads');
  if (!fs.existsSync(cwdUploads)) fs.mkdirSync(cwdUploads, { recursive: true });
  return cwdUploads;
};

const UPLOADS_DIR = resolveUploadsDir();

// Setup multer for storage
const storageConfig = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, UPLOADS_DIR),
  filename: (req: any, file: any, cb: any) => {
    let ext = path.extname(file.originalname);
    if (!ext || ext === '.') {
      if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/png') ext = '.png';
      else ext = '.jpg';
    }
    cb(null, `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});
const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 15 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Path normalizer: transparently support endpoints requested without /api/v1 prefix (e.g. /auth/login)
app.use((req, res, next) => {
  if (
    !req.url.startsWith('/api/v1') &&
    !req.url.startsWith('/uploads') &&
    req.url !== '/health' &&
    req.url !== '/'
  ) {
    const cleanPath = req.url.startsWith('/') ? req.url : `/${req.url}`;
    req.url = `/api/v1${cleanPath}`;
  }
  next();
});

// Auth Middleware
const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      req.user = null;
    } else {
      const dbUser = dbStore.getUserById(decoded.id) || dbStore.getUserByEmailOrEmpId(decoded.employeeId || decoded.email);
      if (dbUser) {
        const { passwordHash, ...safeUser } = dbUser;
        req.user = safeUser;
      } else {
        req.user = decoded;
      }
    }
    next();
  });
};

const requireOfficer = (req: any, res: Response, next: any) => {
  if (!req.user || !req.user.employeeId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'कृपया वैध अधिकारी खाते से लॉगिन करें • Officer session required' }
    });
  }
  next();
};

// Health Endpoint (accessible at /health and /api/v1/health)
app.get(['/health', '/api/v1/health'], (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    aiVisionConfigured: !!GEMINI_API_KEY,
    activeModels: ['gemini-2.5-flash-lite', 'gemini-3.6-flash'],
    ruleEngineVersion: RuleEngine.getVersion(),
    database: getDatabaseStatus()
  });
});

// Auth Routes

// 1. Register Officer Flow: creates user in DB, hashes password, generates unique statutory LM ID
app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      mobileNumber,
      jurisdictionState,
      jurisdictionDistrict,
      jurisdictionZone,
      department,
      role
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, Email, and Password are required.' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' }
      });
    }

    const newUser = dbStore.createUser({
      name,
      email,
      password,
      mobileNumber,
      jurisdictionState,
      jurisdictionDistrict,
      jurisdictionZone,
      department,
      role: role || 'INSPECTOR'
    });

    // Synchronize to PostgreSQL if connected
    await syncUserToPostgres(newUser);

    // Issue JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email, employeeId: newUser.employeeId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { passwordHash, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      data: {
        user: safeUser,
        employeeId: newUser.employeeId,
        token
      }
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: err.message || 'Registration failed' }
    });
  }
});

// 2. Real Login Flow: checks credentials and issues an authentic OTP challenge
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, employeeId, password } = req.body;
  const identifier = employeeId || email || '';

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_ID', message: 'कृपया कर्मचारी आईडी या ईमेल दर्ज करें • Employee ID or Email is required' }
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PASSWORD', message: 'कृपया पासवर्ड दर्ज करें • Password is required' }
    });
  }

  const verification = dbStore.verifyCredentials(identifier, password);
  if (verification.error || !verification.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_FAILED', message: verification.error || 'अमान्य कर्मचारी आईडी या पासवर्ड • Invalid Employee ID or Password' }
    });
  }

  const user = verification.user;
  const challenge = dbStore.createOtpChallenge(user);

  // Dispatch OTP via SMS Gateway (Fast2SMS / Twilio / NIC Simulator)
  sendOtpSms({
    toPhone: user.mobileNumber || '9876543210',
    officerName: user.name,
    otpCode: challenge.otp,
    expiresInMinutes: 5
  }).catch(err => console.error('SMS dispatch error:', err));

  return res.json({
    success: true,
    data: {
      requireOtp: true,
      challengeId: challenge.challengeId,
      employeeId: user.employeeId,
      name: user.name,
      maskedPhone: challenge.maskedPhone,
      maskedEmail: challenge.maskedEmail,
      expiresInSeconds: challenge.expiresInSeconds,
      devOtp: challenge.otp
    }
  });
});

// 3. Verify OTP Endpoint: validates authentic 6-digit OTP code and signs JWT session token
app.post('/api/v1/auth/verify-otp', (req: Request, res: Response) => {
  const { challengeId, otp } = req.body;

  if (!challengeId || !otp) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'कृपया सत्यापन आईडी और 6-अंकीय OTP प्रदान करें • Challenge ID and OTP are required' }
    });
  }

  const result = dbStore.verifyOtpChallenge(challengeId, otp);
  if (!result.success || !result.user) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_OTP', message: result.error, attemptsLeft: result.attemptsLeft }
    });
  }

  const user = result.user;
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, employeeId: user.employeeId },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const { passwordHash, ...safeUser } = user;
  return res.json({
    success: true,
    data: {
      user: safeUser,
      token,
      message: 'OTP सत्यापन सफल • Officer session authenticated'
    }
  });
});

// 4. Resend OTP Endpoint: generates fresh 6-digit OTP code
app.post('/api/v1/auth/resend-otp', (req: Request, res: Response) => {
  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CHALLENGE', message: 'कृपया सत्र आईडी प्रदान करें • Challenge ID is required' }
    });
  }

  const result = dbStore.resendOtpChallenge(challengeId);
  if (!result.success || !result.data) {
    return res.status(400).json({
      success: false,
      error: { code: 'RESEND_FAILED', message: result.error || 'पुनः प्रेषण विफल • Failed to resend OTP' }
    });
  }

  // Dispatch resent OTP via SMS Gateway
  sendOtpSms({
    toPhone: result.data.maskedPhone,
    officerName: 'Officer',
    otpCode: result.data.otp,
    expiresInMinutes: 5
  }).catch(err => console.error('Resend SMS error:', err));

  return res.json({
    success: true,
    data: {
      challengeId: result.data.challengeId,
      maskedPhone: result.data.maskedPhone,
      maskedEmail: result.data.maskedEmail,
      expiresInSeconds: result.data.expiresInSeconds,
      devOtp: result.data.otp,
      message: 'नया OTP आपके पंजीकृत संपर्क पर भेज दिया गया है • New OTP dispatched'
    }
  });
});

// 3. Demo Login for Judges: 1-click evaluator fast-track login
app.post('/api/v1/auth/demo-login', (req: Request, res: Response) => {
  let user = dbStore.getUserByEmailOrEmpId('LM-MP-0421');
  if (!user) {
    user = dbStore.getUserById('usr_inspector_1') || {
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
    };
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, employeeId: user.employeeId },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const { passwordHash, ...safeUser } = user;
  return res.json({
    success: true,
    data: {
      user: safeUser,
      token,
      message: 'Demo Judge Access Authorized • Senior Inspector Profile'
    }
  });
});

app.get('/api/v1/auth/me', authenticateToken, (req: any, res: Response) => {
  res.json({ success: true, data: req.user });
});

// Dashboard Summary
app.get('/api/v1/dashboard/summary', authenticateToken, requireOfficer, (req: any, res: Response) => {
  const officerId = req.user?.id;
  const officerEmpId = req.user?.employeeId;
  const summary = dbStore.getDashboardSummary(officerId, officerEmpId);
  res.json({ success: true, data: summary });
});

// Inspections List & Detail
app.get('/api/v1/inspections', authenticateToken, requireOfficer, (req: any, res: Response) => {
  const officerId = req.user?.id;
  const officerEmpId = req.user?.employeeId;
  const list = dbStore.getInspections(officerId, officerEmpId);
  res.json({ success: true, data: list });
});

app.get('/api/v1/inspections/:id', authenticateToken, (req: Request, res: Response) => {
  const inspection = dbStore.getInspectionById(req.params.id);
  if (!inspection) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Inspection not found' }
    });
  }
  res.json({ success: true, data: inspection });
});

// Create Inspection
app.post('/api/v1/inspections', authenticateToken, (req: any, res: Response) => {
  const body = req.body;
  const id = `insp_${Date.now()}`;
  const state = body.jurisdictionState || req.user?.jurisdictionState || 'Madhya Pradesh';
  const district = body.jurisdictionDistrict || req.user?.jurisdictionDistrict || 'Indore';
  const stateCode = (state && STATE_CODES[state]) || 'MP';
  const distShort = (district || 'DST').substring(0, 3).toUpperCase();
  const inspectionNumber = `LM/${stateCode}/${distShort}/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;

  const newInsp: Inspection = {
    id,
    inspectionNumber,
    inspectorId: req.user?.id || 'usr_inspector_1',
    inspectorName: `${req.user?.name || 'Amit Verma'} (${req.user?.employeeId || 'LM-MP-0421'})`,
    status: 'DRAFT',
    inspectionType: body.inspectionType || 'Routine',
    jurisdictionState: state,
    jurisdictionDistrict: district,
    jurisdictionZone: body.jurisdictionZone || req.user?.jurisdictionZone || 'Zone 01',
    marketName: body.marketName || 'Malviya Nagar Market',
    shopName: body.shopName || 'Retail Store',
    shopkeeperName: body.shopkeeperName || 'Proprietor',
    licenseNumber: body.licenseNumber || `${stateCode}/LM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    locationAddress: body.locationAddress || `${district}, ${state}`,
    gpsCoordinates: body.gpsCoordinates || undefined,
    consumerComplaintsCount: body.consumerComplaintsCount || 0,
    startedAt: new Date().toISOString(),
    syncStatus: 'SYNCED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  dbStore.createInspection(newInsp);
  res.status(201).json({ success: true, data: newInsp });
});

// Multipart Binary Image Asset Upload
app.post('/api/v1/inspections/:id/assets', authenticateToken, upload.single('image'), (req: any, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No image file uploaded' } });
  }

  const asset: ImageAsset = {
    id: `asset_${Date.now()}`,
    inspectionId: req.params.id,
    storageKey: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    width: 1920,
    height: 1080,
    captureType: (req.body.captureType as any) || 'CAMERA',
    sequence: 1,
    previewUrl: `/uploads/${req.file.filename}`,
    createdAt: new Date().toISOString()
  };

  dbStore.createAsset(asset);
  res.status(201).json({ success: true, data: asset });
});

// Run Real Image AI Analysis & Deterministic Rule Evaluation
app.post('/api/v1/inspections/:id/analyze', authenticateToken, async (req: Request, res: Response) => {
  const inspection = dbStore.getInspectionById(req.params.id);
  if (!inspection) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } });
  }

  // Find the latest asset
  const assets = dbStore.getAssetsForInspection(inspection.id);
  if (assets.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'NO_ASSET', message: 'No image uploaded for this inspection' } });
  }
  const latestAsset = assets[assets.length - 1];
  let products = dbStore.getProductsForInspection(inspection.id);

  try {
    // 1. Prepare files and analyze package with Gemini Vision / AI service
    const fileSpecs = assets.map(a => ({ filename: a.storageKey, mimetype: a.mimeType }));
    const { declarations: rawDeclarationsOutput, rawText } = await performAiPackageAnalysis(fileSpecs, inspection.id);

    // Use returned declarations or fallback if AI service couldn't detect text
    const rawDeclarations = (Array.isArray(rawDeclarationsOutput) && rawDeclarationsOutput.length > 0)
      ? rawDeclarationsOutput
      : [
          { field: 'PRODUCT_NAME', rawValue: 'Scanned Package (Unclear OCR)', normalizedValue: 'Scanned Package', confidence: 0.3 },
          { field: 'MRP', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'NET_QUANTITY', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'MFG_DATE', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'BATCH_NUMBER', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'MANUFACTURER', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'ADDRESS', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 },
          { field: 'COUNTRY_OF_ORIGIN', rawValue: 'Not Detected', normalizedValue: null, confidence: 0 }
        ];

    // 2. Extract product name & brand
    const prodNameDecl = rawDeclarations.find((d: any) => d.field === 'PRODUCT_NAME');
    const productName = prodNameDecl ? prodNameDecl.rawValue : 'Unknown Product';
    let brandName = 'Unknown';
    if (/^PS\b/i.test(productName) || rawText?.includes('"PS"')) {
      brandName = 'PS';
    } else {
      const brandMatch = productName.match(/^(Tata|Nestle|Amul|Britannia|Haldiram|Patanjali|Dabur|ITC)\b/i);
      if (brandMatch) brandName = brandMatch[1];
    }

      const prod1: Product = {
        id: `prod_${Date.now()}_1`,
        inspectionId: inspection.id,
        productName: productName,
        brand: brandName,
        category: 'Packaged Commodities',
        barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
        complianceStatus: 'FAIL',
        violationsCount: 0,
        evidencePhotoCount: assets.length || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dbStore.createProduct(prod1);

      // 3. Map declarations
      const mappedDecls: Declaration[] = rawDeclarations.map((d: any, idx: number) => ({
        id: `decl_${Date.now()}_${idx}`,
        productId: prod1.id,
        field: d.field,
        rawValue: d.rawValue,
        normalizedValue: d.normalizedValue,
        confidence: d.confidence,
        sourceType: 'AI_OCR',
        bbox: d.bbox
      }));
      dbStore.setDeclarationsForProduct(prod1.id, mappedDecls);

      // 4. Evaluate rules
      const evalResults = RuleEngine.evaluateAll(mappedDecls);
      const ruleResults: RuleResult[] = evalResults.map((r: any, idx: number) => ({
        id: `rr_${Date.now()}_${idx}`,
        inspectionId: inspection.id,
        productId: prod1.id,
        ruleId: `rule_${r.ruleCode.toLowerCase()}`,
        ruleCode: r.ruleCode,
        ruleTitle: r.ruleTitle,
        sourceReference: r.sourceReference,
        status: r.status,
        severity: r.severity,
        message: r.message,
        observedValue: r.observedValue,
        expectedValue: r.expectedValue,
        confidence: r.confidence,
        evidenceIds: r.evidenceIds || [latestAsset.id],
        createdAt: new Date().toISOString()
      }));
      dbStore.setRuleResultsForInspection(inspection.id, prod1.id, ruleResults);
      
      // Update compliance status
      const failedRules = ruleResults.filter(r => r.status === 'FAIL');
      dbStore.updateProduct(prod1.id, {
        complianceStatus: failedRules.length > 0 ? 'FAIL' : 'PASS',
        violationsCount: failedRules.length
      });

    products = dbStore.getProductsForInspection(inspection.id);
  } catch (err: any) {
    console.error('AI Analysis Error:', err);
    return res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: err.message } });
  }

  dbStore.updateInspection(inspection.id, { status: 'REVIEW' });

  res.json({
    success: true,
    data: {
      analysisId: `anl_${Date.now()}`,
      inspectionId: inspection.id,
      status: 'COMPLETED',
      products
    }
  });
});

// Finalize Inspection
app.post('/api/v1/inspections/:id/finalize', authenticateToken, (req: Request, res: Response) => {
  const updated = dbStore.updateInspection(req.params.id, { status: 'FINALIZED', completedAt: new Date().toISOString() });
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Inspection not found' } });
  }
  res.json({ success: true, data: updated });
});

// Helper to compute legal metrology Unit Sale Price
function calculateUnitSalePrice(mrp: number, netQtyStr: string): string {
  if (!mrp || !netQtyStr) return `₹${mrp}`;
  const match = netQtyStr.match(/([0-9]+(?:\.[0-9]+)?)\s*(g|gm|gram|grams|kg|ml|l|ltr|litre|litres|piece|pieces|unit|units|n)\b/i);
  if (!match) return `₹${mrp}`;
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (val <= 0) return `₹${mrp}`;

  if (['g', 'gm', 'gram', 'grams'].includes(unit)) {
    const ratePerGram = (mrp / val).toFixed(3);
    return `₹${ratePerGram} / g`;
  }
  if (['kg'].includes(unit)) {
    const ratePerKg = (mrp / val).toFixed(2);
    return `₹${ratePerKg} / kg`;
  }
  if (['ml'].includes(unit)) {
    const ratePerMl = (mrp / val).toFixed(3);
    return `₹${ratePerMl} / mL`;
  }
  if (['l', 'ltr', 'litre', 'litres'].includes(unit)) {
    const ratePerLitre = (mrp / val).toFixed(2);
    return `₹${ratePerLitre} / L`;
  }
  return `₹${(mrp / val).toFixed(2)} / ${unit}`;
}

// Helper for robust high-speed Legal Metrology package analysis
async function performAiPackageAnalysis(
  files: { filename: string; mimetype?: string }[],
  inspectionId: string
): Promise<{ declarations: any[]; rawText: string }> {
  let declarations: any[] = [];
  let rawText = '';

  // 1. Priority 1: Direct Google Gemini Vision API (fast, high-precision legal metrology OCR)
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are a High-Precision Statutory Legal Metrology Vision OCR Engine under the Legal Metrology (Packaged Commodities) Rules, 2011.
Examine all provided package image(s) (Front artwork, Back label, MRP / PKD stamp, sides).
Extract all statutory legal metrology declarations verbatim. Even if in Hindi or English, extract with maximum accuracy.
Return ONLY a single valid JSON object:
{
  "PRODUCT_NAME": "generic or trade name of product e.g. Balm, Atta, Chips, Biscuits",
  "BRAND": "brand or manufacturer brand e.g. A.P. Special, Tata, Amul, Lays",
  "MRP": "numeric maximum retail price e.g. 35.00, 10, 250",
  "NET_QUANTITY": "net quantity with metric unit e.g. 12g, 500ml, 1 kg",
  "MFG_DATE": "manufacturing or packaging date e.g. APR-24, 05/2026",
  "EXPIRY_DATE": "expiry date or best before statement e.g. 3 years from Mfg",
  "BATCH_NUMBER": "batch or lot number e.g. 227",
  "MANUFACTURER": "name of manufacturer or packer",
  "ADDRESS": "postal address of manufacturer/packer",
  "CONSUMER_CARE": "customer care phone number or email address",
  "COUNTRY_OF_ORIGIN": "country of origin (e.g. India)"
}`;

      const parts: any[] = [{ text: prompt }];
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          parts.push({
            inline_data: {
              mime_type: file.mimetype || 'image/jpeg',
              data: fileBuffer.toString('base64')
            }
          });
        }
      }

      if (parts.length > 1) {
        // Multi-model fallback: prioritize fast flash-lite, fallback to 3.6-flash
        const candidateModels = ['gemini-2.5-flash-lite', 'gemini-3.6-flash'];
        for (const modelName of candidateModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(18000),
                body: JSON.stringify({
                  contents: [{ parts }],
                  generationConfig: {
                    response_mime_type: 'application/json',
                    temperature: 0.0,
                    thinking_config: { thinking_budget: 0 }
                  }
                })
              }
            );

            if (geminiRes.ok) {
              const gData: any = await geminiRes.json();
              const textCandidate = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textCandidate) {
                const parsed = JSON.parse(textCandidate);
                rawText = JSON.stringify(parsed);
                for (const [key, val] of Object.entries(parsed)) {
                  if (val && String(val).trim().toLowerCase() !== 'null') {
                    declarations.push({
                      field: key,
                      rawValue: String(val).trim(),
                      normalizedValue: {},
                      confidence: 0.95
                    });
                  }
                }
                if (declarations.length > 0) {
                  break; // Successfully extracted statutory fields!
                }
              }
            } else {
              const errBody = await geminiRes.text().catch(() => '');
              console.warn(`Gemini Vision model ${modelName} returned HTTP ${geminiRes.status}:`, errBody.substring(0, 160));
            }
          } catch (modelErr: any) {
            console.warn(`Gemini Vision model ${modelName} request error:`, modelErr.message);
          }
        }
      }
    } catch (geminiErr: any) {
      console.warn('Direct Gemini Vision API warning:', geminiErr.message);
    }
  }

  // 2. Priority 2: Fallback to local AI Perception Service (with strict 3.5s timeout)
  if (declarations.length === 0) {
    try {
      const formData = new FormData();
      formData.append('inspectionId', inspectionId);
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const blob = new Blob([fileBuffer], { type: file.mimetype || 'image/jpeg' });
          formData.append('files', blob, file.filename);
        }
      }

      const aiResponse = await fetch(`${AI_SERVICE_URL}/analyze`, {
        method: 'POST',
        body: formData as any,
        signal: AbortSignal.timeout(3500)
      });
      if (aiResponse.ok) {
        const aiJson: any = await aiResponse.json();
        declarations = aiJson.declarations || [];
        rawText = aiJson.rawText || '';
      }
    } catch (aiServiceErr: any) {
      console.warn('AI Perception Service fallback warning:', aiServiceErr.message);
    }
  }

  return { declarations, rawText };
}

// Real-time AI Package Analysis for Citizens / Consumers
app.post('/api/v1/consumer/analyze', upload.any(), async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_IMAGE', message: 'कृपया विश्लेषण हेतु उत्पाद की कम से कम एक फोटो प्रदान करें • At least one image is required.' }
    });
  }

  try {
    const inspectionId = `consumer_${Date.now()}`;
    const fileSpecs = files.map(f => ({ filename: f.filename, mimetype: f.mimetype }));
    const { declarations, rawText } = await performAiPackageAnalysis(fileSpecs, inspectionId);

    // 3. Extract and normalize fields from declarations
    const getField = (f: string) => {
      const decl = declarations.find((d: any) => d.field === f);
      const val = decl?.rawValue?.trim();
      return (val && val !== 'Not Detected' && val.toLowerCase() !== 'null') ? val : null;
    };

    const rawProductName = getField('PRODUCT_NAME');
    const rawBrand = getField('BRAND');

    // Combine Brand and Product Name nicely (e.g. "A.P. SPECIAL" + "BALM" -> "A.P. SPECIAL BALM")
    let productName = rawProductName || rawBrand || 'Scanned Package';
    if (rawBrand && rawProductName && !rawProductName.toLowerCase().includes(rawBrand.toLowerCase())) {
      productName = `${rawBrand} ${rawProductName}`;
    }

    // Extract Brand
    let brandName = rawBrand || 'Packaged Commodity';
    if (brandName === 'Packaged Commodity') {
      const brandMatch = productName.match(/^(Tata|Nestle|Amul|Britannia|Haldiram|Patanjali|Dabur|ITC|Parle|Cadbury|Lays|Kurkure|Bikaji|Balaji|Mother Dairy|Pepsi|Coca-Cola|Surf Excel|Colgate|Dettol|Maggi|Kwality Wall'?s|A\.?P\.?\s*Special)\b/i);
      if (brandMatch) brandName = brandMatch[1];
    }

    // Parse MRP (supports numeric 35, 35.00, ₹35, Rs. 35, 35/-, etc.)
    const rawMrpStr = getField('MRP') || '';
    const mrpMatch = rawMrpStr.match(/(?:₹|Rs\.?|INR|रु)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    let printedMrp = mrpMatch ? parseFloat(mrpMatch[1]) : 0;

    // Fallback regex on raw text dump if MRP was missed
    if (printedMrp === 0 && rawText) {
      const fallbackMrpMatch = rawText.match(/(?:MRP|PRICE|M\.R\.P\.?|मूल्य|₹|Rs\.?)\s*(?:inclusive of all taxes)?[:\s\-\.]*(?:₹|Rs\.?|INR|रु)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (fallbackMrpMatch) {
        printedMrp = parseFloat(fallbackMrpMatch[1]);
      }
    }

    // Check if user submitted a sticker/billed price or if detected
    const userStickerPrice = req.body.stickerPrice ? parseFloat(req.body.stickerPrice) : undefined;
    let stickerPrice = userStickerPrice;

    const netWeight = getField('NET_QUANTITY') || '1 Standard Unit';
    const mfgDate = getField('MFG_DATE') || 'Not Declared';
    const expiryDate = getField('EXPIRY_DATE') || 'Not Declared';
    const manufacturer = [getField('MANUFACTURER'), getField('ADDRESS')].filter(Boolean).join(', ') || 'Registered Packaged Commodity Packer';
    const customerCare = getField('CONSUMER_CARE') || '1800-11-4000 / helpdesk@consumeraffairs.gov.in';
    const unitSalePrice = printedMrp > 0 ? calculateUnitSalePrice(printedMrp, netWeight) : '₹0.00';

    // 4. Rule Engine evaluation
    const mappedDecls: Declaration[] = declarations.map((d: any, idx: number) => ({
      id: `decl_cons_${idx}`,
      productId: 'consumer_product',
      field: d.field,
      rawValue: d.rawValue,
      normalizedValue: d.normalizedValue,
      confidence: d.confidence || 0.9,
      sourceType: 'AI_OCR'
    }));

    const ruleEvals = RuleEngine.evaluateAll(mappedDecls);
    const violations: string[] = [];

    // Check dual pricing / overcharging
    if (stickerPrice && stickerPrice > printedMrp) {
      violations.push('SECTION_36_OVERCHARGING');
      violations.push('DUAL_MRP_STICKER');
    }

    // Check expiry
    if (expiryDate && expiryDate !== 'Not Declared') {
      const expTimestamp = Date.parse(expiryDate);
      if (!isNaN(expTimestamp) && expTimestamp < Date.now()) {
        violations.push('EXPIRED_PRODUCT');
        violations.push('RULE_6_EXPIRY_BREACH');
      }
    }

    // Add failures from statutory rule engine
    for (const r of ruleEvals) {
      if (r.status === 'FAIL') {
        violations.push(r.message);
      }
    }

    const firstFile = files[0];
    const previewUrl = `/uploads/${firstFile.filename}`;

    const scannedConsumerProduct = {
      id: `consumer_prod_${Date.now()}`,
      name: productName,
      brand: brandName,
      barcode: '890' + Math.floor(1000000000 + Math.random() * 9000000000),
      printedMrp: printedMrp,
      stickerPrice: stickerPrice && stickerPrice > printedMrp ? stickerPrice : undefined,
      expiryDate: expiryDate,
      mfgDate: mfgDate,
      netWeight: netWeight,
      manufacturer: manufacturer,
      customerCare: customerCare,
      violations: violations,
      unitSalePrice: unitSalePrice,
      status: violations.length > 0 ? 'VIOLATION' : 'PASS',
      stepImages: {
        front: previewUrl
      }
    };

    return res.status(200).json({
      success: true,
      data: scannedConsumerProduct
    });
  } catch (err: any) {
    console.error('Consumer analyze fatal error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: err.message || 'Image analysis failed' }
    });
  }
});

// Generate & Stream Real PDF Report
app.get('/api/v1/inspections/:id/pdf', async (req: Request, res: Response) => {
  const inspection = dbStore.getInspectionById(req.params.id);
  if (!inspection) {
    return res.status(404).send('Inspection not found');
  }
  const products = dbStore.getProductsForInspection(inspection.id);
  const ruleResults = products.flatMap(p => p.ruleResults ?? []);
  const officer = inspection.inspectorId ? dbStore.getUserById(inspection.inspectorId) : undefined;

  try {
    const pdfBuffer = await generateInspectionPDF(inspection, products, ruleResults, officer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Report_${inspection.inspectionNumber.replace(/\//g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'PDF_ERR', message: err.message } });
  }
});

// Edit Declaration (With Audit Logging)
app.patch('/api/v1/declarations/:id', authenticateToken, (req: any, res: Response) => {
  const updated = dbStore.updateDeclaration(req.params.id, req.body, req.user?.id || 'usr_inspector_1');
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Declaration not found' } });
  }
  res.json({ success: true, data: updated });
});

// Override / Verify Rule Result
app.patch('/api/v1/rule-results/:id/verify', authenticateToken, (req: any, res: Response) => {
  const updated = dbStore.updateRuleResult(req.params.id, req.body, req.user?.id || 'usr_inspector_1');
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule result not found' } });
  }
  res.json({ success: true, data: updated });
});

// Audit Events Query
app.get('/api/v1/audit', authenticateToken, (req: Request, res: Response) => {
  const events = dbStore.getAuditEvents();
  res.json({ success: true, data: events });
});

// Sync Batch
app.post('/api/v1/sync/batch', authenticateToken, (req: Request, res: Response) => {
  const { mutations } = req.body;
  res.json({
    success: true,
    data: {
      syncedCount: mutations ? mutations.length : 0,
      timestamp: new Date().toISOString()
    }
  });
});

// ── CITIZEN COMPLAINTS & GRIEVANCES API ──────────────────────────────────────
// 1. Submit a citizen complaint (Public, no auth required)
app.post(['/api/v1/complaints', '/complaints'], (req: Request, res: Response) => {
  try {
    const complaint = dbStore.createComplaint(req.body);
    res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint submitted successfully and routed to Zone Officer.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message || 'Failed to submit complaint' } });
  }
});

// 2. List complaints (Filtered by officer zone/district/state or by citizen phone)
app.get(['/api/v1/complaints', '/complaints'], authenticateToken, (req: any, res: Response) => {
  const phone = req.query.phone as string | undefined;
  if (phone) {
    const complaints = dbStore.getComplaints({ phone });
    return res.json({ success: true, data: complaints });
  }

  // Officer route: scope strictly to officer zone / district
  const zone = req.query.zone || req.user?.jurisdictionZone;
  const district = req.query.district || req.user?.jurisdictionDistrict;
  const state = req.query.state || req.user?.jurisdictionState;
  
  const complaints = dbStore.getComplaints({ zone, district, state });
  return res.json({ success: true, data: complaints });
});

// 3. Citizen tracking lookup by trackingId (Public, no auth required)
app.get(['/api/v1/complaints/track/:trackingId', '/complaints/track/:trackingId'], (req: Request, res: Response) => {
  const complaint = dbStore.getComplaintByTrackingId(req.params.trackingId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No complaint found matching this tracking ID.' }
    });
  }
  res.json({ success: true, data: complaint });
});

// 4. Update complaint status by officer
app.patch(['/api/v1/complaints/:id/status', '/complaints/:id/status'], authenticateToken, requireOfficer, (req: any, res: Response) => {
  const { status, remarks, officerRemarks } = req.body;
  const officerName = req.user?.name || 'Amit Verma';
  const officerEmpId = req.user?.employeeId || 'LM-MP-0421';

  const updated = dbStore.updateComplaintStatus(req.params.id, status, officerRemarks || remarks, officerName, officerEmpId);
  if (!updated) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found.' } });
  }
  res.json({ success: true, data: updated, message: 'Status updated successfully.' });
});

// 5. Zone Officers Directory: lists registered Legal Metrology officers across zones
app.get(['/api/v1/officers', '/officers'], authenticateToken, (req: Request, res: Response) => {
  const state = req.query.state as string | undefined;
  const district = req.query.district as string | undefined;
  const zone = req.query.zone as string | undefined;
  const search = req.query.search as string | undefined;

  const officers = dbStore.getOfficersDirectory({ state, district, zone, search });
  res.json({ success: true, data: officers });
});

app.listen(PORT, () => {
  console.log(`MetriCheck AI API Gateway running on port ${PORT}`);
});
