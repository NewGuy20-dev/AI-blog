// Mouse tracking and behavioral analysis
export class MouseTracker {
  private movements: Array<{ x: number; y: number; timestamp: number }> = [];
  private clicks: Array<{ x: number; y: number; timestamp: number; button: number }> = [];
  private scrolls: Array<{ deltaY: number; timestamp: number }> = [];
  private isTracking = false;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    // Track mouse movements
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Track clicks
    document.addEventListener('click', this.handleClick.bind(this));
    
    // Track scrolling
    document.addEventListener('wheel', this.handleScroll.bind(this));
    
    // Track keyboard patterns
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Analyze patterns every 30 seconds
    setInterval(() => this.analyzeBehavior(), 30000);
  }

  private handleMouseMove(event: MouseEvent) {
    this.movements.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    });

    // Keep only last 100 movements
    if (this.movements.length > 100) {
      this.movements.shift();
    }
  }

  private handleClick(event: MouseEvent) {
    this.clicks.push({
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      button: event.button
    });

    // Keep only last 50 clicks
    if (this.clicks.length > 50) {
      this.clicks.shift();
    }
  }

  private handleScroll(event: WheelEvent) {
    this.scrolls.push({
      deltaY: event.deltaY,
      timestamp: Date.now()
    });

    // Keep only last 50 scrolls
    if (this.scrolls.length > 50) {
      this.scrolls.shift();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Track typing patterns for bot detection
    // Implementation would analyze timing between keystrokes
  }

  async analyzeBehavior(): Promise<{ suspicious: boolean; indicators: string[] }> {
    const indicators: string[] = [];
    let suspicious = false;

    // 1. Check for bot-like straight line movements
    if (this.detectStraightLines()) {
      indicators.push('straight_line_movements');
      suspicious = true;
    }

    // 2. Check for inhuman speed
    if (this.detectInhumanSpeed()) {
      indicators.push('inhuman_mouse_speed');
      suspicious = true;
    }

    // 3. Check for repetitive patterns
    if (this.detectRepetitivePatterns()) {
      indicators.push('repetitive_patterns');
      suspicious = true;
    }

    // 4. Check for lack of natural variation
    if (this.detectLackOfVariation()) {
      indicators.push('lack_of_natural_variation');
      suspicious = true;
    }

    // 5. Check click patterns
    if (this.detectSuspiciousClicks()) {
      indicators.push('suspicious_click_patterns');
      suspicious = true;
    }

    // Send to security system if suspicious
    if (suspicious) {
      await this.reportSuspiciousBehavior(indicators);
    }

    return { suspicious, indicators };
  }

  private detectStraightLines(): boolean {
    if (this.movements.length < 10) return false;

    let straightLineCount = 0;
    for (let i = 2; i < this.movements.length; i++) {
      const p1 = this.movements[i - 2];
      const p2 = this.movements[i - 1];
      const p3 = this.movements[i];

      // Check if three consecutive points are nearly in a straight line
      const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
      const slope2 = (p3.y - p2.y) / (p3.x - p2.x);

      if (Math.abs(slope1 - slope2) < 0.1) {
        straightLineCount++;
      }
    }

    return straightLineCount > this.movements.length * 0.7; // 70% straight lines = suspicious
  }

  private detectInhumanSpeed(): boolean {
    if (this.movements.length < 5) return false;

    let highSpeedCount = 0;
    for (let i = 1; i < this.movements.length; i++) {
      const prev = this.movements[i - 1];
      const curr = this.movements[i];

      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      const timeDiff = curr.timestamp - prev.timestamp;
      const speed = distance / timeDiff; // pixels per ms

      // Inhuman speed threshold (adjust based on testing)
      if (speed > 5) {
        highSpeedCount++;
      }
    }

    return highSpeedCount > this.movements.length * 0.3; // 30% high speed = suspicious
  }

  private detectRepetitivePatterns(): boolean {
    // Check for repeated sequences of movements
    if (this.movements.length < 20) return false;

    const sequences = [];
    for (let i = 0; i < this.movements.length - 5; i++) {
      const sequence = this.movements.slice(i, i + 5);
      sequences.push(sequence);
    }

    // Look for similar sequences (simplified)
    let repetitions = 0;
    for (let i = 0; i < sequences.length - 1; i++) {
      for (let j = i + 1; j < sequences.length; j++) {
        if (this.sequencesSimilar(sequences[i], sequences[j])) {
          repetitions++;
        }
      }
    }

    return repetitions > 3; // More than 3 repetitions = suspicious
  }

  private detectLackOfVariation(): boolean {
    if (this.movements.length < 20) return false;

    // Check if movements are too uniform
    const xVariations = this.movements.map(m => m.x);
    const yVariations = this.movements.map(m => m.y);

    const xStdDev = this.standardDeviation(xVariations);
    const yStdDev = this.standardDeviation(yVariations);

    // Too little variation = bot-like
    return xStdDev < 50 && yStdDev < 50;
  }

  private detectSuspiciousClicks(): boolean {
    if (this.clicks.length < 5) return false;

    // Check for too-regular click intervals
    const intervals = [];
    for (let i = 1; i < this.clicks.length; i++) {
      intervals.push(this.clicks[i].timestamp - this.clicks[i - 1].timestamp);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => {
      return acc + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;

    // Too regular = suspicious
    return variance < 1000; // Very low variance in click timing
  }

  private sequencesSimilar(seq1: any[], seq2: any[]): boolean {
    // Simplified similarity check
    let similarPoints = 0;
    for (let i = 0; i < seq1.length; i++) {
      const distance = Math.sqrt(
        Math.pow(seq1[i].x - seq2[i].x, 2) + Math.pow(seq1[i].y - seq2[i].y, 2)
      );
      if (distance < 20) similarPoints++;
    }
    return similarPoints >= seq1.length * 0.8;
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private async reportSuspiciousBehavior(indicators: string[]) {
    await fetch('/api/security/auto-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'suspicious_mouse_behavior',
        severity: 'high',
        userId: this.sessionId,
        ip: 'client-side',
        userAgent: navigator.userAgent,
        details: {
          indicators,
          movementCount: this.movements.length,
          clickCount: this.clicks.length,
          scrollCount: this.scrolls.length
        }
      })
    });
  }

  stopTracking() {
    this.isTracking = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('wheel', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

// Auto-start mouse tracking
if (typeof window !== 'undefined') {
  const tracker = new MouseTracker(crypto.randomUUID());
  tracker.startTracking();
}
