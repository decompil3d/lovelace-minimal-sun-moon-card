/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import { MinimalSunMoonCardConfig } from './types';
import { customElement, property, state } from 'lit/decorators.js';
import { formfieldDefinition } from '../elements/formfield';
import { selectDefinition } from '../elements/select';
import { switchDefinition } from '../elements/switch';
import { textfieldDefinition } from '../elements/textfield';
import { getLocalizer } from './localize/localize';

@customElement('minimal-sun-moon-editor')
export class MinimalSunMoonCardEditor extends ScopedRegistryHost(LitElement) implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: MinimalSunMoonCardConfig;

  @state() private _helpers?: any;

  private _initialized = false;

  static elementDefinitions = {
    ...textfieldDefinition,
    ...selectDefinition,
    ...switchDefinition,
    ...formfieldDefinition,
  };

  public setConfig(config: MinimalSunMoonCardConfig): void {
    this._config = config;

    this.loadCardHelpers();
  }

  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }

    return true;
  }

  get _sun_entity(): string {
    return this._config?.sun_entity || '';
  }

  get _moon_entity(): string {
    return this._config?.moon_entity || '';
  }

  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }

    const sunEntities = Object.keys(this.hass.states).filter(e => e.startsWith('sun.'));
    const moonEntities = Object.keys(this.hass.states).filter(e => e.startsWith('moon.'));
    const localize = getLocalizer(this._config?.language, this.hass?.locale?.language);

    return html`
      <mwc-select
        naturalMenuWidth
        fixedMenuPosition
        label=${localize('editor.sun_entity')}
        .configValue=${'sun_entity'}
        .value=${this._sun_entity}
        @selected=${this._valueChanged}
        @closed=${(ev) => ev.stopPropagation()}
      >
        ${sunEntities.map((entity) => {
      return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
    })}
      </mwc-select>
      <mwc-select
        naturalMenuWidth
        fixedMenuPosition
        label=${localize('editor.moon_entity')}
        .configValue=${'moon_entity'}
        .value=${this._moon_entity}
        @selected=${this._valueChanged}
        @closed=${(ev) => ev.stopPropagation()}
      >
        ${moonEntities.map((entity) => {
      return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
    })}
      </mwc-select>`;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles: CSSResultGroup = css`
    mwc-select,
    mwc-textfield {
      margin-bottom: 16px;
      display: block;
    }
    mwc-formfield {
      padding-bottom: 8px;
    }
    mwc-switch {
      --mdc-theme-secondary: var(--switch-checked-color);
    }
  `;
}
