export async function rpc<T, U>(message: T) {
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
