export class DocsPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public render(): void {
    this.container.innerHTML = `
      <div class="space-y-6 max-w-4xl mx-auto">
        <!-- Title Banner -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-5">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-symbols-outlined text-primary">terminal</span>
            <h2 class="font-headline font-bold text-lg uppercase tracking-tight text-on-surface">System Architecture & Technical Manual</h2>
          </div>
          <p class="text-xs text-on-surface-variant font-mono">
            N-Queen Algorithm Tester & Visualizer // Core Protocols, Problem Definitions & C++ Integration
          </p>
        </div>

        <!-- Section 1: Problem Specifications -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
          <h3 class="font-headline font-bold text-sm uppercase text-on-surface border-b-2 border-outline pb-2 flex items-center gap-2">
            <span class="w-3 h-3 bg-primary-fixed border border-outline inline-block"></span>
            1. Problem Categories Specification
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div class="p-3 bg-surface-container-low border border-outline space-y-1">
              <div class="font-bold text-on-surface uppercase">A. Normal N-Queen</div>
              <p class="text-on-surface-variant leading-relaxed">
                Standard NxN board. Exactly N queens placed, 1 per row, no two queens attacking each other along rows, columns, or diagonals.
              </p>
            </div>
            <div class="p-3 bg-surface-container-low border border-outline space-y-1">
              <div class="font-bold text-tertiary uppercase">B. Pre-placed Queens</div>
              <p class="text-on-surface-variant leading-relaxed">
                Specific queens are locked in user-defined coordinates. The solver must find valid configurations while strictly retaining those locked queens.
              </p>
            </div>
            <div class="p-3 bg-surface-container-low border border-outline space-y-1">
              <div class="font-bold text-secondary uppercase">C. N-Queen with Holes</div>
              <p class="text-on-surface-variant leading-relaxed">
                Certain cells are forbidden (holes). Queens cannot be placed on holes, but holes DO NOT block attack sightlines.
              </p>
            </div>
            <div class="p-3 bg-surface-container-low border border-outline space-y-1">
              <div class="font-bold text-on-surface uppercase">D. N-Queen with Walls (Barriers)</div>
              <p class="text-on-surface-variant leading-relaxed">
                Walls block queens' attack rays along the line of sight! Objective is to maximize non-conflicting queens placed across chambers.
              </p>
            </div>
          </div>
        </div>

        <!-- Section 2: Future C++17 & WebAssembly Integration -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-4">
          <h3 class="font-headline font-bold text-sm uppercase text-on-surface border-b-2 border-outline pb-2 flex items-center gap-2">
            <span class="w-3 h-3 bg-secondary border border-outline inline-block"></span>
            2. C++17 & WebAssembly (Emscripten) Integration Strategy
          </h3>
          <p class="text-xs font-mono text-on-surface-variant leading-relaxed">
            The frontend communicates via an asynchronous <strong>Web Worker</strong> layer. Adding a C++ solver does not require any UI changes:
          </p>
          <div class="bg-primary text-on-primary p-4 border border-outline font-mono text-xs overflow-x-auto leading-relaxed">
<pre><code>// 1. Compile C++ solver with Emscripten:
emcc -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
     solver.cpp -o nqueen_solver.js

// 2. Wrap module inside TypeScript ISolver interface:
export class WasmCppSolver implements ISolver {
  public async solve(config: BoardConfiguration) {
    const configJson = JSON.stringify(config);
    const resultJson = Module.ccall('solveProblemJSON', 'string', ['string'], [configJson]);
    return JSON.parse(resultJson);
  }
}</code></pre>
          </div>
        </div>

        <!-- Section 3: Benchmarking Rigor -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-5 space-y-3">
          <h3 class="font-headline font-bold text-sm uppercase text-on-surface border-b-2 border-outline pb-2 flex items-center gap-2">
            <span class="w-3 h-3 bg-tertiary border border-outline inline-block"></span>
            3. Benchmarking Methodology & Statistical Formulas
          </h3>
          <div class="space-y-2 text-xs font-mono text-on-surface-variant leading-relaxed">
            <div>• <strong>Run Cycle:</strong> 1x Validation &rarr; 1x Warmup &rarr; 7x Fresh Instance Iterations.</div>
            <div>• <strong>Median vs Average:</strong> We prioritize Median execution time to prevent JIT warm-up outliers from skewing results.</div>
            <div>• <strong>Median Absolute Deviation (MAD):</strong> <code class="bg-surface-container px-1 py-0.5 border border-outline font-bold">MAD = Median(|X_i - Median(X)|)</code> provides a robust measure of variability.</div>
          </div>
        </div>
      </div>
    `;
  }
}
