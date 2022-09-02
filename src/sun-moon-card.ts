/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StyleInfo, styleMap } from 'lit/directives/style-map.js'
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
  formatTime
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import type {
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

  public static getStubConfig(): Partial<MinimalSunMoonCardConfig> {
    return {
      sun_entity: 'sun.sun'
    };
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: MinimalSunMoonCardConfig;

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
          ${sunUp ? this.renderSun(sunState) : this.renderNight(sunState, moonState) }
        </div>
      </ha-card>
    `;
  }

  private renderSun(sunState: HassEntity): TemplateResult {
    const sunrise = new Date(sunState.attributes.previous_rising);
    const sunset = new Date(sunState.attributes.next_setting);
    const dayLength = sunset.getTime() - sunrise.getTime();
    const sunSoFar = Date.now() - sunrise.getTime();
    const sunPercent = (sunSoFar / dayLength) * 100;
    const sunStyles: StyleInfo = {
      left: sunPercent.toFixed(4)
    };
    return html`<div class="sun-moon-card">
      ${this.config.hide_sunrise ? null : html`<span class="sunrise">${formatTime(sunrise, this.hass.locale)}</span>`}
      <span class="sun-path">
        <span class="bar"> </span>
        <span class="sun" style=${styleMap(sunStyles)} title=${this.localize('card.sun_percent', '{percent}', sunPercent.toFixed(4))}>
          <ha-icon icon="mdi:weather-sunny"></ha-icon>
        </span>
      </span>
      ${this.config.hide_sunset ? null : html`<span class="sunset">${formatTime(sunset, this.hass.locale)}</span>`}
    </div>`;
  }

  private renderNight(sunState: HassEntity, moonState?: HassEntity): TemplateResult {
    const sunrise = new Date(sunState.attributes.next_rising);
    let moonInfo: TemplateResult | undefined = void 0;
    if (moonState) {
      moonInfo = html`<ha-icon icon=${moonState.attributes.icon ?? 'mdi:weather-night'}></ha-icon>
      ${this.localize('card.moon_info', '{phase}', this.localize('moon.' + moonState.state))}`
    }
    return html`${moonInfo}
    ${this.localize('card.next_sunrise', '{time}', formatTime(sunrise, this.hass.locale))}
    `;
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
    return css`
      .sun-moon-card {
        padding: 6px;
        display: flex;
      }
      .sunrise, .sunset {
        font-size: 0.8rem;
        color: var(--primary-text-color, white);
      }
      .sun-path {
        flex-grow: 1;
        position: relative;
        padding: 0 6px;
        display: flex;
        align-items: center;
      }
      .bar {
        display: inline-flex;
        height: 3px;
        width: 100%;
        background-color: var(--state-climate-dry-color, yellow);
      }
      .sun {
        position: absolute;
        border-radius: 100%;
        background-color: #111;
        padding: 2px;
      }
    `;
  }
}
