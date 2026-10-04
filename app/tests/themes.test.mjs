import assert from 'node:assert/strict';
import test from 'node:test';
import {DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, normalizeTheme, readTheme} from '../themes.mjs';

test('six distinct palettes include vivid, light and original themes', () => {
  assert.equal(THEMES.length, 6);
  assert.equal(new Set(THEMES.map(theme => theme.id)).size, 6);
  assert.ok(THEMES.some(theme => theme.id === 'ivory'));
  assert.ok(THEMES.some(theme => theme.id === 'forest'));
  for (const theme of THEMES) assert.equal(normalizeTheme(theme.id), theme.id);
});
test('unknown theme values fall back without injecting arbitrary CSS', () => {
  for (const value of [null, undefined, '', 'constructor', '<script>', {}, 1]) assert.equal(normalizeTheme(value), DEFAULT_THEME);
});
test('saved preference is read safely even when storage is unavailable', () => {
  assert.equal(readTheme({getItem(key) { assert.equal(key, THEME_STORAGE_KEY); return 'ivory'; }}), 'ivory');
  assert.equal(readTheme({getItem() { throw new Error('blocked'); }}), DEFAULT_THEME);
  assert.equal(readTheme(undefined), DEFAULT_THEME);
});
