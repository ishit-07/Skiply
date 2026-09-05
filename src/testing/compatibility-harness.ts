import { ActiveVideoDetector } from '../content/active-video-detector';
import { GenericSkipControlDetector, type CandidateControl } from '../content/generic-skip-control-detector';
import { SkipController, type SkipActionResult } from '../content/skip-controller';

export interface CompatibilityScenario {
  id: string;
  description: string;
  setup: () => void;
}

export interface CompatibilityResult {
  scenario: CompatibilityScenario;
  candidates: CandidateControl[];
  action: SkipActionResult | null;
}

const makeVisible = (element: HTMLElement): void => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 0, left: 0, right: 640, bottom: 360, width: 640, height: 360 })
  });
  Object.defineProperty(element, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 640, height: 360 }]
  });
};

const appendPlayingVideo = (): HTMLVideoElement => {
  const video = document.createElement('video');
  Object.defineProperty(video, 'paused', { configurable: true, value: false });
  Object.defineProperty(video, 'ended', { configurable: true, value: false });
  Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
  Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 1 });
  makeVisible(video);
  document.body.append(video);
  return video;
};

const appendButton = (label: string, attributes: Record<string, string> = {}): HTMLButtonElement => {
  const button = document.createElement('button');
  button.textContent = label;
  Object.entries(attributes).forEach(([name, value]) => button.setAttribute(name, value));
  makeVisible(button);
  document.body.append(button);
  return button;
};

export const compatibilityScenarios: readonly CompatibilityScenario[] = [
  { id: 'visible-text', description: 'button with visible Skip Intro text', setup: () => appendButton('Skip Intro') },
  {
    id: 'aria-label',
    description: 'button with an accessible Skip Intro label',
    setup: () => appendButton('', { 'aria-label': 'Skip Intro' })
  },
  {
    id: 'role-button',
    description: 'role button with visible Skip Intro text',
    setup: () => {
      const element = document.createElement('div');
      element.setAttribute('role', 'button');
      element.textContent = 'Skip Intro';
      makeVisible(element);
      document.body.append(element);
    }
  },
  {
    id: 'data-attribute',
    description: 'button with a data-testid skip hint',
    setup: () => appendButton('Continue', { 'data-testid': 'skip-intro' })
  },
  {
    id: 'advertisement',
    description: 'advertisement skip control',
    setup: () => appendButton('Skip Ad')
  },
  {
    id: 'next-episode',
    description: 'next episode control',
    setup: () => appendButton('Next Episode')
  }
];

export const runCompatibilityScenario = (scenario: CompatibilityScenario): CompatibilityResult => {
  document.body.innerHTML = '';
  const video = appendPlayingVideo();
  scenario.setup();
  const candidates = new GenericSkipControlDetector().findCandidates(document, video);
  const controller = new SkipController();
  controller.setActiveVideo(video);
  const action = controller.processCandidates(candidates);
  return { scenario, candidates, action };
};

export const runCompatibilityHarness = (): CompatibilityResult[] =>
  compatibilityScenarios.map(runCompatibilityScenario);

export const createHarnessDetector = (): ActiveVideoDetector => new ActiveVideoDetector();
