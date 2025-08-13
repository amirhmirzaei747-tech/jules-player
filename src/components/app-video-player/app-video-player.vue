<template src="./app-video-player.html"></template>
<style lang="scss" src="./app-video-player.scss" scoped></style>

<script lang="ts">
import { defineComponent } from "vue";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import fa from "@/assets/i18n/fa.json";
import IconRate from "@/components/icons/IconRate.vue";
import IconLowVolume from "@/components/icons/volume/IconLowVolume.vue";
import IconPause from "@/components/icons/IconPause.vue";
import IconHighVolume from "@/components/icons/volume/IconHighVolume.vue";
import IconZeroVolume from "@/components/icons/volume/IconZeroVolume.vue";
import IconForward from "@/components/icons/IconForward.vue";
import IconMuteVolume from "@/components/icons/volume/IconMuteVolume.vue";
import IconOutPiP from "@/components/icons/IconOutPiP.vue";
import IconFullScreen from "@/components/icons/IconFullScreen.vue";
import IconPlay from "@/components/icons/IconPlay.vue";
import IconBackward from "@/components/icons/IconBackward.vue";
import IconSubtitle from "@/components/icons/IconSubtitle.vue";
import IconEnlarge from "@/components/icons/IconEnlarge.vue";
import IconToPiP from "@/components/icons/IconToPiP.vue";
import IconMedVolume from "@/components/icons/volume/IconMedVolume.vue";
import IconReload from "@/components/icons/IconReload.vue";
import IconSetting from "@/components/icons/IconSetting.vue";
import type {
  AdOptionsModel,
  adsModel,
  creditActions,
  EventLog,
  nextVideoModel,
  QualityModel,
  skipRangeModel,
  sourceModel,
  subtitleModel,
} from "@/core/models/player.model";
import IconNextVideo from "@/components/icons/IconNextVideo.vue";
import { LogEvents, SubtitleLabels } from "@/core/enums/player.enum";
import IconBack from "@/components/icons/IconBack.vue";
import NoInternet from "@/components/no-internet/no-internet.vue";
import skipCredits from "../skip-credits/skip-credits.vue";
import { apiService } from "@/api";

export default defineComponent({
  name: "VideoPlayer",
  components: {
    NoInternet,
    skipCredits,
    IconBack,
    IconNextVideo,
    IconSetting,
    IconReload,
    IconSubtitle,
    IconRate,
    IconOutPiP,
    IconToPiP,
    IconZeroVolume,
    IconLowVolume,
    IconMedVolume,
    IconMuteVolume,
    IconHighVolume,
    IconBackward,
    IconForward,
    IconEnlarge,
    IconFullScreen,
    IconPause,
    IconPlay,
  },
  props: {
    sources: {
      type: Array as () => sourceModel[],
      default() {
        return [] as sourceModel[];
      },
    },
    ads: {
      type: Array as () => adsModel[],
      default() {
        return [] as adsModel[];
      },
    },
    subtitles: {
      type: Array as () => subtitleModel[],
      default() {
        return [] as subtitleModel[];
      },
    },
    lastSeenTime: {
      type: Number,
      default: 0,
    },
    skipRanges: {
      type: Array<skipRangeModel>,
      default: () => [],
    },
    poster: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    returnUrl: {
      type: String,
      default: "",
    },
    contentId: {
      type: Number,
    },
    episodeId: {
      type: Number,
    },
    trailerIndex: {
      type: Number,
    },
    creditActions: {
      type: Array as () => creditActions[],
      default() {
        return [] as creditActions[];
      },
    },
    nextVideo: {
      type: Object as () => nextVideoModel,
      default() {
        return {} as nextVideoModel;
      },
    },
  },
  data() {
    return {
      player: null as any,
      hasAutoQualityBeenSet: false,
      isOnCreditSkipRange: false as boolean,
      creditSkipRangeTitle: "" as string,
      skipRangeStart: 0 as number,
      skitpRangeEnd: 0 as number,
      options: {
        autoplay: true,
        controls: true,
        language: "fa",

        responsive: true,
        poster: "",
        preload: "auto",
        playbackRates: [0.5, 1, 1.5, 1.75, 2],
        controlBar: {
          skipButtons: {
            forward: 10,
            backward: 10,
          },
        },
        userInactiveTimeout: 10000,
        sources: [] as sourceModel[],
        tracks: [] as subtitleModel[],
      },
      actionComponent: "",
      currentTime: 0,
      showingAds: false,
      videoHeight: 0,
      currentAdOptions: {
        skipOffset: 0,
        id: 0,
        clickLink: "",
        poster: "",
      } as AdOptionsModel | null,
      ended: false,
      totalErrIndex: 0,
      m3u8Qualities: [] as Array<any>,
      qualities: [] as QualityModel[],
      autoQualityInterval: 0,
      isAutoQualitySelected: false,
      eventLog: {
        feature: "player",
      } as EventLog,
      currentVideoBytes: 0,
      downloadedBytes: 0,
      logRetryCounter: 0,
    };
  },

  mounted() {
    this.setFaLanguage();
    this.setDocumentTitle();
    this.initLogFile();
    this.checkHasAds();
    this.playerInit();
    this.hideCustomMenusOnActions();
    this.eventListenerForClosing();
    this.checkUserClickedBackBtn();
    this.appendChildToPlayer();
    this.checkFaildedToSendLogEvents();
    this.checkUserNetwork();
    this.playVideoAfterTakeOnline();
    if (this.player.currentSource().type !== "application/x-mpegURL") {
      this.checkHasMultipleQualityMP4();
    }

    setTimeout(() => {
      this.playVideoFromUserLastSeen();
    }, 500);

    window.addEventListener("keydown", this.handleKeyboardShortcuts);
  },
  methods: {
    setDocumentTitle(): void {
      if (this.title) {
        document.title = this.title + " | " + "پرده آبی";
      }
    },

    handleKeyboardShortcuts(event: KeyboardEvent) {
      if (!this.player) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (this.player.paused()) {
            this.player.play();
          } else {
            this.player.pause();
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          this.handelSeekForwardBtn();
          break;
        case "ArrowLeft":
          event.preventDefault();
          this.handelSeekBackwardBtn();
          break;
        case "ArrowUp":
          event.preventDefault();
          this.player.volume(Math.min(1, this.player.volume() + 0.1));
          break;
        case "ArrowDown":
          event.preventDefault();
          this.player.volume(Math.max(0, this.player.volume() - 0.1));
          break;
      }
    },

    getForamtedDate(date: Date): string {
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(date)
        .replace(",", "");
    },
    initLogFile() {
      const featureMeta: any = {
        contentId: this.contentId,
        episodeId: this.episodeId || 1,
        trailerIndex: this.trailerIndex || 1,
        type: "vod",
      };
      this.eventLog.date = new Date().getTime();
      this.eventLog.featureMeta = JSON.stringify(featureMeta);
    },
    checkHasAds() {
      if (this.ads?.length) {
        this.initAd(this.ads[0]);
        return;
      } else {
        this.currentAdOptions = null;
        this.playVideoFromUserLastSeen();
      }
      this.options.sources = this.sources;
    },
    playVideoFromUserLastSeen() {
      if (this.lastSeenTime && !this.currentAdOptions) {
        this.player?.currentTime(this.lastSeenTime);
        this.player?.play();
      }
    },
    initAd(ad: adsModel) {
      document.getElementById("videoPlayer")?.classList.add("vjs-ads");
      if (this.player) {
        this.player.src(ad.videos);
      } else {
        this.options.sources = ad.videos[0].src as any;
      }
      this.calculateVideoTrafficVolume();
      this.currentAdOptions = {
        skipOffset: ad.showSkipAdSecond ?? 0,
        id: ad.id,
        clickLink: ad.clickLink ?? "",
        poster: ad.thumbnailUrl ?? "",
      };
      if (ad.id) {
        this.showingAds = true;
      }
    },
    changePLayerSourceOnError(error: any) {
      if (
        error.code === 4 &&
        this.player.currentSource().type === "application/x-mpegURL"
      ) {
        this.checkHasMultipleQualityMP4();
        const mp4Source = this.options.sources.find(
          (s: any) => s.type === "video/mp4"
        );
        if (mp4Source) {
          this.player.src(mp4Source);
          this.player.play();

          this.qualityChanged(null, {} as any, 0);
          return; // Prevent further error handling
        }
      }
    },
    playerInit() {
      this.player = videojs(
        this.$refs.videoPlayer as Element,
        this.options,
        () => {
          this.addSeekForward();
          this.addSeekBackward();

          this.player.on("fullscreenchange", () =>
            this.rotateScreenOnFullscreen(this.player)
          );
          this.player.on("ended", () => this.videoEnded());

          this.player.on("timeupdate", () => {
            this.progressed();

            this.skipCreditsHandler(this.skipRanges[0]);
            if (!this.hasAutoQualityBeenSet) {
              console.log('if set auto');
              
              this.setQualityOnAuto();

              this.hasAutoQualityBeenSet = true;
            }
          });
          this.player.on("waiting", () => this.handleAutoQuality());
          this.player.on("error", () => {
            let error = this.player.error();
            console.log(error);
            if (error) {
              if (
                (error.code == 4 || error.code == 12 || error.code == 4) &&
                this.currentTime !== 0
              ) {
                this.player.error(null);
              }
              this.changePLayerSourceOnError(error);
              switch (error.code) {
                case 1:
                  error.message = "VIDEO_NOT_FOUND"; // Media file not found
                  break;

                case 2:
                  error.message = "NO_SUPPORTED_PLAYBACK"; // Incompatible format or codec
                  break;

                case 3:
                  error.message = "HLS_NOT_SUPPORTED"; // HLS streaming is not supported
                  break;

                case 4:
                  error.message = "M3U8_NOT_FOUND"; // M3U8 playlist not found
                  break;

                case 5:
                  error.message = "MEDIA_ERR_DECODE"; // Error decoding the media file
                  break;

                case 6:
                  error.message = "MEDIA_ERR_SRC_NOT_SUPPORTED"; // Media source not supported
                  break;

                case 7:
                  error.message = "NETWORK_ERR"; // Network failure or issue loading media
                  break;

                case 8:
                  error.message = "TIMEOUT_ERR"; // Timeout while loading the media
                  break;

                case 9:
                  error.message = "INVALID_MEDIA"; // Invalid or corrupt media source
                  break;

                case 10:
                  error.message = "CORS_ERR"; // Cross-origin request failed
                  break;

                case 11:
                  error.message = "DRM_ERR"; // DRM (Digital Rights Management) error
                  break;

                case 12:
                  error.message = "NO_PLAYBACK"; // No available playback method for media
                  break;

                case 13:
                  error.message = "FLASH_NOT_SUPPORTED"; // Flash is required but not supported
                  break;

                case 14:
                  error.message = "LOADING_ERR"; // Error loading the media file
                  break;
                default:
                  error.message = "Unknown_ERR";
                  break;
              }

              this.addErrorLog(error.code, error.message);
            }
          });
          // this.player.on("touchstart", (e: any) => this.handelPlayIconTouch(e));

          if (this.nextVideo?.id) {
            this.addNextVideoBtn();
          }
          this.player.qualityLevels();
          this.subtitleChangeLogger();
          this.calculateVideoTrafficVolume();
        }
      );
    },
    handlePlay() {
      if (this.currentTime > 5) {
        this.player.requestFullscreen();
      }

      this.player.play();
    },
    handlePause() {
      this.player.pause();
    },
    calculateVideoTrafficVolume() {
      if (!this.player?.tech_?.vhs && this.player?.src()) {
        fetch(this.player?.src()).then((response) => {
          this.currentVideoBytes = parseInt(
            response.headers.get("Content-Length") as string
          );
        });
      }
    },
    setFaLanguage() {
      videojs.addLanguage("fa", fa);
    },
    playbackAnimation(
      action:
        | "play"
        | "pause"
        | "fullscreen"
        | "enLarge"
        | "toPiP"
        | "outPiP"
        | "forward"
        | "backward"
        | "muted"
        | "unMuted"
    ) {
      const playbackEl =
        document.getElementsByClassName("playback-animation")[0];
      document
        .getElementsByClassName("fullscreen-hide-control")[0]
        .classList.remove("d-none");
      switch (action) {
        case "play":
          this.actionComponent = "IconPlay";
          break;
        case "pause":
          this.actionComponent = "IconPause";
          break;
        case "fullscreen":
          this.actionComponent = "IconFullScreen";
          break;
        case "enLarge":
          this.actionComponent = "IconEnlarge";
          break;
        case "toPiP":
          this.actionComponent = "IconToPiP";
          break;
        case "outPiP":
          this.actionComponent = "IconToPiP";
          break;
        case "forward":
          this.actionComponent = "IconForward";
          break;
        case "backward":
          this.actionComponent = "IconBackward";
          break;
        case "muted":
          this.actionComponent = "IconMuteVolume";
          break;
        case "unMuted":
          this.actionComponent = "IconMedVolume";
          break;
      }
      playbackEl?.animate(
        [
          {
            opacity: 0.7,
            transform: "scale(1)",
          },
          {
            opacity: 0,
            transform: "scale(1.3)",
          },
        ],
        {
          duration: 500,
        }
      );
      setTimeout(() => {
        document
          .getElementsByClassName("fullscreen-hide-control")[0]
          .classList.add("d-none");
      }, 500);
    },
    rotateScreenOnFullscreen(player: any) {
      if (player.isFullscreen()) {
        const elements = document.getElementsByClassName("action-btn");
        const creditsContainer = document.getElementById(
          "credits-container"
        ) as HTMLElement;

        document.getElementById("videoPlayer")?.appendChild(creditsContainer);

        for (let element of elements) {
          document.getElementById("videoPlayer")?.appendChild(element);
        }

        const skipElement: any = document.getElementById("skip-btn");

        document.getElementById("videoPlayer")?.appendChild(skipElement);

        // this.playbackAnimation("fullscreen");
        window.screen.orientation.lock("landscape");
        return;
      }
      window.screen.orientation.unlock();
      // this.playbackAnimation("enLarge");
    },
    skipAd(skiped: boolean, isClicked: boolean, hasAdLog: boolean) {
      if (hasAdLog) {
        this.addAdLog(skiped, isClicked);
      }

      if (this.ads?.length) {
        const currentAdIdx: number = this.ads.findIndex(
          (f) => f.id === this.currentAdOptions?.id
        );
        if (currentAdIdx === -1 || currentAdIdx === this.ads.length - 1) {
          this.playVideoAfterAds();
          return;
        }
        this.initAd(this.ads[currentAdIdx + 1]);
        return;
      }

      this.currentAdOptions = null;
      this.playVideoAfterAds();
    },
    playVideoAfterAds() {
      document.getElementById("videoPlayer")?.classList.remove("vjs-ads");
      this.showingAds = false;

      this.player.src(this.sources);
      setTimeout(() => {
        this.qualityChangedM3U8(-1, {} as any, true);
      }, 1500);
      if (this.lastSeenTime) {
        this.player.currentTime(this.lastSeenTime);
      }
    },
    videoEnded() {
      if (!this.showingAds) {
        this.endingLog(true);
      }
      if (this.currentAdOptions?.id) {
        this.skipAd(true, false, this.showingAds);
      } else if (this.ads?.length) {
        this.playVideoAfterAds();

        this.endingLog();
      } else {
        document
          .getElementsByClassName("fullscreen-hide-control")[0]
          .classList.remove("d-none");
        this.ended = true;
        this.endingLog();
      }
    },
    async nextEpisode(episodeId: string) {
      this.logNewEvent(LogEvents.nextEpisode, {
        nextEpisodeId: episodeId,
      });
      await this.endingLog();
      await this.$router.push({
        name: "watchParams",
        params: this.$route.params,
        query: {
          ...this.$route.query,
          episodeId,
        },
      });
      window.location.reload();
    },
    skipTo(time: number) {
      this.player.currentTime(time);
    },
    handelSeekBackwardBtn() {
      const currentTime = this.player.currentTime();
      this.player.currentTime(currentTime - 15);
    },
    handelSeekForwardBtn() {
      const currentTime = this.player.currentTime();
      this.player.currentTime(currentTime + 15);
    },
    nextEpisodeBtn() {
      document.getElementById("show-next")?.classList.toggle("d-flex");
    },
    addNextVideoBtn() {
      const Button = videojs.getComponent("Button");

      class MyButton extends Button {
        constructor(player: any, options: any) {
          super(player, options);
          this.createElement(this.el());
        }

        createElement(element: Element & { title: string }) {
          element.classList.add("vjs-next-item");
          element.title = "قسمت بعدی";
          element.id = "show-next-btn";

          setTimeout(() => {
            const child = document.getElementById("next-episode");
            child?.classList.remove("d-none");
            element.appendChild(child as Node);
          }, 500);
        }
      }

      videojs.registerComponent("NextVideo", MyButton);
      this.player.getChild("controlBar")?.addChild("NextVideo", {}, 11);
    },
    sortQuality(array: Array<any>) {
      return array.sort((a, b) => (a.height < b.height ? 1 : -1));
    },

    qualityBtnToggle() {
      document.getElementById("qualityList")?.classList.toggle("d-flex");
    },
    addQualityLevelsBtn() {
      if (!videojs.getComponent("qualityChange")) {
        const Button = videojs.getComponent("Button");

        class MyButton extends Button {
          constructor(player: any, options: any) {
            super(player, options);
            this.createElement(this.el());
          }

          createElement(element: Element & { title: string }) {
            element.classList.add("vjs-quality-change");
            element.title = "کیفیت پخش";
            element.id = "qualityListBtn";

            setTimeout(() => {
              const child = document.getElementById("quality-levels");
              child?.classList.remove("d-none");
              element.appendChild(child as Node);
            }, 500);
          }
        }

        videojs.registerComponent("qualityChange", MyButton);
        this.player.getChild("controlBar")?.addChild("qualityChange", {}, 12);
      }
    },
    addSeekBackward() {
      const Button = videojs.getComponent("Button");

      class MyButton extends Button {
        constructor(player: any, options: any) {
          super(player, options);
          this.createElement(this.el());
        }

        createElement(element: Element & { title: string }) {
          element.classList.add("vjs-skip-backward-10");
          element.title = "15 ثانیه قبل";
          element.id = "show-skip-backward-btn";

          const child = document.getElementById("seekBackward");
          child?.classList.remove("d-none");
          element.appendChild(child as Node);
        }
      }

      videojs.registerComponent("SkipBackward", MyButton);
      this.player.getChild("controlBar")?.addChild("SkipBackward", {}, 1);
    },
    addSeekForward() {
      const Button = videojs.getComponent("Button");

      class MyButton extends Button {
        constructor(player: any, options: any) {
          super(player, options);
          this.createElement(this.el());
        }

        createElement(element: Element & { title: string }) {
          element.classList.add("vjs-skip-forward-10");
          element.title = "15 ثانیه بعد";
          element.id = "show-skip-forward-btn";

          const child = document.getElementById("seekForward");
          child?.classList.remove("d-none");
          element.appendChild(child as Node);
        }
      }

      videojs.registerComponent("SkipForward", MyButton);
      this.player.getChild("controlBar")?.addChild("SkipForward", {}, 1);
    },
    // setAutoQualityFallBack() {
    //   const autoQualityOptionElement = document.getElementById(
    //     "auto-quality-mp4-option"
    //   ) as HTMLElement;

    //   if (!autoQualityOptionElement.classList.contains("selected-quality")) {
    //     autoQualityOptionElement.classList.add("selected-quality");
    //   }
    // },
    qualityChanged(src: string | null, event: PointerEvent, height: number) {
      //style codes
      console.log('qualityChanged');
      

      const qualities = document.getElementById("qualityList")?.children;
      if (qualities)
        for (const child of qualities) {
          child.classList.remove("selected-quality");
        }

      if (src) {
        (event.target as HTMLElement)?.classList.add("selected-quality");
      } else {
        const autoQualityOptionElement = document.getElementById(
          "auto-quality-mp4-option"
        ) as HTMLElement;

        if (
          autoQualityOptionElement &&
          !autoQualityOptionElement.classList.contains("selected-quality")
        ) {
          autoQualityOptionElement.classList.add("selected-quality");

          // Optionally, if you want to ensure the class stays, you can check a few times:
          // const setAutoQualityFallBackInterval = setInterval(() => {
          //   console.log('call qualityChanged inter');
            
          //   if (
          //     !autoQualityOptionElement.classList.contains("selected-quality")
          //   ) {
          //     autoQualityOptionElement.classList.add("selected-quality");
          //   } else {
          //     clearInterval(setAutoQualityFallBackInterval);
          //   }
          // }, 1000);
        }
      }

      this.logNewEvent(LogEvents.quality, {
        quality: height,
        changeTime: this.player.currentTime(),
      });

      if (src) {
        this.isAutoQualitySelected = false;
        if (this.autoQualityInterval) {
          clearInterval(this.autoQualityInterval);
        }
        const currentTime = this.player.currentTime();
        this.player.src(src);
        this.player.currentTime(currentTime);
        this.player.play();
        this.calculateVideoTrafficVolume();
        return;
      }

      this.isAutoQualitySelected = true;
      this.autoQualityInterval = setTimeout(() => {
        this.handleAutoQuality();
      }, 5000);
    },
    qualityChangedM3U8(
      index: number,
      event: PointerEvent,
      isForcedAutoQuality: undefined | boolean
    ) {
      
      const qualities = document.getElementById("qualityList")?.children;
      if (qualities) {
        for (const child of qualities) {
          child.classList.remove("selected-quality");
        }
      }

      if (!isForcedAutoQuality) {
        (event.target as HTMLElement)?.classList.add("selected-quality");
      } else {
        const autoQualityOptionElement = document.getElementById(
          "auto-quality-mp4-option"
        ) as HTMLElement;

        if (
          autoQualityOptionElement &&
          !autoQualityOptionElement.classList.contains("selected-quality")
        ) {
          autoQualityOptionElement.classList.add("selected-quality");
          const setAutoQualityFallBackInterval = setInterval(() => {
                console.log('call qualityChanged m3u8 inter');
            if (
              !autoQualityOptionElement.classList.contains("selected-quality")
            ) {
              autoQualityOptionElement.classList.add("selected-quality");
            } else {
              clearInterval(setAutoQualityFallBackInterval);
            }
          }, 1000);
          
        }
      }

      const qualityLevels = this.player.qualityLevels();
      this.isAutoQualitySelected = index === -1;
      if (index >= qualityLevels.length || index < 0) {
        index = -1;
      }

      for (let i = 0; i < qualityLevels.length; i++) {
        if (index === -1) {
          qualityLevels[i].enabled = true;
        } else {
          qualityLevels[i].enabled = i === index;
        }
      }

      if (this.isAutoQualitySelected) {
        this.logNewEvent(LogEvents.quality, { quality: 0 });
      } else {
        this.logNewEvent(LogEvents.quality, {
          quality: qualityLevels[index]?.height,
        });
      }

      this.player.trigger("qualitychange");
    },
    checkHasMultipleQuality() {
      const srcType: string = this.player.currentSources()[0].type;

      if (
        srcType?.includes("x-mpegURL") &&
        this.player.qualityLevels().levels_.length > 1
      ) {
        this.addQualityLevelsBtn();
        this.m3u8Qualities = this.player.qualityLevels().levels_;
        this.m3u8Qualities.map((item) => {
          const width = Math.min(item.width, item.height);
          const height = Math.max(item.width, item.height);
          item.width = width;
          item.height = height;
        });

        this.m3u8Qualities = this.sortQuality(this.m3u8Qualities);

      }
    },
    checkHasMultipleQualityMP4() {
      if (this.sources?.length > 1 && !this.qualities?.length) {
        this.qualities = [];

        for (let videoSrc of this.sources) {
          const video = document.createElement("video");
          video.src = videoSrc.src;
          video.addEventListener("loadedmetadata", () => {
            this.qualities.push({
              src: videoSrc.src,
              label: Math.min(video.videoHeight, video.videoWidth) + "p",
              height: Math.min(video.videoHeight, video.videoWidth),
            });

            this.qualities.sort((a, b) => b.height - a.height);
          });
        }

        this.addQualityLevelsBtn();
        this.qualityChanged(null, {} as any, 0);
      }
    },
    setQualityOnAuto() {
      this.qualityChangedM3U8(-1, {} as any, true);
      this.handleAutoQuality();
    },
    handleAutoQuality() {
      if (this.isAutoQualitySelected) {
        const speed: number = navigator.connection.downlink;

        let src: string | undefined = "";

        if (speed >= 50) {
          // 8K
          src = this.qualities.find((f) => f.height >= 4320)?.src;
        } else if (speed >= 25) {
          // 4K
          src = this.qualities.find(
            (f) => f.height >= 2160 && f.height < 4320
          )?.src;
        } else if (speed >= 2.5) {
          // 1080p
          src = this.qualities.find(
            (f) => f.height >= 1080 && f.height < 2160
          )?.src;
        } else if (speed >= 1.5) {
          // 720p
          src = this.qualities.find(
            (f) => f.height >= 720 && f.height < 1080
          )?.src;
        } else if (speed >= 1.3) {
          // 480p
          src = this.qualities.find(
            (f) => f.height >= 480 && f.height < 720
          )?.src;
        } else if (speed >= 0.9) {
          // 360p
          src = this.qualities.find(
            (f) => f.height >= 360 && f.height < 480
          )?.src;
        } else if (speed >= 0.3) {
          // 240p
          src = this.qualities.find(
            (f) => f.height >= 240 && f.height < 360
          )?.src;
        } else {
          // Lowest available
          src = this.qualities[this.qualities.length - 1].src;
        }
        if (src != this.player.src() && !this.player.paused()) {
          const currentTime = this.player.currentTime();
          this.player.src(src);
          this.player.currentTime(currentTime);
          this.player.play();
        }
      }
    },
    hideCustomMenusOnActions() {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach((mutationRecord) => {
          let res = document.querySelectorAll("#qualityList, #show-next");
          for (let i = 0; i < res.length; i++) {
            res[i].classList.remove("d-flex");
          }
        });
      });

      document.addEventListener("click", function (event: any) {
        if (
          !event.target?.matches(
            "#qualityListBtn, #qualityListBtn *, #show-next-btn, #show-next-btn *"
          )
        ) {
          let res = document.querySelectorAll("#qualityList, #show-next");
          for (let i = 0; i < res.length; i++) {
            res[i].classList.remove("d-flex");
          }
        }
      });

      const target = document.getElementById("videoPlayer");
      observer.observe(target as Node, {
        attributes: true,
        attributeFilter: ["class"],
      });
    },
    subtitleChangeLogger() {
      this.player.textTracks().on("change", () => {
        const found: TextTrack = this.player
          .textTracks()
          .tracks_.find((f: { mode: string }) => f.mode === "showing");
        if (found) {
          this.logNewEvent(LogEvents.subtitle, {
            isSubtitleEnabled: true,
            language: found.language,
          });
        } else {
          this.logNewEvent(LogEvents.subtitle, {
            isSubtitleEnabled: false,
            language: "",
          });
        }
      });
    },
    logLastSeenTime() {
      const lastSeenTime: number = this.player?.currentTime();

      if (lastSeenTime < 30) {
        return;
      }

      this.logNewEvent(LogEvents.lastSeenTime, {
        time: lastSeenTime,
      });
    },
    totalPlayedTimeLog() {
      const playedTimeRanges = this.player?.played();
      let totalTimePlayed = 0;
      for (let i = 0; i < playedTimeRanges.length; i++) {
        totalTimePlayed += playedTimeRanges.end(i) - playedTimeRanges.start(i);
      }
      this.logNewEvent(LogEvents.watchedTime, {
        watchedTime: totalTimePlayed,
      });
    },
    addAdLog(skipped?: boolean, clicked?: boolean) {
      this.logNewEvent(LogEvents.ads, {
        adsId: this.currentAdOptions?.id.toString(),
        durationElapsed: this.player.currentTime(),
        isSkipped: skipped,
        isClicked: clicked,
        trafficAmount: this.calculateHowMuchDownloaded(),
      });
      this.logRetryCounter = 0;
    },
    logNewEvent(event: LogEvents, eventMeta: any) {
      if (this.eventLog.events?.length) {
        const eventIndex = this.eventLog.events.findIndex(
          (item) => item.event === event
        );
        if (eventIndex !== -1 && event !== "quality" && event !== "error") {
          this.eventLog.events[eventIndex] = {
            date: new Date().getTime(),
            event: event,
            eventMeta: JSON.stringify(eventMeta),
          };
          return;
        }

        this.eventLog.events.push({
          date: new Date().getTime(),
          event: event,
          eventMeta: JSON.stringify(eventMeta),
        });
      } else {
        this.eventLog.events = [
          {
            date: new Date().getTime(),
            event: event,
            eventMeta: JSON.stringify(eventMeta),
          },
        ];
      }
    },
    addTrafficLog() {
      this.logNewEvent(LogEvents.traffic, {
        trafficAmount: this.calculateHowMuchDownloaded(),
      });
    },
    isVideoPlaying() {
      return this.player && !this.player.paused();
    },
    addErrorLog(code: number, message: string) {
      if (this.totalErrIndex > 6) {
        return;
      }
      setTimeout(() => {
        if (!this.isVideoPlaying()) {
          this.addErrorLog(4, "M3U8_NOT_FOUND");
          this.totalErrIndex = this.totalErrIndex + 1;
        }
      }, 2000);
      this.totalErrIndex = this.totalErrIndex + 2;
      this.qualityChangedM3U8(this.totalErrIndex, {} as any, undefined);

      this.logNewEvent(LogEvents.error, {
        errorCode: code,
        errorType: message,
      });
      this.endingLog();
    },

    calculateHowMuchDownloaded() {
      if (!this.player?.tech_?.vhs) {
        const bufferedTimeRanges = this.player?.buffered();
        let totalBuffered = 0;
        for (let i = 0; i < bufferedTimeRanges.length; i++) {
          totalBuffered +=
            bufferedTimeRanges.end(i) - bufferedTimeRanges.start(i);
        }
        return (
          (totalBuffered / this.player?.duration()) * this.currentVideoBytes
        );
      } else {
        return this.player?.tech_?.vhs?.stats?.mediaBytesTransferred;
      }
    },
    eventListenerForClosing() {
      window.addEventListener("beforeunload", () => {
        this.endingLog();
      });

      const isMobileDevice = /android|iphone|ipod|ipad/i.test(
        navigator.platform.toLowerCase()
      );

      if (isMobileDevice) {
        window.addEventListener("visibilitychange", async () => {
          if (document.visibilityState === "hidden") {
            await this.endingLog();
          }
        });
      }
    },
    checkUserClickedBackBtn() {
      window.history.pushState({ back: true }, "", "");
      window.addEventListener("popstate", (event) => {
        if (event.state && event.state.back) {
          this.endingLog();
        }
      });
    },
    async endingLog(isVideoEnded: boolean | null = null) {
      this.logLastSeenTime();
      this.totalPlayedTimeLog();
      this.addTrafficLog();
      this.logRetryCounter = 0;
      await this.callLogApi(this.eventLog, isVideoEnded);
    },
    async callLogApi(eventLog: EventLog, isVideoEnded: boolean | null = null) {
      // check
      // console.log(eventLog)

      await apiService
        .submitLog(eventLog, this.$route.query.token)
        .then((res) => {
          window.localStorage.removeItem("userLogevents");
          if (isVideoEnded) {
            setTimeout(() => {
              this.eventLog.events = [];
            }, 2000);
          }
        })
        .catch((error: any) => {
          console.log(error);
          this.logRetryCounter++;
          if (this.logRetryCounter <= 3) {
            this.callLogApi(eventLog);
          } else {
            window.localStorage.setItem(
              "userLogevents",
              JSON.stringify(this.eventLog)
            );
          }
        });
    },
    backButton() {
      this.endingLog();

      if (!this.returnUrl) {
        window.history.back();
      } else {
        window.location.href = this.returnUrl;
      }
    },
    appendChildToPlayer() {
      document
        .getElementById("videoPlayer")
        ?.appendChild(document.getElementsByClassName("vjs-top-gradient")[0]);
      document
        .getElementById("videoPlayer")
        ?.appendChild(document.getElementsByClassName("no-internet-toast")[0]);

      document
        .getElementById("videoPlayer")
        ?.appendChild(document.getElementsByClassName("vjs-custom-button")[0]);
    },
    progressed() {
      this.currentTime = this.player.currentTime();
      // check
      
      if (this.m3u8Qualities.length == 0) {
          this.checkHasMultipleQuality();
      }
    
      this.videoHeight = Math.min(
        this.player?.videoHeight(),
        this.player?.videoWidth()
      );
    },
    skipCreditsHandler(skipRanges: skipRangeModel) {
      const currentTime = this.player.currentTime();

      if (
        skipRanges &&
        skipRanges.start &&
        skipRanges.end &&
        currentTime >= skipRanges.start &&
        currentTime <= skipRanges.end &&
        !this.showingAds
      ) {
        this.isOnCreditSkipRange = true;
        this.skipRangeStart = skipRanges.start;
        this.skitpRangeEnd = skipRanges.end;
        this.creditSkipRangeTitle = skipRanges.title;
      } else {
        this.isOnCreditSkipRange = false;
        this.creditSkipRangeTitle = "";
      }
    },
    checkFaildedToSendLogEvents() {
      const FaildedLogs = window.localStorage.getItem("userLogevents");
      if (FaildedLogs) {
        this.callLogApi(JSON.parse(FaildedLogs));
      }
    },
    playVideoAfterTakeOnline() {
      window.addEventListener("online", () => {
        if (this.currentTime === 0) {
          this.playVideoAfterAds();
        }
        this.player.pause();
        this.player.play();
      });
    },
    checkUserNetwork() {
      window.addEventListener("offline", () => {
        this.addErrorLog(7, "NETWORK_ERR");
        this.endingLog();
      });
    },
  },
  computed: {
    sortedQualities() {
      // Sort by: HQ first (if height >= 1080 and src includes 'HQ'), then by height descending
      return [...this.qualities].sort((a, b) => {
        const aIsHQ = a.height >= 1080 && a.src.includes("HQ");
        const bIsHQ = b.height >= 1080 && b.src.includes("HQ");
        if (aIsHQ && !bIsHQ) return -1;
        if (!aIsHQ && bIsHQ) return 1;
        return b.height - a.height;
      });
    },
  },
  beforeUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  },
});
</script>
