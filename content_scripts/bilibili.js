(() => {
  if (window?.isVideoDownloadHelperInjected) return;
  window.isVideoDownloadHelperInjected = true;

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'VIDEO_HELPER_DOWNLOAD') {
      console.log('download resource');
      await downloadResource();
    }
  });
  // bilibili 音视频下载
  async function downloadURL(url, name) {
    const res = await fetch(url, {
      cookie: document.cookie
    });
    const blob = await res.blob();
    const downloadURL = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadURL;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function downloadResource(option = 0) {
    // option = 0: 下载全部
    // option = 1: 仅下载音频
    // option = 2: 仅下载视频
    const __playinfo__ = window.__playinfo__;
    const videoURL = __playinfo__.data.dash.video[0].base_url;
    const audioURL = __playinfo__.data.dash.audio[0].base_url;
    const name = document.querySelector('#viewbox_report > div.video-info-title > div > h1').textContent;
    if(option === 0){
      await downloadURL(videoURL, `${name}_video.temp`);
      await downloadURL(audioURL, `${name}_audio.temp`);
      return `ffmpeg -i "${name}_video.temp" -i "${name}_audio.temp" -vcodec copy -acodec copy "${name}.mp4"
rm "${name}_video.temp"
rm "${name}_audio.temp"
exit`;
    }else if(option === 1){
      await downloadURL(audioURL, `${name}.mp3`);
    }else if(option === 2){
      await downloadURL(videoURL, `${name}.mp4`);
    }
  }
})();
