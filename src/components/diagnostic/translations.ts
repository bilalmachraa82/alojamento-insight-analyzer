
export type Language = "en" | "pt";

interface Translations {
  title: string;
  subtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  nameRequired: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailRequired: string;
  emailInvalid: string;
  linkLabel: string;
  linkPlaceholder: string;
  linkRequired: string;
  linkInvalid: string;
  platformLabel: string;
  platformRequired: string;
  rgpdLabel: string;
  rgpdRequired: string;
  submit: string;
  processing: string;
  success: string;
  thankYou: string;
  viewResults: string;
  sendAnother: string;
  statusPending: string;
  statusProcessing: string;
  statusScraping: string;
  statusAnalyzing: string;
  statusCompleted: string;
  checkingStatus: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    title: "Smart Diagnostic",
    subtitle: "Short-Term Rental",
    nameLabel: "Your Name",
    namePlaceholder: "Enter your name",
    nameRequired: "Name is required",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email format",
    linkLabel: "Property URL",
    linkPlaceholder: "Paste your property URL from Airbnb, Booking, etc.",
    linkRequired: "Property URL is required",
    linkInvalid: "Invalid URL format",
    platformLabel: "Platform",
    platformRequired: "Platform selection is required",
    rgpdLabel: "I agree with the processing of my data for this service",
    rgpdRequired: "You must agree to the terms",
    submit: "Submit Diagnostic",
    processing: "Processing...",
    success: "Diagnostic Submitted!",
    thankYou: "Thank you, {name}! We're processing your smart diagnostic. You'll receive your personalized plan by email soon.",
    viewResults: "View Results",
    sendAnother: "Submit Another Diagnostic",
    statusPending: "Preparing your diagnostic...",
    statusProcessing: "Starting data collection...",
    statusScraping: "Collecting property data...",
    statusAnalyzing: "Analyzing property information...",
    statusCompleted: "Analysis completed!",
    checkingStatus: "Checking status...",
  },
  pt: {
    title: "Diagnóstico Inteligente",
    subtitle: "Alojamento Local",
    nameLabel: "Seu Nome",
    namePlaceholder: "Digite seu nome",
    nameRequired: "Nome é obrigatório",
    emailLabel: "Email",
    emailPlaceholder: "Digite seu email",
    emailRequired: "Email é obrigatório",
    emailInvalid: "Formato de email inválido",
    linkLabel: "URL da Propriedade",
    linkPlaceholder: "Cole o URL da sua propriedade do Airbnb, Booking, etc.",
    linkRequired: "URL da propriedade é obrigatório",
    linkInvalid: "Formato de URL inválido",
    platformLabel: "Plataforma",
    platformRequired: "Seleção da plataforma é obrigatória",
    rgpdLabel: "Concordo com o processamento dos meus dados para este serviço",
    rgpdRequired: "Você deve concordar com os termos",
    submit: "Enviar Diagnóstico",
    processing: "Processando...",
    success: "Diagnóstico Enviado!",
    thankYou: "Obrigado, {name}! Estamos a processar o seu diagnóstico inteligente. Em breve, receberá o plano personalizado no seu email.",
    viewResults: "Ver Resultados",
    sendAnother: "Enviar outro diagnóstico",
    statusPending: "A preparar o seu diagnóstico...",
    statusProcessing: "A iniciar recolha de dados...",
    statusScraping: "A recolher dados da propriedade...",
    statusAnalyzing: "A analisar informações da propriedade...",
    statusCompleted: "Análise concluída!",
    checkingStatus: "A verificar estado...",
  }
};
