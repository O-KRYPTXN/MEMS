import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
  }

  return (
    <button
      onClick={toggleLanguage}
      title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      className="w-9 h-9 rounded-lg bg-[#1A2235] border
        border-[#1F2A40] flex items-center justify-center
        text-[#94A3B8] hover:bg-[#1F2A40] hover:text-[#E2E8F0]
        text-xs font-bold transition-colors"
    >
      {isArabic ? 'EN' : 'AR'}
    </button>
  )
}

export default LanguageSwitcher
