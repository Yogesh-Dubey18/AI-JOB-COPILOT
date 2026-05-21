declare const chrome: {
  runtime: {
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void) => void;
    };
  };
  storage: {
    sync: {
      get: (keys: string[] | Record<string, unknown>, callback: (items: Record<string, unknown>) => void) => void;
      set: (items: Record<string, unknown>, callback?: () => void) => void;
    };
  };
  tabs: {
    query: (queryInfo: Record<string, unknown>) => Promise<Array<{ id?: number; url?: string }>>;
    sendMessage: (tabId: number, message: Record<string, unknown>) => Promise<any>;
    create: (createProperties: { url: string }) => void;
  };
};
