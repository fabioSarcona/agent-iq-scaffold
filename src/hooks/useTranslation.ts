import { useTranslation as useT } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  return useT(namespace);
};