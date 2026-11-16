import { Header } from './components/header/header';
import { BoardRenderer } from './components/board/board-renderer';
import { ConfigPanel } from './components/config/config-panel';
import { ExecutionControls } from './components/controls/execution-controls';
import { SolutionBrowser } from './components/results/solution-browser';
import { ComparisonPanel } from './components/comparison/comparison-panel';
import { DocsPanel } from './components/docs/docs-panel';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Header & Navigation
  new Header();

  // 2. Initialize Config Panel
  new ConfigPanel();

  // 3. Initialize Board Renderer
  const boardMatrix = document.getElementById('board-matrix') as HTMLElement;
  const colLabels = document.getElementById('board-col-labels') as HTMLElement;
  const rowLabels = document.getElementById('board-row-labels') as HTMLElement;
  if (boardMatrix && colLabels && rowLabels) {
    new BoardRenderer(boardMatrix, colLabels, rowLabels);
  }

  // 4. Initialize Execution Controls
  const logTerminal = document.getElementById('log-terminal') as HTMLElement;
  if (logTerminal) {
    new ExecutionControls(logTerminal);
  }

  // 5. Initialize Solution Browser & Metrics
  const miniThumbnail = document.getElementById('mini-thumbnail') as HTMLElement;
  const vectorText = document.getElementById('vector-text') as HTMLElement;
  if (miniThumbnail && vectorText) {
    new SolutionBrowser(miniThumbnail, vectorText);
  }

  // 6. Initialize Comparison & Benchmark Panel
  const comparisonContainer = document.getElementById('comparison-container') as HTMLElement;
  if (comparisonContainer) {
    new ComparisonPanel(comparisonContainer);
  }

  // 7. Initialize Docs Panel
  const docsContainer = document.getElementById('docs-container') as HTMLElement;
  if (docsContainer) {
    new DocsPanel(docsContainer);
  }
});
