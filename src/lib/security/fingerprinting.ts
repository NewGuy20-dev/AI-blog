// Enhanced browser fingerprinting to detect spoofing attempts
export class AdvancedFingerprinting {
  static async generateFingerprint(): Promise<string> {
    const components = await Promise.all([
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      this.getAudioFingerprint(),
      this.getScreenMetrics(),
      this.getFontFingerprint(),
      this.getTimezoneFingerprint(),
      this.getHardwareFingerprint()
    ]);

    return this.hashComponents(components);
  }

  static async getCanvasFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Draw complex pattern to detect canvas spoofing
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('🌍🔒 Security Check', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Advanced Fingerprint', 4, 45);
    
    // Add noise detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const noise = this.calculateImageNoise(imageData.data);
    
    return canvas.toDataURL() + '|noise:' + noise;
  }

  static async getWebGLFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    
    if (!gl) return 'no-webgl';

    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const version = gl.getParameter(gl.VERSION);
    const extensions = gl.getSupportedExtensions()?.join(',') || '';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const unmaskedRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const unmaskedVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';

    return `${renderer}|${vendor}|${version}|${extensions}|${unmaskedRenderer}|${unmaskedVendor}`;
  }

  static async getAudioFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);

        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += Math.abs(buffer[i]);
          }
          
          oscillator.disconnect();
          scriptProcessor.disconnect();
          audioContext.close();
          
          resolve(sum.toString());
        };

        oscillator.start(0);
      } catch {
        resolve('audio-error');
      }
    });
  }

  static getScreenMetrics(): object {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type || 'unknown'
    };
  }

  static getFontFingerprint(): string {
    const testFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Calibri', 'Cambria'
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const defaultWidth = this.measureText(ctx, testString, testSize, 'monospace');
    const defaultHeight = this.measureText(ctx, testString, testSize, 'sans-serif');

    return testFonts.map(font => {
      const width = this.measureText(ctx, testString, testSize, font + ',monospace');
      const height = this.measureText(ctx, testString, testSize, font + ',sans-serif');
      return (width !== defaultWidth || height !== defaultHeight) ? font : null;
    }).filter(Boolean).join(',');
  }

  static getTimezoneFingerprint(): object {
    const date = new Date();
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: date.getTimezoneOffset(),
      dst: this.isDST(date),
      locale: navigator.language,
      dateString: date.toString(),
      utcString: date.toUTCString()
    };
  }

  static getHardwareFingerprint(): object {
    return {
      cores: navigator.hardwareConcurrency || 0,
      memory: (navigator as any).deviceMemory || 0,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  // Helper methods
  private static measureText(ctx: CanvasRenderingContext2D, text: string, size: string, font: string): number {
    ctx.font = size + ' ' + font;
    return ctx.measureText(text).width;
  }

  private static isDST(date: Date): boolean {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset()) !== date.getTimezoneOffset();
  }

  private static calculateImageNoise(data: Uint8ClampedArray): number {
    let noise = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      noise += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
    }
    return noise;
  }

  private static hashComponents(components: any[]): string {
    const str = JSON.stringify(components);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Detect spoofing attempts
  static async detectSpoofing(): Promise<{ spoofed: boolean; indicators: string[] }> {
    const indicators: string[] = [];

    // Check for common spoofing patterns
    if (this.detectCanvasSpoofing()) indicators.push('canvas_spoofing');
    if (this.detectWebGLSpoofing()) indicators.push('webgl_spoofing');
    if (this.detectTimezoneInconsistency()) indicators.push('timezone_inconsistency');
    if (this.detectUserAgentSpoofing()) indicators.push('useragent_spoofing');

    return {
      spoofed: indicators.length > 0,
      indicators
    };
  }

  private static detectCanvasSpoofing(): boolean {
    // Check for identical canvas outputs (common in spoofing tools)
    const canvas1 = this.getCanvasFingerprint();
    const canvas2 = this.getCanvasFingerprint();
    return canvas1 === canvas2; // Should be identical, but check for known spoofed values
  }

  private static detectWebGLSpoofing(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return false;

    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // Check for common spoofed values
    const spoofedValues = ['Google Inc.', 'Mozilla', 'WebKit', 'Generic Renderer'];
    return spoofedValues.some(val => renderer.includes(val) || vendor.includes(val));
  }

  private static detectTimezoneInconsistency(): boolean {
    const jsTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetTimezone = new Date().getTimezoneOffset();
    
    // Basic consistency check - more sophisticated checks would use IP geolocation
    return Math.abs(offsetTimezone) > 720; // Suspicious if offset > 12 hours
  }

  private static detectUserAgentSpoofing(): boolean {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    // Check for inconsistencies between UA and platform
    if (ua.includes('Windows') && !platform.includes('Win')) return true;
    if (ua.includes('Mac') && !platform.includes('Mac')) return true;
    if (ua.includes('Linux') && !platform.includes('Linux')) return true;
    
    return false;
  }
}
