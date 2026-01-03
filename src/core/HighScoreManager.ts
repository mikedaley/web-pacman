const STORAGE_KEY = 'pacman-high-score';

export class HighScoreManager {
  private highScore: number;

  constructor() {
    this.highScore = this.load();
  }

  private load(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const value = parseInt(stored, 10);
        return isNaN(value) ? 0 : value;
      }
    } catch {
      // localStorage may be unavailable
    }
    return 0;
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, this.highScore.toString());
    } catch {
      // localStorage may be unavailable
    }
  }

  getHighScore(): number {
    return this.highScore;
  }

  updateHighScore(score: number): boolean {
    if (score > this.highScore) {
      this.highScore = score;
      this.save();
      return true;
    }
    return false;
  }
}
