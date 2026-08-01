// Voice catalogs — the VITS/Piper models (Fangjun Kuang / csukuangfj) and the Kokoro multi-lang voices.
// Data only + pure grouping helpers; verified against the HF API in the original lab. Adding a voice is a
// data change here, not a code change in any adapter.

import type { Lang } from './port.js';
import { langOf } from './lang.js';

/** HuggingFace base for the csukuangfj repos: HF + <repo>/resolve/main/<file>. */
export const HF_BASE = 'https://huggingface.co/csukuangfj/';

/** Piper locales we ship, each mapped to the exact repo suffixes (= the .onnx basename) that EXIST on HF. */
export const PIPER_MODELS: Readonly<Record<string, readonly string[]>> = {
  pt_BR: ['pt_BR-faber-medium', 'pt_BR-miro-high', 'pt_BR-dii-high'],
  pt_PT: ['pt_PT-tugao-medium', 'pt_PT-miro-high', 'pt_PT-dii-high'],
  en_US: [
    'en_US-amy-medium', 'en_US-arctic-medium', 'en_US-bryce-medium', 'en_US-glados-high',
    'en_US-hfc_female-medium', 'en_US-hfc_male-medium', 'en_US-joe-medium', 'en_US-john-medium',
    'en_US-kristin-medium', 'en_US-kusal-medium', 'en_US-l2arctic-medium', 'en_US-lessac-medium',
    'en_US-lessac-high', 'en_US-libritts_r-medium', 'en_US-libritts-high', 'en_US-ljspeech-medium',
    'en_US-ljspeech-high', 'en_US-miro-high', 'en_US-norman-medium', 'en_US-ryan-medium', 'en_US-ryan-high',
  ],
  en_GB: [
    'en_GB-alan-medium', 'en_GB-alba-medium', 'en_GB-aru-medium', 'en_GB-cori-medium', 'en_GB-cori-high',
    'en_GB-dii-high', 'en_GB-jenny_dioco-medium', 'en_GB-miro-high', 'en_GB-northern_english_male-medium',
    'en_GB-semaine-medium', 'en_GB-southern_english_female-medium', 'en_GB-southern_english_male-medium',
    'en_GB-vctk-medium',
  ],
  es_AR: ['es_AR-daniela-high'],
  es_ES: ['es_ES-davefx-medium', 'es_ES-glados-medium', 'es_ES-miro-high', 'es_ES-sharvard-medium'],
  es_MX: ['es_MX-ald-medium', 'es_MX-claude-high'],
};

/** A voice option grouped under its locale, ready for an <optgroup>. `value` = the model id; `label` = voice-quality. */
export interface PiperOption {
  readonly value: string;
  readonly label: string;
}
export interface PiperGroup {
  readonly locale: string;
  readonly lang: Lang;
  readonly options: readonly PiperOption[];
}

/** True for the "-high" (heavier) models; false selects the "-medium" ones. */
export function isHigh(modelId: string): boolean {
  return modelId.endsWith('-high');
}

/** Group Piper models by locale, keeping only high OR medium — mirrors the lab's two select boxes. */
export function groupPiperByLocale(wantHigh: boolean): readonly PiperGroup[] {
  const groups: PiperGroup[] = [];
  for (const locale of Object.keys(PIPER_MODELS)) {
    const list = (PIPER_MODELS[locale] ?? []).filter((m) => isHigh(m) === wantHigh);
    if (list.length === 0) continue;
    groups.push({
      locale,
      lang: langOf(locale),
      // label = the model id minus the "<locale>-" prefix, e.g. "faber-medium"
      options: list.map((m) => ({ value: m, label: m.slice(locale.length + 1) })),
    });
  }
  return groups;
}

/** Kokoro model variants (int8 was dropped — silent + slower than fp32 in onnxruntime-web WASM). */
export interface KokoroVariant {
  readonly repo: string;
  readonly file: string;
}
export const KOKORO: Readonly<Record<string, KokoroVariant>> = {
  fp32: { repo: 'kokoro-multi-lang-v1_0', file: 'model.onnx' },
};

/** One Kokoro voice: name, integer speaker id (sid), and the espeak lang the model init requires. */
export interface KokoroVoice {
  readonly name: string;
  readonly sid: number;
  readonly espeakLang: string;
  readonly lang: Lang;
}

/** Kokoro voices grouped by display language (sids verified from the model). */
export const KOKORO_VOICES: readonly { readonly label: string; readonly voices: readonly KokoroVoice[] }[] = [
  {
    label: 'pt-BR',
    voices: [
      { name: 'pf_dora', sid: 42, espeakLang: 'pt-br', lang: 'pt' },
      { name: 'pm_alex', sid: 43, espeakLang: 'pt-br', lang: 'pt' },
      { name: 'pm_santa', sid: 44, espeakLang: 'pt-br', lang: 'pt' },
    ],
  },
  {
    label: 'es',
    voices: [
      { name: 'ef_dora', sid: 28, espeakLang: 'es', lang: 'es' },
      { name: 'em_alex', sid: 29, espeakLang: 'es', lang: 'es' },
    ],
  },
  {
    label: 'en-US',
    voices: [
      { name: 'af_heart', sid: 3, espeakLang: 'en-us', lang: 'en' },
      { name: 'am_adam', sid: 11, espeakLang: 'en-us', lang: 'en' },
    ],
  },
];

/** Build the HF URL for a repo file: HF_BASE + <repo>/resolve/main/<file>. */
export function hfUrl(repo: string, file: string): string {
  return `${HF_BASE}${repo}/resolve/main/${file}`;
}
