import { BoardConfiguration, BoardCoordinate } from '../types/problem';

export interface ValidationReport {
  isValid: boolean;
  conflicts: Array<{ q1: BoardCoordinate; q2: BoardCoordinate; reason: string }>;
  errors: string[];
}

export class ProblemValidator {
  /**
   * Cek apakah ada dinding (wall) di antara coord1 dan coord2 pada garis lurus (horizontal, vertical, diagonal).
   */
  public static isBlockedByWall(
    c1: BoardCoordinate,
    c2: BoardCoordinate,
    walls: BoardCoordinate[]
  ): boolean {
    const dr = Math.sign(c2.row - c1.row);
    const dc = Math.sign(c2.col - c1.col);

    // Harus segaris (horizontal, vertical, atau diagonal 45 derajat)
    const rowDiff = Math.abs(c2.row - c1.row);
    const colDiff = Math.abs(c2.col - c1.col);
    if (rowDiff !== 0 && colDiff !== 0 && rowDiff !== colDiff) {
      return false; // Bukan satu jalur serang
    }

    let currR = c1.row + dr;
    let currC = c1.col + dc;

    while (currR !== c2.row || currC !== c2.col) {
      if (walls.some(w => w.row === currR && w.col === currC)) {
        return true; // Ada dinding menghalangi sinar serangan
      }
      currR += dr;
      currC += dc;
    }

    return false;
  }

  /**
   * Cek apakah dua queen saling menyerang dengan mempertimbangkan walls
   */
  public static doQueensConflict(
    q1: BoardCoordinate,
    q2: BoardCoordinate,
    walls: BoardCoordinate[]
  ): { conflict: boolean; reason?: string } {
    if (q1.row === q2.row && q1.col === q2.col) {
      return { conflict: true, reason: 'Same cell overlap' };
    }

    const rowDiff = Math.abs(q1.row - q2.row);
    const colDiff = Math.abs(q1.col - q2.col);

    let isRay = false;
    let reason = '';

    if (q1.row === q2.row) {
      isRay = true;
      reason = 'Horizontal (Row)';
    } else if (q1.col === q2.col) {
      isRay = true;
      reason = 'Vertical (Column)';
    } else if (rowDiff === colDiff) {
      isRay = true;
      reason = 'Diagonal';
    }

    if (!isRay) {
      return { conflict: false };
    }

    // Jika ada wall di antara kedua queen, serangan terhalang
    if (this.isBlockedByWall(q1, q2, walls)) {
      return { conflict: false };
    }

    return { conflict: true, reason };
  }

  /**
   * Validasi menyeluruh terhadap penempatan queen
   */
  public static validateSolution(
    queens: BoardCoordinate[],
    config: BoardConfiguration
  ): ValidationReport {
    const errors: string[] = [];
    const conflicts: Array<{ q1: BoardCoordinate; q2: BoardCoordinate; reason: string }> = [];

    // 1. Cek jumlah queen
    if (config.category !== 'walled') {
      if (queens.length !== config.n) {
        errors.push(`Expected exactly ${config.n} queens, found ${queens.length}`);
      }
    }

    // 2. Cek apakah ada queen di atas Hole
    for (const q of queens) {
      if (config.holes.some(h => h.row === q.row && h.col === q.col)) {
        errors.push(`Queen placed on forbidden Hole at [${q.row}, ${q.col}]`);
      }
    }

    // 3. Cek apakah ada queen di atas Wall
    for (const q of queens) {
      if (config.walls.some(w => w.row === q.row && w.col === q.col)) {
        errors.push(`Queen placed on Wall obstacle at [${q.row}, ${q.col}]`);
      }
    }

    // 4. Cek apakah seluruh locked queens dipertahankan
    if (config.category === 'preplaced') {
      for (const lq of config.lockedQueens) {
        const found = queens.some(q => q.row === lq.row && q.col === lq.col);
        if (!found) {
          errors.push(`Missing pre-placed locked Queen at [${lq.row}, ${lq.col}]`);
        }
      }
    }

    // 5. Cek konflik antar pasangan queen
    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const check = this.doQueensConflict(queens[i], queens[j], config.walls);
        if (check.conflict) {
          conflicts.push({
            q1: queens[i],
            q2: queens[j],
            reason: check.reason || 'Attack line'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0 && conflicts.length === 0,
      conflicts,
      errors
    };
  }

  /**
   * Menghitung seluruh sel yang terancam (threat rays) oleh queen-queen yang ada
   */
  public static calculateThreatMatrix(
    queens: BoardCoordinate[],
    n: number,
    walls: BoardCoordinate[]
  ): boolean[][] {
    const threat: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Horiz & Vert
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonals
    ];

    for (const q of queens) {
      for (const [dr, dc] of directions) {
        let r = q.row + dr;
        let c = q.col + dc;

        while (r >= 0 && r < n && c >= 0 && c < n) {
          // Jika menabrak wall, sinar terhenti
          if (walls.some(w => w.row === r && w.col === c)) {
            break;
          }
          threat[r][c] = true;
          r += dr;
          c += dc;
        }
      }
    }

    return threat;
  }
}
