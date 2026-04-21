import { format, parseISO } from 'date-fns';

export const isoDateFormatter = (isoDate: string, formatString: string = 'dd/MM/yyyy HH:mm:ss') => {
    return format(parseISO(isoDate), formatString);
}