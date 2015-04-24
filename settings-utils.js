'use strict';

/* global console */

import { Service } from 'components/fxos-mvc/dist/mvc';

export class SettingsHelper {
  static get(name, defaultValue) {
    if (!name) {
      return new Promise.reject('Setting name is missing');
    }

    return new Promise((resolve, reject) => {
      let setting = navigator.mozSettings.createLock().get(name, defaultValue);
      setting.onsuccess = () => { resolve(setting.result); };
      setting.onerror = () => { reject(setting.error); };
    });
  }

  static set(settings) {
    if (!settings) {
      return new Promise.reject('Settings are missing');
    }

    return new Promise((resolve, reject) => {
      let result = navigator.mozSettings.createLock().set(settings);
      result.onsuccess = () => { resolve(result.result); };
      result.onerror = () => { reject(result.error); };
    });
  }

  static on(name, observer) {
    if (!name) {
      console.warn('Setting name is missing');
      return;
    }

    if (typeof observer !== 'function') {
      console.warn('Setting observer must be a function');
      return;
    }

    navigator.mozSettings.addObserver(name, observer);
  }

  static off(name, observer) {
    if (!name) {
      console.warn('Setting name is missing');
      return;
    }

    if (typeof observer !== 'function') {
      console.warn('Setting observer must be a function');
      return;
    }

    navigator.mozSettings.removeObserver(name, observer);
  }
}

export class SettingsService extends Service {
  constructor({name, defaultValue, observer, trigger}) {
    super();

    let value = SettingsHelper.get(name, defaultValue).then(settingValue => {
      if (trigger && observer) { observer(settingValue); }
      return settingValue;
    });

    Object.defineProperty(this, 'name', { value: name });
    Object.defineProperty(this, 'value', {
      enumerable: true,
      get: () => { return value; },
      set: newValue => {
        let settings = {};
        settings[name] = newValue;
        SettingsHelper.set(settings);
      }
    });

    SettingsHelper.on(name, ({settingValue}) => {
      value = new Promise.resolve(settingValue);
      if (observer) { observer(settingValue); }
      this._dispatchEvent('settingchange', settingValue);
    });
  }
}
