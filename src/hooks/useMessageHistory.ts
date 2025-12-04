import { useState, useEffect } from "react";
import { MessageHistoryItem } from "@/types/product";

const STORAGE_KEY = "whatsapp-promo-history";

export function useMessageHistory() {
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((item: MessageHistoryItem) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          scheduledTime: item.scheduledTime ? new Date(item.scheduledTime) : null,
        })));
      } catch (e) {
        console.error("Error parsing history:", e);
      }
    }
  }, []);

  const saveToHistory = (item: MessageHistoryItem) => {
    setHistory((prevHistory) => {
      const newHistory = [item, ...prevHistory].slice(0, 50); // Keep last 50 items
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    saveToHistory,
    removeFromHistory,
    clearHistory,
  };
}
