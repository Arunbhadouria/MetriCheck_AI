// ══ BILINGUAL VOICE AI SERVICE (HINDI & ENGLISH) ══════════════════════════
// Powered by browser native Web Speech API (window.speechSynthesis)
// Zero-latency, works offline, and requires zero external API keys.

export interface ProductVoiceDetails {
  productName: string;
  brand?: string;
  mrp: number;
  stickerPrice?: number;
  expiryDate?: string;
  netWeight?: string;
  violations?: string[];
  lang?: 'hi' | 'en';
}

class VoiceAiService {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.voicesLoaded = true;
      };
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  private pickBestVoice(lang: 'hi' | 'en'): SpeechSynthesisVoice | undefined {
    const voices = this.getAvailableVoices();
    if (voices.length === 0) return undefined;

    if (lang === 'hi') {
      // 1. Exact Hindi voice
      const hiVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी'));
      if (hiVoice) return hiVoice;
      // 2. Fallback to Indian English voice for Hindi phonetics
      const inVoice = voices.find(v => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'));
      if (inVoice) return inVoice;
    } else {
      // English
      const enInVoice = voices.find(v => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'));
      if (enInVoice) return enInVoice;
      const enVoice = voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (enVoice) return enVoice;
    }
    return voices[0];
  }

  public stop(): void {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public speak(
    text: string,
    lang: 'hi' | 'en' = 'hi',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.isSupported()) {
      onError?.(new Error('Speech Synthesis not supported in this browser.'));
      return;
    }

    // Cancel any current utterance
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = lang === 'hi' ? 0.92 : 0.96; // Slightly slower for clear government clarity
    utterance.pitch = 1.0;

    const voice = this.pickBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onError?.(e);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public speakProductAnnouncement(
    details: ProductVoiceDetails,
    onStart?: () => void,
    onEnd?: () => void
  ): string {
    const lang = details.lang || 'hi';
    let script = '';

    const hasDualPrice = details.stickerPrice && details.stickerPrice > details.mrp;
    const isExpired = details.violations?.some(v => v.toLowerCase().includes('expired'));
    const isMissingDecl = details.violations?.some(v => v.toLowerCase().includes('missing'));

    if (lang === 'hi') {
      script += `उत्पाद: ${details.productName}। `;
      script += `मुद्रित अधिकतम खुदरा मूल्य: ₹${details.mrp}। `;

      if (details.netWeight) {
        script += `शुद्ध मात्रा: ${details.netWeight}। `;
      }

      if (details.expiryDate) {
        script += `समाप्ति तिथि: ${details.expiryDate}। `;
      }

      if (hasDualPrice) {
        script += `सावधान! पैकेज पर ₹${details.stickerPrice} का अतिरिक्त स्टिकर लगाया गया है, जो कि मुद्रित मूल्य से ₹${details.stickerPrice! - details.mrp} अधिक है। यह विधिक मापविज्ञान अधिनियम के तहत दंडनीय उल्लंघन है। `;
      } else if (isExpired) {
        script += `सावधान! इस उत्पाद की वैधता समाप्त हो चुकी है। कृपया इसे न खरीदें। `;
      } else if (isMissingDecl) {
        script += `ध्यान दें! इस पैकेज पर अनिवार्य घोषणाएं अधूरी पाई गई हैं। `;
      } else {
        script += `यह उत्पाद विधिक मापविज्ञान नियमों के अनुरूप वैध प्रतीत होता है। `;
      }
    } else {
      script += `Product: ${details.productName}. `;
      script += `Official Printed MRP: ${details.mrp} Rupees. `;

      if (details.netWeight) {
        script += `Net quantity: ${details.netWeight}. `;
      }

      if (details.expiryDate) {
        script += `Best before or expiry date: ${details.expiryDate}. `;
      }

      if (hasDualPrice) {
        script += `Warning! A higher price sticker of ${details.stickerPrice} Rupees was detected over the printed price. Overcharging by ${details.stickerPrice! - details.mrp} Rupees is an offense under Section 36 of the Legal Metrology Act. `;
      } else if (isExpired) {
        script += `Warning! This product has passed its expiration date. Do not purchase. `;
      } else if (isMissingDecl) {
        script += `Notice: Mandatory statutory package declarations are incomplete. `;
      } else {
        script += `Product packaging is compliant with Legal Metrology Rules. `;
      }
    }

    this.speak(script, lang, onStart, onEnd);
    return script;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceAi = new VoiceAiService();
