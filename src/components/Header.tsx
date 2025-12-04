import { MessageSquare, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="relative overflow-hidden py-8 sm:py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(213_94%_45%/0.15)_0%,_transparent_50%)]" />
      
      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-up">
          <Sparkles className="h-4 w-4" />
          Gerador Automático de Mensagens
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="p-3 rounded-xl bg-whatsapp/20 shadow-glow">
            <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-whatsapp" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            WhatsApp <span className="text-gradient">Promo</span>
          </h1>
        </div>
        
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "200ms" }}>
          Crie mensagens de divulgação profissionais para seus produtos com desconto. 
          Copie e envie direto pelo WhatsApp em segundos.
        </p>
      </div>
    </header>
  );
}
