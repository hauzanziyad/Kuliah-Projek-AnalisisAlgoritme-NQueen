import { store, ActiveTab } from '../../state/app-state';

export class Header {
  constructor() {
    this.initNavigation();
    this.initTheme();
    store.subscribe(state => this.updateUI(state));
  }

  private initNavigation(): void {
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a[data-path]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.dataset.path;
        let targetTab: ActiveTab = 'visualizer';
        if (path === 'algorithm-comparison') targetTab = 'comparison';
        else if (path === 'benchmark-runner') targetTab = 'benchmark';
        else if (path === 'documentation-/-architecture') targetTab = 'docs';

        store.setState({ currentTab: targetTab });
      });
    });
  }

  private initTheme(): void {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.applyTheme(savedTheme as 'light' | 'dark');

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const curTheme = store.getState().theme;
        const newTheme = curTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
      });
    }
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    store.setState({ theme });
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) {
      themeLabel.innerText = theme === 'dark' ? 'BAUHAUS_DARK' : 'BAUHAUS_LIGHT';
    }
  }

  private updateUI(state: ReturnType<typeof store.getState>): void {
    // 1. Update Navigation Active Classes
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a[data-path]');
    navLinks.forEach(link => {
      const path = link.dataset.path;
      let isCurrent = false;
      if (state.currentTab === 'visualizer' && path === 'visualizer-&-playground') isCurrent = true;
      if (state.currentTab === 'comparison' && path === 'algorithm-comparison') isCurrent = true;
      if (state.currentTab === 'benchmark' && path === 'benchmark-runner') isCurrent = true;
      if (state.currentTab === 'docs' && path === 'documentation-/-architecture') isCurrent = true;

      if (isCurrent) {
        link.className = 'flex items-center gap-3 px-3 py-2.5 uppercase tracking-wider transition-none bg-primary-container text-on-primary-container font-bold border-2 border-outline shadow-[2px_2px_0px_#1a1a1a]';
      } else {
        link.className = 'flex items-center gap-3 px-3 py-2.5 text-xs font-label uppercase tracking-wider text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-transparent transition-none';
      }
    });

    // 2. Tab Views visibility
    const visualizerView = document.getElementById('view-visualizer');
    const comparisonView = document.getElementById('view-comparison');
    const docsView = document.getElementById('view-docs');

    if (visualizerView) visualizerView.style.display = state.currentTab === 'visualizer' ? 'block' : 'none';
    if (comparisonView) comparisonView.style.display = (state.currentTab === 'comparison' || state.currentTab === 'benchmark') ? 'block' : 'none';
    if (docsView) docsView.style.display = state.currentTab === 'docs' ? 'block' : 'none';
  }
}
