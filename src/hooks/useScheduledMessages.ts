import { useState, useCallback, useEffect } from "react";
import { apiService, ScheduledMessage, ScheduleMessageRequest } from "@/services/api";
import { toast } from "sonner";

interface UseScheduledMessagesReturn {
    scheduledMessages: ScheduledMessage[];
    isLoading: boolean;
    scheduleMessage: (request: ScheduleMessageRequest) => Promise<boolean>;
    cancelMessage: (id: string) => Promise<boolean>;
    sendNow: (groupId: string, message: string, imageBase64?: string | null) => Promise<boolean>;
    refresh: () => void;
}

export function useScheduledMessages(): UseScheduledMessagesReturn {
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Subscribe to WebSocket events
    useEffect(() => {
        const unsubscribeScheduled = apiService.on('scheduled-messages', (messages) => {
            setScheduledMessages(messages);
        });

        const unsubscribeSent = apiService.on('message-sent', (data) => {
            toast.success(`✅ Mensagem enviada para "${data.groupName || 'grupo'}"!`);
        });

        const unsubscribeFailed = apiService.on('message-failed', (data) => {
            toast.error(`❌ Falha ao enviar mensagem: ${data.error}`);
        });

        const unsubscribeCancelled = apiService.on('message-cancelled', (data) => {
            toast.info(`Mensagem cancelada`);
        });

        // Load initial messages
        refresh();

        return () => {
            unsubscribeScheduled();
            unsubscribeSent();
            unsubscribeFailed();
            unsubscribeCancelled();
        };
    }, []);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await apiService.getScheduledMessages();
            if (result.success) {
                setScheduledMessages(result.messages);
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const scheduleMessage = useCallback(async (request: ScheduleMessageRequest): Promise<boolean> => {
        try {
            const result = await apiService.scheduleMessage(request);

            if (result.success) {
                toast.success('📅 Mensagem agendada com sucesso!');
                return true;
            } else {
                throw new Error(result.error || 'Erro ao agendar');
            }
        } catch (error) {
            console.error('Erro ao agendar mensagem:', error);
            toast.error('Erro ao agendar mensagem');
            return false;
        }
    }, []);

    const cancelMessage = useCallback(async (id: string): Promise<boolean> => {
        try {
            const result = await apiService.cancelMessage(id);

            if (result.success) {
                toast.success('Mensagem cancelada');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao cancelar mensagem:', error);
            toast.error('Erro ao cancelar mensagem');
            return false;
        }
    }, []);

    const sendNow = useCallback(async (groupId: string, message: string, imageBase64?: string | null): Promise<boolean> => {
        try {
            const result = await apiService.sendMessageNow(groupId, message, imageBase64);

            if (result.success) {
                toast.success('✅ Mensagem enviada!');
                return true;
            } else {
                throw new Error(result.error || 'Erro ao enviar');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            toast.error('Erro ao enviar mensagem. Verifique a conexão do WhatsApp.');
            return false;
        }
    }, []);

    return {
        scheduledMessages,
        isLoading,
        scheduleMessage,
        cancelMessage,
        sendNow,
        refresh,
    };
}
