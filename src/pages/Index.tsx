
import DiagnosticForm from "@/components/DiagnosticForm";
import MariaFazLogo from "@/components/MariaFazLogo";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-4 bg-gradient-to-br from-white to-gray-50">
      <div className="w-full max-w-md">
        <MariaFazLogo />
        
        <div className="bg-white shadow-sm rounded-xl p-8 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-brand-black font-montserrat">
            Diagnóstico Inteligente
          </h1>
          <h2 className="text-lg text-center mb-8 text-gray-600 font-inter">
            Alojamento Local
          </h2>
          
          <DiagnosticForm />
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Maria Faz. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
