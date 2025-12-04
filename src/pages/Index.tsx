import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductForm } from "@/components/ProductForm";
import { MessagePreview } from "@/components/MessagePreview";
import { MessageHistory } from "@/components/MessageHistory";
import { WhatsAppConnection } from "@/components/WhatsAppConnection";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductData, MessageHistoryItem } from "@/types/product";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";
import { generateWhatsAppMessage } from "@/utils/messageGenerator";
import { FileText, History, PlusCircle, Smartphone } from "lucide-react";

const Index = () => {
  const [currentProduct, setCurrentProduct] = useState<ProductData | null>(null);
  const [editingItem, setEditingItem] = useState<MessageHistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const { history, saveToHistory, removeFromHistory } = useMessageHistory();
  const whatsApp = useWhatsAppConnection();

  const handleFormSubmit = (data: ProductData) => {
    setCurrentProduct(data);
  };

  const handleSaveToHistory = () => {
    if (currentProduct) {
      const historyItem: MessageHistoryItem = {
        ...currentProduct,
        generatedMessage: generateWhatsAppMessage(currentProduct),
      };
      saveToHistory(historyItem);
    }
  };

  const handleEdit = (item: MessageHistoryItem) => {
    setEditingItem(item);
    setCurrentProduct(null);
    setActiveTab("create");
  };

  const handleDuplicate = (item: MessageHistoryItem) => {
    const duplicated: ProductData = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setEditingItem(duplicated as MessageHistoryItem);
    setCurrentProduct(null);
    setActiveTab("create");
  };

  const handleNewMessage = () => {
    setEditingItem(null);
    setCurrentProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8 bg-secondary/50">
            <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4" />
              Histórico
              {history.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2 data-[state=active]:bg-whatsapp data-[state=active]:text-white">
              <Smartphone className="h-4 w-4" />
              WhatsApp
              {whatsApp.status === "connected" && (
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <Card className="p-6 sm:p-8 bg-card border-border shadow-card animate-fade-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {editingItem ? "Editar Mensagem" : "Dados do Produto"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Preencha as informações para gerar a mensagem
                    </p>
                  </div>
                </div>
                <ProductForm 
                  onSubmit={handleFormSubmit} 
                  initialData={editingItem || undefined}
                  key={editingItem?.id || "new"}
                />
                {editingItem && (
                  <button
                    onClick={handleNewMessage}
                    className="mt-4 text-sm text-primary hover:underline w-full text-center"
                  >
                    Cancelar edição e criar nova mensagem
                  </button>
                )}
              </Card>

              {/* Preview Section */}
              <div className="lg:sticky lg:top-4 lg:self-start animate-fade-up" style={{ animationDelay: "100ms" }}>
                <Card className="p-6 sm:p-8 bg-card border-border shadow-card">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-whatsapp/10">
                      <FileText className="h-5 w-5 text-whatsapp" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        Preview da Mensagem
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Veja como a mensagem ficará no WhatsApp
                      </p>
                    </div>
                  </div>

                  {currentProduct ? (
                    <MessagePreview 
                      data={currentProduct} 
                      onSave={handleSaveToHistory}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">
                        Nenhum produto adicionado
                      </p>
                      <p className="text-sm">
                        Preencha o formulário ao lado para gerar a mensagem
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="p-6 sm:p-8 bg-card border-border shadow-card animate-fade-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Histórico de Mensagens
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Suas mensagens criadas anteriormente
                  </p>
                </div>
              </div>
              <MessageHistory
                history={history}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={removeFromHistory}
              />
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-0">
            <div className="max-w-md mx-auto animate-fade-up">
              <WhatsAppConnection
                status={whatsApp.status}
                qrCode={whatsApp.qrCode}
                onConnect={whatsApp.connect}
                onDisconnect={whatsApp.disconnect}
                onRefreshQR={whatsApp.refreshQR}
              />
              
              {/* Info Card */}
              <Card className="mt-6 p-4 bg-secondary/30 border-border">
                <h4 className="font-medium text-foreground mb-2">
                  ℹ️ Sobre a conexão
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A sessão é salva para reconexão automática</li>
                  <li>• Envio automático disponível após conexão</li>
                  <li>• Múltiplos dispositivos não são suportados simultaneamente</li>
                </ul>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            WhatsApp Promo • Gerador de Mensagens Promocionais
          </p>
          <p className="mt-1 text-muted-foreground/70">
            Preparado para integrações futuras com WhatsApp Business API e Telegram
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
