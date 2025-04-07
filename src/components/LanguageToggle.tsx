
import React from 'react';
import { Button } from '@/components/ui/button';

interface LanguageToggleProps {
  language: "en" | "pt";
  setLanguage: (language: "en" | "pt") => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, setLanguage }) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant={language === "en" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setLanguage("en")}
        className={language === "en" ? "bg-brand-blue text-white" : ""}
      >
        🇬🇧 English
      </Button>
      <Button 
        variant={language === "pt" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setLanguage("pt")}
        className={language === "pt" ? "bg-brand-blue text-white" : ""}
      >
        🇵🇹 Português
      </Button>
    </div>
  );
};

export default LanguageToggle;
