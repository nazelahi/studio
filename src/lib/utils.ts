import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatFn, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount?: number, currencySymbol: string = '৳') => {
  if (amount === undefined || amount === null) return '-';
  return `${currencySymbol}${new Intl.NumberFormat('en-US').format(amount)}`;
};

export const formatDate = (dateString?: string, dateFormat: string = 'dd MMM, yyyy') => {
    if (!dateString) return 'N/A';
    try {
        return formatFn(parseISO(dateString), dateFormat);
    } catch (error) {
        console.warn(`Could not format invalid date: ${dateString}`);
        return 'Invalid Date';
    }
};

export const hexToHsl = (hex: string): string => {
    if (!hex || typeof hex !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
        return '0 0% 0%'; // Return a default for invalid hex
    }
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
