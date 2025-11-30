import { getCurrentTab } from './getCurrentTab';

type BasicRpcMessage = {
  type: string;
  downloadId?: string;
  from?: string;
  payload?: any;
};

export async function rpc<T extends BasicRpcMessage, U>(message: T): Promise<U> {
  return new Promise<U>((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};

export async function rpcToMainProcess<T extends BasicRpcMessage, U>(message: T): Promise<U> {
  // popup -> background -> main
  try {
    const tabId = await getCurrentTab();
    if (!tabId) {
      throw new Error('未找到活动标签页');
    }
    return rpc({ type: 'TO_MAIN_PROCESS', tabId, payload: { ...message, from: 'popup' } });
  } catch (error: any) {
    throw new Error(`获取当前标签页失败: ${error?.message}`);
  }
};
