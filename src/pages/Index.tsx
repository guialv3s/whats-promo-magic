import { useState } from "react";
import { Header } from "@/components/Header";
import { ProductForm } from "@/components/ProductForm";
import { MessagePreview } from "@/components/MessagePreview";
import { MessageHistory } from "@/components/MessageHistory";
import { WhatsAppConnection } from "@/components/WhatsAppConnection";
import { ScheduledMessagesList } from "@/components/ScheduledMessagesList";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductData, MessageHistoryItem } from "@/types/product";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";
import { useScheduledMessages } from "@/hooks/useScheduledMessages";
import { generateWhatsAppMessage } from "@/utils/messageGenerator";
import { FileText, History, PlusCircle, Smartphone, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [currentProduct, setCurrentProduct] = useState<ProductData | null>(null);
  const [editingItem, setEditingItem] = useState<MessageHistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState("create");
  const { history, saveToHistory, removeFromHistory } = useMessageHistory();
  const whatsApp = useWhatsAppConnection();
  const {
    scheduledMessages,
    isLoading: isLoadingMessages,
    scheduleMessage,
    cancelMessage,
    sendNow,
    refresh: refreshMessages
  } = useScheduledMessages();

  const handleFormSubmit = (data: ProductData) => {
    setCurrentProduct(data);
  };

  const handleSaveToHistory = () => {
    if (currentProduct) {
      const historyItem: MessageHistoryItem = {
        ...currentProduct,
        id: crypto.randomUUID(), // Ensure unique ID for history items
        generatedMessage: generateWhatsAppMessage(currentProduct),
      };
      saveToHistory(historyItem);
    }
  };

  const handleScheduleMessage = async () => {
    if (!currentProduct) {
      toast.error("Crie uma mensagem primeiro");
      return;
    }

    if (!whatsApp.selectedGroup) {
      toast.error("Selecione um grupo na aba WhatsApp primeiro");
      setActiveTab("whatsapp");
      return;
    }

    if (!currentProduct.scheduledTime) {
      toast.error("Defina um horário para o agendamento");
      return;
    }

    const message = generateWhatsAppMessage(currentProduct);

    const success = await scheduleMessage({
      message,
      scheduledTime: currentProduct.scheduledTime,
      groupId: whatsApp.selectedGroup.id,
      groupName: whatsApp.selectedGroup.name,
      productData: currentProduct
    });

    if (success) {
      // Save to history
      handleSaveToHistory();
      // Reset form
      setCurrentProduct(null);
      setEditingItem(null);
    }
  };

  const handleSendNow = async () => {
    if (!currentProduct) {
      toast.error("Crie uma mensagem primeiro");
      return;
    }

    if (!whatsApp.selectedGroup) {
      toast.error("Selecione um grupo na aba WhatsApp primeiro");
      setActiveTab("whatsapp");
      return;
    }

    if (whatsApp.status !== "connected") {
      toast.error("Conecte o WhatsApp primeiro");
      setActiveTab("whatsapp");
      return;
    }

    const message = generateWhatsAppMessage(currentProduct);

    // Pass the product image for sending with the message
    const success = await sendNow(
      whatsApp.selectedGroup.id,
      message,
      currentProduct.productImage
    );

    if (success) {
      // Save to history
      handleSaveToHistory();
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

  const pendingMessagesCount = scheduledMessages.filter(m => m.status === 'scheduled').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 bg-secondary/50">
            <TabsTrigger value="create" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PlusCircle className="h-4 w-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4" />
              Agendadas
              {pendingMessagesCount > 0 && (
                <span className="ml-1 bg-warning/20 text-warning text-xs px-2 py-0.5 rounded-full">
                  {pendingMessagesCount}
                </span>
              )}
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
                    <>
                      <MessagePreview
                        data={currentProduct}
                        onSave={handleSaveToHistory}
                      />

                      {/* Schedule/Send Buttons */}
                      <div className="mt-6 pt-4 border-t border-border space-y-3">
                        {whatsApp.selectedGroup ? (
                          <>
                            <p className="text-xs text-muted-foreground text-center">
                              Grupo: <span className="text-foreground font-medium">{whatsApp.selectedGroup.name}</span>
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                onClick={handleSendNow}
                                variant="whatsapp"
                                className="w-full"
                                disabled={whatsApp.status !== "connected"}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Agora
                              </Button>

                              <Button
                                onClick={handleScheduleMessage}
                                variant="gradient"
                                className="w-full"
                                disabled={!currentProduct.scheduledTime}
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Agendar
                              </Button>
                            </div>

                            {!currentProduct.scheduledTime && (
                              <p className="text-xs text-muted-foreground text-center">
                                Defina um horário no formulário para agendar
                              </p>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              Selecione um grupo para enviar
                            </p>
                            <Button
                              onClick={() => setActiveTab("whatsapp")}
                              variant="outline"
                              className="w-full"
                            >
                              <Smartphone className="h-4 w-4 mr-2" />
                              Configurar WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
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

          <TabsContent value="scheduled" className="mt-0">
            <Card className="p-6 sm:p-8 bg-card border-border shadow-card animate-fade-up">
              <ScheduledMessagesList
                messages={scheduledMessages}
                isLoading={isLoadingMessages}
                onCancel={cancelMessage}
                onRefresh={refreshMessages}
              />
            </Card>
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
                groups={whatsApp.groups}
                selectedGroup={whatsApp.selectedGroup}
                isLoadingGroups={whatsApp.isLoadingGroups}
                serverConnected={whatsApp.serverConnected}
                onConnect={whatsApp.connect}
                onDisconnect={whatsApp.disconnect}
                onRefreshQR={whatsApp.refreshQR}
                onLoadGroups={whatsApp.loadGroups}
                onSelectGroup={whatsApp.selectGroup}
              />

              {/* Info Card */}
              <Card className="mt-6 p-4 bg-secondary/30 border-border">
                <h4 className="font-medium text-foreground mb-2">
                  ℹ️ Como funciona
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Conecte seu WhatsApp escaneando o QR Code</li>
                  <li>• Selecione o grupo de destino das mensagens</li>
                  <li>• Crie suas mensagens e agende para o horário desejado</li>
                  <li>• As mensagens serão enviadas automaticamente!</li>
                </ul>
              </Card>

              {/* Server Info */}
              <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
                <h4 className="font-medium text-foreground mb-2">
                  🖥️ Servidor Backend
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Para funcionar, o servidor backend precisa estar rodando:
                </p>
                <code className="text-xs bg-secondary px-2 py-1 rounded block">
                  cd server && npm install && npm start
                </code>
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
            Mensagens agendadas são enviadas automaticamente no horário definido
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
