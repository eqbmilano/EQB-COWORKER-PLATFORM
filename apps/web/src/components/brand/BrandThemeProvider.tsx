/**
 * Brand Theme Provider
 * Applies EQB brand colors and typography globally
 */
'use client';

import type { ReactNode } from 'react';
import { brand } from '@/config/brand';

interface BrandThemeProviderProps {
  children: ReactNode;
}

export function BrandThemeProvider({ children }: BrandThemeProviderProps) {
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
  return (
    <div
      // eslint-disable-next-line react/no-unknown-property
      style={{
        '--eqb-wood-primary': brand.colors.logoPrimaryWood,
        '--eqb-wood-secondary': brand.colors.palettePrimary,
        '--eqb-wood-dark': brand.colors.paletteSecondary,
        '--eqb-warm-white': brand.colors.warmWhite,
        '--font-logo': brand.typography.logo.regular,
        '--font-body': brand.typography.text,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Component to display brand info (for debugging/design reference)
 */
export function BrandShowcase() {
  return (
    <div className="p-8 space-y-8 bg-slate-900">
      {/* Color Palette */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-50">Colori EQB</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            
            <div
              className="w-full h-20 rounded-lg"
              style={{ backgroundColor: brand.colors.logoPrimaryWood }}
            ></div>
            <p className="text-xs text-slate-400">Wood Primary</p>
            <p className="text-xs text-slate-300">{brand.colors.logoPrimaryWood}</p>
          </div>
          <div className="space-y-2">
            
            <div
              className="w-full h-20 rounded-lg"
              style={{ backgroundColor: brand.colors.palettePrimary }}
            ></div>
            <p className="text-xs text-slate-400">Palette Primary</p>
            <p className="text-xs text-slate-300">{brand.colors.palettePrimary}</p>
          </div>
          <div className="space-y-2">
            
            <div
              className="w-full h-20 rounded-lg"
              style={{ backgroundColor: brand.colors.paletteSecondary }}
            ></div>
            <p className="text-xs text-slate-400">Palette Secondary</p>
            <p className="text-xs text-slate-300">{brand.colors.paletteSecondary}</p>
          </div>
          <div className="space-y-2">
            
            <div
              className="w-full h-20 rounded-lg border border-slate-400"
              style={{ backgroundColor: brand.colors.warmWhite }}
            ></div>
            <p className="text-xs text-slate-400">Warm White</p>
            <p className="text-xs text-slate-300">{brand.colors.warmWhite}</p>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-50">Tipografia</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Logo ({brand.typography.logo.regular})</p>
            
            <p style={{ fontFamily: brand.typography.logo.regular }} className="text-2xl">
              EQB
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Body ({brand.typography.text})</p>
            
            <p style={{ fontFamily: brand.typography.text }} className="text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Pillars */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-slate-50">Valori Brand</h3>
        <div className="flex flex-wrap gap-2">
          {brand.positioning.pillars.map((pillar) => (
            <span
              key={pillar}
              className="px-3 py-1 bg-slate-800 text-slate-200 rounded-full text-sm"
            >
              {pillar}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


