import type { SkipType } from '../shared/settings';

export type DetectionSource =
  | 'visible-text'
  | 'aria-label'
  | 'aria-labelledby'
  | 'title'
  | 'data-attribute'
  | 'structural-context'
  | 'platform-adapter';

export interface CandidateControl {
  element: HTMLElement;
  type: SkipType;
  confidence: number;
  detectionSource: DetectionSource;
  evidence: ConfidenceEvidence[];
}

export interface ControlSurfaceDiagnostic {
  tagName: string;
  role: string | null;
  text: string;
  ariaLabel: string | null;
  title: string | null;
  visible: boolean;
  enabled: boolean;
  matchedPhrase: string | null;
  matchedType: SkipType | null;
  stage: 'matched' | 'not-matched' | 'hidden' | 'disabled';
}

export interface ControlSurfaceReport {
  controls: ControlSurfaceDiagnostic[];
  truncated: boolean;
  openShadowHosts: number;
  nestedIframes: number;
  canvasElements: number;
}

export interface ConfidenceEvidence {
  kind: string;
  weight: number;
}

export interface PhraseDictionary {
  intro: string[];
  recap: string[];
  credits: string[];
  exclusions: string[];
}

export interface GenericDetectorOptions {
  phrases?: Partial<PhraseDictionary>;
  minimumConfidence?: number;
}

export const DEFAULT_PHRASES: PhraseDictionary = {
  intro: [
    'skip intro',
    'skip introduction',
    'skip opening',
    'skip opening credits',
    'saltar intro',
    'passer intro',
    'intro überspringen',
    'intro ignorieren',
    'イントロをスキップ',
    'オープニングをスキップ'
  ],
  recap: [
    'skip recap',
    'skip summary',
    'skip previously on',
    'skip previously on...',
    'saltar resumen',
    'passer le résumé',
    'zusammenfassung überspringen',
    'recap überspringen',
    'リキャップをスキップ'
  ],
  credits: [
    'skip credits',
    'skip end credits',
    'skip closing credits',
    'saltar créditos',
    'passer le générique',
    'abspann überspringen',
    'エンドクレジットをスキップ'
  ],
  exclusions: [
    'skip ad',
    'skip ads',
    'skip advertisement',
    'skip trailer',
    'skip preview',
    'next episode',
    'watch next',
    'play next',
    'saltar anuncio',
    'annonce'
  ]
};

const CONTROL_SELECTOR =
  'button, [role="button"], input[type="button"], input[type="submit"], [tabindex]:not([tabindex="-1"])';
const SOURCE_PRIORITY: DetectionSource[] = [
  'aria-label',
  'aria-labelledby',
  'visible-text',
  'title',
  'data-attribute',
  'structural-context'
];

const normalizePhrase = (value: string): string =>
  value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[.…:!?()[\]{}"'`]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeControlText = (value: string): string => normalizePhrase(value);

const mergePhrases = (custom: Partial<PhraseDictionary> | undefined): PhraseDictionary => ({
  intro: [...DEFAULT_PHRASES.intro, ...(custom?.intro ?? [])],
  recap: [...DEFAULT_PHRASES.recap, ...(custom?.recap ?? [])],
  credits: [...DEFAULT_PHRASES.credits, ...(custom?.credits ?? [])],
  exclusions: [...DEFAULT_PHRASES.exclusions, ...(custom?.exclusions ?? [])]
});

const getLabelledByText = (element: HTMLElement): string => {
  const ids = element.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
  return ids
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .filter(Boolean)
    .join(' ');
};

const getDataAttributeText = (element: HTMLElement): string =>
  Array.from(element.attributes)
    .filter(({ name }) => name.startsWith('data-'))
    .map(({ value }) => value)
    .join(' ');

const isVisible = (element: HTMLElement): boolean => {
  if (!element.isConnected) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    (style.opacity !== '' && Number(style.opacity) === 0)
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0 || element.getClientRects().length > 0;
};

const isEnabled = (element: HTMLElement): boolean => {
  if (element.matches(':disabled,[aria-disabled="true"]')) {
    return false;
  }

  return element.getAttribute('disabled') === null;
};

const getAccessibleSignals = (
  element: HTMLElement
): Array<{ source: DetectionSource; value: string }> => [
  { source: 'visible-text', value: element.innerText || element.textContent || '' },
  { source: 'aria-label', value: element.getAttribute('aria-label') ?? '' },
  { source: 'aria-labelledby', value: getLabelledByText(element) },
  { source: 'title', value: element.getAttribute('title') ?? '' },
  { source: 'data-attribute', value: getDataAttributeText(element) }
];

const truncateDiagnosticText = (value: string, maxLength = 120): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, maxLength);

export const inspectControlSurface = (
  root: Document = document,
  limit = 50
): ControlSurfaceReport => {
  const controls = Array.from(root.querySelectorAll<HTMLElement>(CONTROL_SELECTOR));
  const diagnostics = controls.slice(0, limit).map((element): ControlSurfaceDiagnostic => {
    const visible = isVisible(element);
    const enabled = isEnabled(element);
    const signals = getAccessibleSignals(element);
    const matchedSignal = signals
      .map((signal) => ({ ...signal, match: findPhraseMatch(signal.value, mergePhrases(undefined)) }))
      .find((signal) => signal.match);

    return {
      tagName: element.tagName.toLowerCase(),
      role: element.getAttribute('role'),
      text: truncateDiagnosticText(element.innerText || element.textContent || ''),
      ariaLabel: element.getAttribute('aria-label'),
      title: element.getAttribute('title'),
      visible,
      enabled,
      matchedPhrase: matchedSignal?.match?.phrase ?? null,
      matchedType: matchedSignal?.match?.type ?? null,
      stage: !visible ? 'hidden' : !enabled ? 'disabled' : matchedSignal?.match ? 'matched' : 'not-matched'
    };
  });

  return {
    controls: diagnostics,
    truncated: controls.length > limit,
    openShadowHosts: Array.from(root.querySelectorAll<HTMLElement>('*')).filter(
      (element) => element.shadowRoot !== null
    ).length,
    nestedIframes: root.querySelectorAll('iframe').length,
    canvasElements: root.querySelectorAll('canvas').length
  };
};

const findPhraseMatch = (
  text: string,
  phrases: PhraseDictionary
): { type: SkipType; phrase: string } | null => {
  const normalized = normalizePhrase(text);
  if (!normalized || phrases.exclusions.some((phrase) => normalized.includes(normalizePhrase(phrase)))) {
    return null;
  }

  for (const type of ['intro', 'recap', 'credits'] as const) {
    const phrase = phrases[type].find((candidate) => normalized.includes(normalizePhrase(candidate)));
    if (phrase) {
      return { type, phrase };
    }
  }

  return null;
};

export const calculateControlConfidence = (
  element: HTMLElement,
  source: DetectionSource,
  options: { activeVideo?: HTMLVideoElement | null; phraseMatch: boolean }
): { confidence: number; evidence: ConfidenceEvidence[] } => {
  const evidence: ConfidenceEvidence[] = [];
  let confidence = 0;

  if (options.phraseMatch) {
    confidence += source === 'aria-label' || source === 'aria-labelledby' ? 0.62 : 0.58;
    evidence.push({ kind: source, weight: confidence });
  }
  if (isVisible(element)) {
    confidence += 0.14;
    evidence.push({ kind: 'visible', weight: 0.14 });
  }
  if (isEnabled(element)) {
    confidence += 0.1;
    evidence.push({ kind: 'enabled', weight: 0.1 });
  }
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    confidence += 0.08;
    evidence.push({ kind: 'button-role', weight: 0.08 });
  }
  if (options.activeVideo) {
    const player = options.activeVideo.closest('section,article,main,div');
    if (player?.contains(element)) {
      confidence += 0.06;
      evidence.push({ kind: 'near-active-video', weight: 0.06 });
    }
  }

  return { confidence: Math.round(Math.min(1, confidence) * 100) / 100, evidence };
};

export class GenericSkipControlDetector {
  private readonly phrases: PhraseDictionary;
  private readonly minimumConfidence: number;

  public constructor(options: GenericDetectorOptions = {}) {
    this.phrases = mergePhrases(options.phrases);
    this.minimumConfidence = options.minimumConfidence ?? 0;
  }

  public findCandidates(root: Document = document, activeVideo: HTMLVideoElement | null = null): CandidateControl[] {
    const candidates: CandidateControl[] = [];
    const seen = new Set<HTMLElement>();

    for (const element of Array.from(root.querySelectorAll<HTMLElement>(CONTROL_SELECTOR))) {
      if (seen.has(element) || !isVisible(element) || !isEnabled(element)) {
        continue;
      }

      const signals = getAccessibleSignals(element);
      const matchedSignal = signals
        .map((signal) => ({ ...signal, match: findPhraseMatch(signal.value, this.phrases) }))
        .filter((signal) => signal.match)
        .sort((left, right) => SOURCE_PRIORITY.indexOf(left.source) - SOURCE_PRIORITY.indexOf(right.source))[0];

      if (!matchedSignal?.match) {
        continue;
      }

      const result = calculateControlConfidence(element, matchedSignal.source, {
        activeVideo,
        phraseMatch: true
      });
      if (result.confidence < this.minimumConfidence) {
        continue;
      }

      candidates.push({
        element,
        type: matchedSignal.match.type,
        confidence: result.confidence,
        detectionSource: matchedSignal.source,
        evidence: result.evidence
      });
      seen.add(element);
    }

    return candidates.sort((left, right) => right.confidence - left.confidence);
  }
}
