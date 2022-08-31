import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'minimal-sun-moon-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

export interface MinimalSunMoonCardConfig extends LovelaceCardConfig {
  type: string;
  sun_entity: string;
  moon_entity?: string;
  colors?: ColorConfig;
  hide_sunrise?: boolean;
  hide_sunset?: boolean;
  test_gui?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  language?: string;
}

export interface ColorConfig {
  sun?: string;
  moon?: string;
}

export type ColorMap = Map<keyof ColorConfig, string>

export interface ColorSettings {
  validColors?: ColorMap,
  warnings: string[]
}

export interface RenderTemplateResult {
  result: string
}

export interface LocalizerLastSettings {
  configuredLanguage: string | undefined,
  haServerLanguage: string | undefined
}
