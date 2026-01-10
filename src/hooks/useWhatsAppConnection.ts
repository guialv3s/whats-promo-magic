import { useState, useCallback, useEffect } from "react";
import { ConnectionStatus } from "@/components/WhatsAppConnection";
import { apiService, WhatsAppGroup } from "@/services/api";
import { toast } from "sonner";

interface UseWhatsAppConnectionReturn {
  status: ConnectionStatus;
  qrCode: string | null;
  groups: WhatsAppGroup[];
  selectedGroup: WhatsAppGroup | null;
  isLoadingGroups: boolean;
  serverConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  refreshQR: () => void;
  loadGroups: () => void;
  selectGroup: (group: WhatsAppGroup | null) => void;
}

const SELECTED_GROUP_KEY = "whatsapp-selected-group";

export function useWhatsAppConnection(): UseWhatsAppConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroup | null>(() => {
    const saved = localStorage.getItem(SELECTED_GROUP_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  // Subscribe to WebSocket events
  useEffect(() => {
    const unsubscribeStatus = apiService.on('connection-status', (data) => {
      console.log('📱 Status recebido:', data);
      setStatus(data.status as ConnectionStatus);

      if (data.qrCode) {
        setQrCode(data.qrCode);
      }

      if (data.status === 'connected') {
        setQrCode(null);
        setServerConnected(true);
      }
    });

    const unsubscribeQR = apiService.on('qr-code', (data) => {
      console.log('📱 QR Code recebido');
      setQrCode(data.qrCode);
    });

    // Check initial status
    checkStatus();

    return () => {
      unsubscribeStatus();
      unsubscribeQR();
    };
  }, []);

  const checkStatus = async () => {
    try {
      const result = await apiService.getWhatsAppStatus();
      setStatus(result.status as ConnectionStatus);
      setServerConnected(true);

      if (result.isReady) {
        loadGroups();
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setServerConnected(false);
    }
  };

  const connect = useCallback(async () => {
    try {
      setStatus("connecting");
      const result = await apiService.connectWhatsApp();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao conectar');
      }

      toast.info("Iniciando conexão com WhatsApp...");
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setStatus("error");
      toast.error("Erro ao conectar. Verifique se o servidor está rodando.");
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await apiService.disconnectWhatsApp();
      setStatus("disconnected");
      setQrCode(null);
      setGroups([]);
      toast.info("WhatsApp desconectado");
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error("Erro ao desconectar");
    }
  }, []);

  const refreshQR = useCallback(async () => {
    if (status === "scanning") {
      try {
        await apiService.refreshQRCode();
        toast.info("Atualizando QR Code...");
      } catch (error) {
        console.error('Erro ao atualizar QR:', error);
        toast.error("Erro ao atualizar QR Code");
      }
    }
  }, [status]);

  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const result = await apiService.getGroups();

      if (result.success) {
        setGroups(result.groups);
        console.log(`📋 ${result.groups.length} grupos carregados`);
      } else {
        throw new Error('Erro ao carregar grupos');
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      toast.error("Erro ao carregar grupos. Verifique a conexão.");
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  const selectGroup = useCallback((group: WhatsAppGroup | null) => {
    setSelectedGroup(group);
    if (group) {
      localStorage.setItem(SELECTED_GROUP_KEY, JSON.stringify(group));
      toast.success(`Grupo "${group.name}" selecionado`);
    } else {
      localStorage.removeItem(SELECTED_GROUP_KEY);
    }
  }, []);

  return {
    status,
    qrCode,
    groups,
    selectedGroup,
    isLoadingGroups,
    serverConnected,
    connect,
    disconnect,
    refreshQR,
    loadGroups,
    selectGroup,
  };
}
