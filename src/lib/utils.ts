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
