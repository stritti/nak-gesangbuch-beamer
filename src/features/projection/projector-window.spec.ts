import { describe, it, expect } from 'vitest';
import { buildProjectorUrl, getWindowFeatures } from './projector-window';

describe('buildProjectorUrl', () => {
  it('builds base url without params', () => {
    expect(buildProjectorUrl({})).toBe('/projector');
  });

  it('appends songId param', () => {
    expect(buildProjectorUrl({ songId: 'nak-1' })).toBe('/projector?songId=nak-1');
  });

  it('appends setlistId param', () => {
    expect(buildProjectorUrl({ setlistId: 'abc' })).toBe('/projector?setlistId=abc');
  });
});

describe('getWindowFeatures', () => {
  it('returns default features for primary', () => {
    expect(getWindowFeatures('primary')).toBe('width=1024,height=768');
  });

  it('offsets secondary window to the right', () => {
    expect(getWindowFeatures('secondary')).toBe('width=1024,height=768,left=1920,top=0');
  });

  it('uses screen size for fullscreen', () => {
    expect(getWindowFeatures('fullscreen', { width: 1920, height: 1080 })).toBe(
      'width=1920,height=1080,top=0,left=0'
    );
  });

  it('uses custom features or falls back', () => {
    expect(getWindowFeatures('custom', undefined, 'width=800,height=600')).toBe('width=800,height=600');
    expect(getWindowFeatures('custom')).toBe('width=1024,height=768');
  });
});