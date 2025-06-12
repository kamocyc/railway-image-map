declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: { Player: any; };
  }
}

export class YouTubePlayer {
  private static instance: YouTubePlayer | null = null;
  private player: any;
  private videoId: string;
  private startTime: number;

  private constructor(elementId: string, videoId: string, startTime: number) {
    this.videoId = videoId;
    this.startTime = startTime;
    this.initPlayer(elementId);
  }

  public static getInstance(elementId: string, videoId: string, startTime: number): YouTubePlayer {
    if (!YouTubePlayer.instance) {
      YouTubePlayer.instance = new YouTubePlayer(elementId, videoId, startTime);
    } else {
      // 既存のインスタンスがある場合は、新しいパラメータで更新
      // YouTubePlayer.instance.loadVideo(videoId, startTime);
    }
    return YouTubePlayer.instance;
  }

  private initPlayer(elementId: string) {
    if (window.YT && window.YT.Player) {
      this.player = new window.YT.Player(elementId, {
        videoId: this.videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
        },
        startSeconds: this.startTime,
        events: {
          onReady: this.onPlayerReady,
          onStateChange: this.onPlayerStateChange,
          onError: this.onPlayerError,
        },
      });
    } else {
      setTimeout(() => {
        const scriptTag = document.createElement('script');
        scriptTag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(scriptTag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          this.player = new window.YT!.Player(elementId, {
            videoId: this.videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              startSeconds: this.startTime,
            },
            events: {
              onReady: this.onPlayerReady,
              onStateChange: this.onPlayerStateChange,
              onError: this.onPlayerError,
            },
          });
        };
      }, 100);  // なぜか100ms待つとうまくいく。そうしないと再生ボタンを押しても反応しないことがあった。typeof this.player.loadVideoById === 'function'がfalseになっていた
    }
  }

  private onPlayerReady = (event: any) => {
    event.target.playVideo();
  };

  private onPlayerStateChange = () => {
    // Handle player state changes if needed
  };

  private onPlayerError = (event: any) => {
    console.error('YouTube Player Error:', event);
  };

  public playVideo() {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public seekTo(seconds: number) {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
    }
  }

  public loadVideo(videoId: string, startTime: number) {
    this.videoId = videoId;
    this.startTime = startTime;
    if (this.player && typeof this.player.loadVideoById === 'function') {
      this.player.loadVideoById({
        videoId: this.videoId,
        startSeconds: this.startTime,
      });
    } else {
      console.error('YouTube Player is not ready');
    }
  }
}