import { store } from '../../state/app-state';
import { workerBridge } from '../../core/worker-bridge';
import { SolverRegistry } from '../../worker/solver-registry';
import { SolverBenchmarkReport } from '../../types/benchmark';

export class ComparisonPanel {
  private container: HTMLElement;
  private selectedSolvers: Set<string> = new Set(['backtracking', 'bitwise', 'csp', 'greedy_wall']);
  private isBenchmarking: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    store.subscribe(() => {
      // Re-render if tab switches to comparison or benchmark
      const tab = store.getState().currentTab;
      if (tab === 'comparison' || tab === 'benchmark') {
        // Keep view updated
      }
    });
  }

  public render(): void {
    const state = store.getState();
    const allSolvers = SolverRegistry.getAllSolverInfos();

    this.container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Banner -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary">speed</span>
              <h2 class="font-headline font-bold text-lg uppercase tracking-tight text-on-surface">Multi-Algorithm Benchmark & Comparison</h2>
            </div>
            <p class="text-xs text-on-surface-variant font-mono mt-1">
              Configuration: N=${state.config.n} (${state.config.category.toUpperCase()}) | Warmup + 7 Runs / Solver | MAD & Peak Mem
            </p>
          </div>

          <button id="btn-start-benchmark" class="px-5 py-2.5 bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed hover:text-on-primary-container border-2 border-outline shadow-[3px_3px_0px_#1a1a1a] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5">
            <span class="material-symbols-outlined text-[18px]">play_arrow</span>
            <span id="btn-benchmark-text">Run 7x Benchmark</span>
          </button>
        </div>

        <!-- Solver Selector Chips -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4">
          <div class="text-xs font-headline uppercase font-bold text-on-surface mb-3 flex items-center justify-between">
            <span>Select Target Solvers:</span>
            <span class="text-[10px] font-mono text-on-surface-variant">4 Solvers Ready</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            ${allSolvers.map(s => `
              <label class="flex items-start gap-2.5 p-3 border-2 border-outline cursor-pointer bg-surface-container-low hover:bg-surface-container transition-none ${this.selectedSolvers.has(s.id) ? 'border-primary bg-primary-container/30' : ''}">
                <input type="checkbox" value="${s.id}" ${this.selectedSolvers.has(s.id) ? 'checked' : ''} class="solver-checkbox mt-0.5 accent-primary cursor-pointer"/>
                <div class="space-y-0.5">
                  <div class="font-headline font-bold text-xs uppercase">${s.name}</div>
                  <div class="text-[10px] font-mono text-tertiary font-bold">${s.badge}</div>
                  <div class="text-[10px] text-on-surface-variant line-clamp-1">${s.description}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Progress Bar (Hidden by default) -->
        <div id="benchmark-progress-box" class="hidden bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4 space-y-2">
          <div class="flex items-center justify-between text-xs font-mono">
            <span id="benchmark-status-text" class="font-bold text-secondary">BENCHMARKING IN PROGRESS...</span>
            <span id="benchmark-percent" class="font-bold">0%</span>
          </div>
          <div class="w-full h-3 bg-surface-container-highest border border-outline overflow-hidden">
            <div id="benchmark-progress-bar" class="h-full bg-primary transition-all duration-150" style="width: 0%"></div>
          </div>
        </div>

        <!-- Results Area (Charts & Comparison Table) -->
        <div id="benchmark-results-container" class="space-y-6">
          <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-8 text-center text-on-surface-variant font-mono text-xs">
            No benchmark report generated yet. Click <strong>"Run 7x Benchmark"</strong> above to evaluate solvers on the current board configuration.
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    // Checkbox events
    this.container.querySelectorAll<HTMLInputElement>('.solver-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          this.selectedSolvers.add(cb.value);
        } else {
          this.selectedSolvers.delete(cb.value);
        }
      });
    });

    // Benchmark Run Button
    const btn = this.container.querySelector('#btn-start-benchmark');
    if (btn) {
      btn.addEventListener('click', () => this.runBenchmark());
    }
  }

  public runBenchmark(): void {
    if (this.isBenchmarking) return;
    if (this.selectedSolvers.size === 0) {
      alert('Please select at least one solver to benchmark!');
      return;
    }

    this.isBenchmarking = true;
    const progressBox = this.container.querySelector('#benchmark-progress-box') as HTMLElement;
    const progressBar = this.container.querySelector('#benchmark-progress-bar') as HTMLElement;
    const progressStatus = this.container.querySelector('#benchmark-status-text') as HTMLElement;
    const progressPercent = this.container.querySelector('#benchmark-percent') as HTMLElement;
    const btnText = this.container.querySelector('#btn-benchmark-text') as HTMLElement;

    if (progressBox) progressBox.classList.remove('hidden');
    if (btnText) btnText.innerText = 'Testing...';

    const solverIds = Array.from(this.selectedSolvers);
    const totalSteps = solverIds.length * 8; // 1 warm + 7 runs
    let completedSteps = 0;

    workerBridge.runBenchmark(
      solverIds,
      store.getState().config,
      {
        onProgress: (solverId, run, totalRuns) => {
          completedSteps++;
          const pct = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
          if (progressBar) progressBar.style.width = `${pct}%`;
          if (progressPercent) progressPercent.innerText = `${pct}%`;
          if (progressStatus) {
            progressStatus.innerText = `Evaluating ${solverId.toUpperCase()} [Run #${run} of ${totalRuns}]`;
          }
        },
        onCompleted: (reports) => {
          this.isBenchmarking = false;
          if (progressBox) progressBox.classList.add('hidden');
          if (btnText) btnText.innerText = 'Run 7x Benchmark';
          this.renderBenchmarkReports(reports);
        },
        onError: (err) => {
          this.isBenchmarking = false;
          if (progressBox) progressBox.classList.add('hidden');
          if (btnText) btnText.innerText = 'Run 7x Benchmark';
          alert('Benchmark error: ' + err);
        }
      }
    );
  }

  private renderBenchmarkReports(reports: SolverBenchmarkReport[]): void {
    const resultsContainer = this.container.querySelector('#benchmark-results-container');
    if (!resultsContainer) return;

    // Find Best Performer (lowest median time)
    const validReports = reports.filter(r => r.isValid && r.metrics.medianExecutionTimeMs !== undefined);
    let best = validReports[0];
    for (const r of validReports) {
      if (r.metrics.medianExecutionTimeMs! < best.metrics.medianExecutionTimeMs!) {
        best = r;
      }
    }

    // Max values for relative bar chart scale
    const maxMedianTime = Math.max(...reports.map(r => r.metrics.medianExecutionTimeMs || 1), 1);
    const maxMemory = Math.max(...reports.map(r => r.metrics.memoryUsageKb || 1), 1);

    resultsContainer.innerHTML = `
      <!-- Winner Card -->
      ${best ? `
        <div class="bg-primary-container border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 bg-primary text-on-primary border border-outline flex items-center justify-center font-bold text-lg">★</span>
            <div>
              <div class="text-[10px] font-mono uppercase font-bold text-on-primary-container">Top Performer (Median Runtime):</div>
              <div class="font-headline font-bold text-base uppercase text-on-primary-container">${best.solverName}</div>
            </div>
          </div>
          <div class="text-right font-mono">
            <div class="text-xl font-bold text-on-primary-container">${best.metrics.medianExecutionTimeMs} ms</div>
            <div class="text-[10px] text-on-surface-variant font-bold">MAD: ±${best.metrics.madMs} ms</div>
          </div>
        </div>
      ` : ''}

      <!-- Visual Bar Charts (Execution Time & Memory) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Time Chart -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4">
          <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
            <span class="font-headline font-bold text-xs uppercase">Median Execution Time (ms)</span>
            <span class="text-[10px] font-mono text-secondary font-bold">LOWER IS BETTER</span>
          </div>
          <div class="space-y-3">
            ${reports.map(r => {
              const med = r.metrics.medianExecutionTimeMs ?? 0;
              const pct = Math.max(8, Math.round((med / maxMedianTime) * 100));
              const isBest = best && best.solverId === r.solverId;
              return `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="font-bold ${isBest ? 'text-secondary' : ''}">${r.solverName}</span>
                    <span class="font-bold">${med} ms</span>
                  </div>
                  <div class="w-full h-5 bg-surface-container-highest border border-outline overflow-hidden">
                    <div class="h-full ${isBest ? 'bg-secondary' : 'bg-primary'} transition-all duration-300" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Memory Chart -->
        <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4">
          <div class="flex items-center justify-between pb-3 border-b-2 border-outline mb-4">
            <span class="font-headline font-bold text-xs uppercase">Peak Heap Allocation (MB)</span>
            <span class="text-[10px] font-mono text-tertiary font-bold">ESTIMATED</span>
          </div>
          <div class="space-y-3">
            ${reports.map(r => {
              const mem = r.metrics.memoryUsageKb ?? 1.2;
              const pct = Math.max(12, Math.round((mem / maxMemory) * 100));
              return `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="font-bold">${r.solverName}</span>
                    <span class="font-bold">${mem} MB</span>
                  </div>
                  <div class="w-full h-5 bg-surface-container-highest border border-outline overflow-hidden">
                    <div class="h-full bg-tertiary transition-all duration-300" style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Comprehensive Data Table -->
      <div class="bg-surface-container-lowest border-2 border-outline shadow-[4px_4px_0px_#1a1a1a] p-4 overflow-x-auto">
        <div class="font-headline font-bold text-xs uppercase mb-3">7-Run Statistical Comparison Table</div>
        <table class="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr class="border-b-2 border-outline bg-surface-container-low text-on-surface uppercase text-[11px]">
              <th class="p-2.5">Algorithm</th>
              <th class="p-2.5">Status</th>
              <th class="p-2.5">Median</th>
              <th class="p-2.5">MAD</th>
              <th class="p-2.5">Best / Min</th>
              <th class="p-2.5">Worst / Max</th>
              <th class="p-2.5">Avg Nodes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline/30">
            ${reports.map(r => `
              <tr class="hover:bg-surface-container-low">
                <td class="p-2.5 font-bold">${r.solverName}</td>
                <td class="p-2.5">
                  <span class="px-2 py-0.5 border border-outline text-[10px] font-bold ${
                    r.validationStatus === 'VALID' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-secondary-fixed text-secondary'
                  }">
                    ${r.validationStatus}
                  </span>
                </td>
                <td class="p-2.5 font-bold text-on-surface">${r.metrics.medianExecutionTimeMs} ms</td>
                <td class="p-2.5 text-on-surface-variant">±${r.metrics.madMs} ms</td>
                <td class="p-2.5 text-[#10b981] font-bold">${r.metrics.minExecutionTimeMs} ms</td>
                <td class="p-2.5 text-secondary font-bold">${r.metrics.maxExecutionTimeMs} ms</td>
                <td class="p-2.5 text-on-surface-variant">${r.metrics.nodesExplored?.toLocaleString() ?? 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}
