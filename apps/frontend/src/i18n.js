import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Detect user language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';
i18n.use(initReactI18next).init({
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    resources: {
        en: { translation: {} },
        ro: { translation: {} },
    },
});
// Load translations from backend (will be called from App)
export const loadTranslations = async (language = 'en') => {
    try {
        const response = await fetch(`/mini-crm/api/translations/${language}`);
        const data = await response.json();
        i18n.addResourceBundle(language, 'translation', data, true, true);
        return data;
    }
    catch (error) {
        console.error('Failed to load translations:', error);
        return {};
    }
};
export default i18n;
