/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
  formatTime,
  FrontendLocaleData,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { isValidColorName, isValidHSL, isValidRGB } from 'is-valid-css-color';

import type {
  ColorConfig,
  ColorMap,
  ColorSettings,
  MinimalSunMoonCardConfig,
  LocalizerLastSettings
} from './types';
import { actionHandler } from './action-handler-directive';
import { version } from '../package.json';
import { getLocalizer } from './localize/localize';
import { HassEntity } from 'home-assistant-js-websocket';

// Naive localizer is used before we can get at card configuration data
const naiveLocalizer = getLocalizer(void 0, void 0);

/* eslint no-console: 0 */
console.info(
  `%c  MINIMAL-SUN-MOON-CARD \n%c  ${naiveLocalizer('common.version')} ${version}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'minimal-sun-moon',
  name: naiveLocalizer('common.title_card'),
  description: naiveLocalizer('common.description'),
});

@customElement('minimal-sun-moon')
export class MinimalSunMoonCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('minimal-sun-moon-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: MinimalSunMoonCardConfig;

  @state() private renderedConfig!: Promise<MinimalSunMoonCardConfig>;

  private configRenderPending = false;

  private localizer?: ReturnType<typeof getLocalizer> = void 0;
  private localizerLastSettings: LocalizerLastSettings = {
    configuredLanguage: void 0,
    haServerLanguage: void 0
  };

  private localize(string: string, search = '', replace = ''): string {
    if (!this.localizer ||
        this.localizerSettingsChanged) {
      this.localizer = getLocalizer(this.config?.language, this.hass?.locale?.language);
      this.localizerLastSettings.configuredLanguage = this.config?.language;
      this.localizerLastSettings.haServerLanguage = this.hass?.locale?.language;
    }

    return this.localizer(string, search, replace);
  }

  private get localizerSettingsChanged() {
    return this.localizerLastSettings.configuredLanguage !== this.config?.language ||
      this.localizerLastSettings.haServerLanguage !== this.hass?.locale?.language;
  }

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: MinimalSunMoonCardConfig): void {
    if (!config) {
      throw new Error(this.localize('common.invalid_configuration'));
    }

    if (!config.sun_entity) {
      throw new Error(this.localize('errors.missing_sun_entity'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    if (changedProps.has('hass')) {
      const oldHass = changedProps.get('hass') as HomeAssistant;
      if (oldHass && this.hass && JSON.stringify(oldHass.locale) !== JSON.stringify(this.hass.locale)) {
        // Locale changed, so we must re-render
        return true;
      }
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    const { config } = this;
    if (!config) {
      return;
    }

    const sunEntityId: string = config.sun_entity;
    const sunState = this.hass.states[sunEntityId];
    const moonEntityId: string | undefined = config.moon_entity;
    const moonState = moonEntityId ? this.hass.states[moonEntityId] : void 0;

    const sunUp = sunState.state === 'above_horizon';

    const colorSettings = this.getColorSettings(config.colors);

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(config.hold_action),
          hasDoubleClick: hasAction(config.double_tap_action),
        })}
        tabindex="0"
        .label=${`Minimal Sun Moon Card: ${[sunEntityId, moonEntityId].filter(Boolean).join(', ') || 'No Entities Defined'}`}
      >
        <div class="card-content">
          ${colorSettings.warnings.length ?
        this._showWarning(this.localize('errors.invalid_colors') + colorSettings.warnings.join(', ')) : ''}
          ${sunUp ? this.renderSun(sunState) : this.renderNight(sunState, moonState) }
        </div>
      </ha-card>
    `;
  }

  private renderSun(sunState: HassEntity): TemplateResult {
    return html`Sun: ${sunState.state}`;
  }

  private renderNight(sunState: HassEntity, moonState?: HassEntity): TemplateResult {
    return html`Night. Sun: ${sunState.state}. Moon: ${moonState ? moonState.state : 'Not configured'}`;
  }

  private formatHour(time: Date, locale: FrontendLocaleData): string {
    const formatted = formatTime(time, locale);
    if (formatted.includes('AM') || formatted.includes('PM')) {
      // Drop ':00' in 12 hour time
      return formatted.replace(':00', '');
    }
    return formatted;
  }

  private getColorSettings(colorConfig?: ColorConfig): ColorSettings {
    if (!colorConfig) return {
      validColors: void 0,
      warnings: []
    };

    const validColors: ColorMap = new Map();
    const warnings: string[] = [];
    Object.entries(colorConfig).forEach(([k, v]) => {
      if (this.isValidColor(k, v))
        validColors.set(k as keyof ColorConfig, v);
      else
        warnings.push(`${k}: ${v}`);
    });
    return {
      validColors,
      warnings
    };
  }

  private isValidColor(key: string, color: string): boolean {
    if (!(key in ['sun', 'moon'])) {
      return false;
    }
    if (!(isValidRGB(color) ||
      isValidColorName(color) ||
      isValidHSL(color))) {
      return false;
    }

    return true;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html` <hui-warning>${warning}</hui-warning> `;
  }

  private async _showError(error: string): Promise<TemplateResult> {
    // Without this next line, we get an error accessing `setConfig` on `errorCard`, likely due to a race condition in
    // Home Assistant's lovelace logic. This line just triggers a stack unroll before we continue rendering. That deals
    // with the race condition effectively, it seems.
    await new Promise(resolve => setTimeout(resolve, 0));
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html` ${errorCard} `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css``;
  }
}
