
export const translations = {
  en: {
    name: "Name",
    namePlaceholder: "Ex: John Smith",
    email: "Email",
    emailPlaceholder: "Ex: john@email.com",
    link: "Property link",
    linkPlaceholder: "https://www.booking.com/...",
    platform: "Main platform",
    gdpr: "I agree that my data can be used for contact and diagnostic purposes",
    submit: "Generate Analysis",
    processing: "Processing...",
    success: "Diagnostic Sent!",
    thankYou: "Thank you, {name}. We are processing your smart diagnostic. Soon, you will receive your personalized plan in your email.",
    sendAnother: "Send another diagnostic",
    viewResults: "View Results",
    emailError: "Please enter a valid email.",
    nameError: "Name must be at least 2 characters.",
    urlError: "Please enter a valid URL.",
    platformError: "Please select a platform.",
    gdprError: "You must accept the GDPR policy to continue.",
    statusPending: "Preparing your diagnostic...",
    statusProcessing: "Analyzing your property...",
    statusScraping: "Gathering property data...",
    statusAnalyzing: "Creating your personalized plan...",
    statusCompleted: "Analysis complete! Check your email soon."
  },
  pt: {
    name: "Nome",
    namePlaceholder: "Ex: Ana Costa",
    email: "Email",
    emailPlaceholder: "Ex: ana@email.com",
    link: "Link da propriedade",
    linkPlaceholder: "https://www.booking.com/...",
    platform: "Plataforma principal",
    gdpr: "Aceito que os meus dados sejam usados para contacto e envio do diagnóstico",
    submit: "Gerar Análise",
    processing: "A processar...",
    success: "Diagnóstico Enviado!",
    thankYou: "Obrigado, {name}. Estamos a processar o teu diagnóstico inteligente. Em breve, receberás o plano personalizado no teu email.",
    sendAnother: "Enviar outro diagnóstico",
    viewResults: "Ver Resultados",
    emailError: "Por favor insira um email válido.",
    nameError: "O nome deve ter pelo menos 2 caracteres.",
    urlError: "Por favor insira um URL válido.",
    platformError: "Por favor selecione uma plataforma.",
    gdprError: "Deve aceitar a política de RGPD para continuar.",
    statusPending: "A preparar o seu diagnóstico...",
    statusProcessing: "A analisar a sua propriedade...",
    statusScraping: "A recolher dados da propriedade...",
    statusAnalyzing: "A criar o seu plano personalizado...",
    statusCompleted: "Análise completa! Verifique o seu email em breve."
  }
};

export type Language = "en" | "pt";
export type TranslationKey = keyof typeof translations.en;
