export default async function rpc(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
};
