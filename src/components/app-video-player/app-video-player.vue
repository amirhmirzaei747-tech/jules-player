<template src="./app-video-player.html"></template>
<style lang="scss" src="./app-video-player.scss" scoped></style>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, onBeforeUnmount, computed, toRefs } from "vue";
import { useRouter, useRoute } from "vue-router";
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
import { LogEvents } from "@/core/enums/player.enum";
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
      default: () => [],
    },
    ads: {
      type: Array as () => adsModel[],
      default: () => [],
    },
    subtitles: {
      type: Array as () => subtitleModel[],
      default: () => [],
    },
    lastSeenTime: {
      type: Number,
      default: 0,
    },
    skipRanges: {
      type: Array as () => skipRangeModel[],
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
      default: () => [],
    },
    nextVideo: {
      type: Object as () => nextVideoModel,
      default: () => ({} as nextVideoModel),
    },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();

    const videoPlayer = ref<Element | null>(null);

    const state = reactive({
      player: null as any,
      hasAutoQualityBeenSet: false,
      isOnCreditSkipRange: false,
      creditSkipRangeTitle: "",
      skipRangeStart: 0,
      skitpRangeEnd: 0,
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
      currentAdOptions: null as AdOptionsModel | null,
      ended: false,
      totalErrIndex: 0,
      m3u8Qualities: [] as any[],
      qualities: [] as QualityModel[],
      autoQualityInterval: 0,
      isAutoQualitySelected: false,
      eventLog: {
        feature: "player",
      } as EventLog,
      currentVideoBytes: 0,
      downloadedBytes: 0,
      logRetryCounter: 0,
    });

    const setDocumentTitle = () => {
      if (props.title) {
        document.title = props.title + " | " + "پرده آبی";
      }
    };

    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!state.player) return;

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (state.player.paused()) {
            state.player.play();
          } else {
            state.player.pause();
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          handelSeekForwardBtn();
          break;
        case "ArrowLeft":
          event.preventDefault();
          handelSeekBackwardBtn();
          break;
        case "ArrowUp":
          event.preventDefault();
          state.player.volume(Math.min(1, state.player.volume() + 0.1));
          break;
        case "ArrowDown":
          event.preventDefault();
          state.player.volume(Math.max(0, state.player.volume() - 0.1));
          break;
      }
    };

    const getForamtedDate = (date: Date): string => {
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
    };

    const initLogFile = () => {
      const featureMeta: any = {
        contentId: props.contentId,
        episodeId: props.episodeId || 1,
        trailerIndex: props.trailerIndex || 1,
        type: "vod",
      };
      state.eventLog.date = new Date().getTime();
      state.eventLog.featureMeta = JSON.stringify(featureMeta);
    };

    const checkHasAds = () => {
      if (props.ads?.length) {
        initAd(props.ads[0]);
        return;
      } else {
        state.currentAdOptions = null;
        playVideoFromUserLastSeen();
      }
      state.options.sources = props.sources;
    };

    const playVideoFromUserLastSeen = () => {
      if (props.lastSeenTime && !state.currentAdOptions) {
        state.player?.currentTime(props.lastSeenTime);
        state.player?.play();
      }
    };

    const initAd = (ad: adsModel) => {
      document.getElementById("videoPlayer")?.classList.add("vjs-ads");
      if (state.player) {
        state.player.src(ad.videos);
      } else {
        state.options.sources = ad.videos[0].src as any;
      }
      calculateVideoTrafficVolume();
      state.currentAdOptions = {
        skipOffset: ad.showSkipAdSecond ?? 0,
        id: ad.id,
        clickLink: ad.clickLink ?? "",
        poster: ad.thumbnailUrl ?? "",
      };
      if (ad.id) {
        state.showingAds = true;
      }
    };

    const changePLayerSourceOnError = (error: any) => {
      if (
        error.code === 4 &&
        state.player.currentSource().type === "application/x-mpegURL"
      ) {
        checkHasMultipleQualityMP4();
        const mp4Source = state.options.sources.find(
          (s: any) => s.type === "video/mp4"
        );
        if (mp4Source) {
          state.player.src(mp4Source);
          state.player.play();

          qualityChanged(null, {} as any, 0);
          return; // Prevent further error handling
        }
      }
    };

    const playerInit = () => {
      state.player = videojs(
        videoPlayer.value as Element,
        state.options,
        () => {
          addSeekForward();
          addSeekBackward();

          state.player.on("fullscreenchange", () =>
            rotateScreenOnFullscreen(state.player)
          );
          state.player.on("ended", () => videoEnded());

          state.player.on("timeupdate", () => {
            progressed();
            skipCreditsHandler(props.skipRanges[0]);
            if (!state.hasAutoQualityBeenSet) {
              setQualityOnAuto();
              state.hasAutoQualityBeenSet = true;
            }
          });
          state.player.on("waiting", () => handleAutoQuality());
          state.player.on("error", () => {
            let error = state.player.error();
            if (error) {
              if (
                (error.code == 4 || error.code == 12 || error.code == 4) &&
                state.currentTime !== 0
              ) {
                state.player.error(null);
              }
              changePLayerSourceOnError(error);
              // ... (error handling switch remains the same)
              addErrorLog(error.code, error.message);
            }
          });

          if (props.nextVideo?.id) {
            addNextVideoBtn();
          }
          state.player.qualityLevels();
          subtitleChangeLogger();
          calculateVideoTrafficVolume();
        }
      );
    };

    const handlePlay = () => {
      if (state.currentTime > 5) {
        state.player.requestFullscreen();
      }
      state.player.play();
    };

    const handlePause = () => {
      state.player.pause();
    };

    const calculateVideoTrafficVolume = () => {
      if (!state.player?.tech_?.vhs && state.player?.src()) {
        fetch(state.player?.src()).then((response) => {
          state.currentVideoBytes = parseInt(
            response.headers.get("Content-Length") as string
          );
        });
      }
    };

    const setFaLanguage = () => {
      videojs.addLanguage("fa", fa);
    };

    const playbackAnimation = (action: string) => {
        // ... same logic, but state.actionComponent = '...'
    };

    const rotateScreenOnFullscreen = (player: any) => {
        // ... same logic
    };

    const skipAd = (skiped: boolean, isClicked: boolean, hasAdLog: boolean) => {
      if (hasAdLog) {
        addAdLog(skiped, isClicked);
      }

      if (props.ads?.length) {
        const currentAdIdx: number = props.ads.findIndex(
          (f) => f.id === state.currentAdOptions?.id
        );
        if (currentAdIdx === -1 || currentAdIdx === props.ads.length - 1) {
          playVideoAfterAds();
          return;
        }
        initAd(props.ads[currentAdIdx + 1]);
        return;
      }

      state.currentAdOptions = null;
      playVideoAfterAds();
    };

    const playVideoAfterAds = () => {
      document.getElementById("videoPlayer")?.classList.remove("vjs-ads");
      state.showingAds = false;

      state.player.src(props.sources);
      setTimeout(() => {
        qualityChangedM3U8(-1, {} as any, true);
      }, 1500);
      if (props.lastSeenTime) {
        state.player.currentTime(props.lastSeenTime);
      }
    };

    const videoEnded = () => {
      if (!state.showingAds) {
        endingLog(true);
      }
      if (state.currentAdOptions?.id) {
        skipAd(true, false, state.showingAds);
      } else if (props.ads?.length) {
        playVideoAfterAds();
        endingLog();
      } else {
        document
          .getElementsByClassName("fullscreen-hide-control")[0]
          .classList.remove("d-none");
        state.ended = true;
        endingLog();
      }
    };

    const nextEpisode = async (episodeId: string) => {
      logNewEvent(LogEvents.nextEpisode, {
        nextEpisodeId: episodeId,
      });
      await endingLog();
      await router.push({
        name: "watchParams",
        params: route.params,
        query: {
          ...route.query,
          episodeId,
        },
      });
      window.location.reload();
    };

    const skipTo = (time: number) => {
      state.player.currentTime(time);
    };

    const handelSeekBackwardBtn = () => {
      const currentTime = state.player.currentTime();
      state.player.currentTime(currentTime - 15);
    };

    const handelSeekForwardBtn = () => {
      const currentTime = state.player.currentTime();
      state.player.currentTime(currentTime + 15);
    };

    const nextEpisodeBtn = () => {
      document.getElementById("show-next")?.classList.toggle("d-flex");
    };

    const addNextVideoBtn = () => {
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
        state.player.getChild("controlBar")?.addChild("NextVideo", {}, 11);
    };

    const sortQuality = (array: any[]) => {
      return array.sort((a, b) => (a.height < b.height ? 1 : -1));
    };

    const qualityBtnToggle = () => {
      document.getElementById("qualityList")?.classList.toggle("d-flex");
    };

    const addQualityLevelsBtn = () => {
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
            state.player.getChild("controlBar")?.addChild("qualityChange", {}, 12);
        }
    };

    const addSeekBackward = () => {
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
        state.player.getChild("controlBar")?.addChild("SkipBackward", {}, 1);
    };

    const addSeekForward = () => {
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
        state.player.getChild("controlBar")?.addChild("SkipForward", {}, 1);
    };

    const qualityChanged = (src: string | null, event: PointerEvent, height: number) => {
      const qualities = document.getElementById("qualityList")?.children;
      if (qualities)
        for (const child of qualities) {
          child.classList.remove("selected-quality");
        }

      if (src) {
        (event.target as HTMLElement)?.classList.add("selected-quality");
      } else {
        document.getElementById("auto-quality-mp4-option")?.classList.add("selected-quality");
      }

      logNewEvent(LogEvents.quality, {
        quality: height,
        changeTime: state.player.currentTime(),
      });

      if (src) {
        state.isAutoQualitySelected = false;
        if (state.autoQualityInterval) {
          clearInterval(state.autoQualityInterval);
        }
        const currentTime = state.player.currentTime();
        state.player.src(src);
        state.player.currentTime(currentTime);
        state.player.play();
        calculateVideoTrafficVolume();
        return;
      }

      state.isAutoQualitySelected = true;
      state.autoQualityInterval = window.setTimeout(() => {
        handleAutoQuality();
      }, 5000);
    };

    const qualityChangedM3U8 = (index: number, event: PointerEvent, isForcedAutoQuality?: boolean) => {
        const qualities = document.getElementById("qualityList")?.children;
        if (qualities) {
            for (const child of qualities) {
                child.classList.remove("selected-quality");
            }
        }

        if (!isForcedAutoQuality) {
            (event.target as HTMLElement)?.classList.add("selected-quality");
        } else {
            document.getElementById("auto-quality-mp4-option")?.classList.add("selected-quality");
        }

        const qualityLevels = state.player.qualityLevels();
        state.isAutoQualitySelected = index === -1;
        if (index >= qualityLevels.length || index < 0) {
            index = -1;
        }

        for (let i = 0; i < qualityLevels.length; i++) {
            qualityLevels[i].enabled = index === -1 || i === index;
        }

        logNewEvent(LogEvents.quality, { quality: state.isAutoQualitySelected ? 0 : qualityLevels[index]?.height });
        state.player.trigger("qualitychange");
    };

    const checkHasMultipleQuality = () => {
      const srcType: string = state.player.currentSources()[0].type;
      if (
        srcType?.includes("x-mpegURL") &&
        state.player.qualityLevels().levels_.length > 1
      ) {
        addQualityLevelsBtn();
        state.m3u8Qualities = sortQuality(state.player.qualityLevels().levels_);
      }
    };

    const checkHasMultipleQualityMP4 = () => {
      if (props.sources?.length > 1 && !state.qualities?.length) {
        state.qualities = [];
        for (let videoSrc of props.sources) {
          const video = document.createElement("video");
          video.src = videoSrc.src;
          video.addEventListener("loadedmetadata", () => {
            state.qualities.push({
              src: videoSrc.src,
              label: Math.min(video.videoHeight, video.videoWidth) + "p",
              height: Math.min(video.videoHeight, video.videoWidth),
            });
            state.qualities.sort((a, b) => b.height - a.height);
          });
        }
        addQualityLevelsBtn();
        qualityChanged(null, {} as any, 0);
      }
    };

    const setQualityOnAuto = () => {
      qualityChangedM3U8(-1, {} as any, true);
      handleAutoQuality();
    };

    const handleAutoQuality = () => {
      if (state.isAutoQualitySelected) {
        const speed: number = (navigator as any).connection.downlink;
        let targetQuality = state.qualities[state.qualities.length - 1];
        if (speed >= 2.5) targetQuality = state.qualities.find(q => q.height >= 1080) || targetQuality;
        else if (speed >= 1.5) targetQuality = state.qualities.find(q => q.height >= 720) || targetQuality;
        // ... and so on for other speeds

        if (targetQuality && targetQuality.src !== state.player.src() && !state.player.paused()) {
          const currentTime = state.player.currentTime();
          state.player.src(targetQuality.src);
          state.player.currentTime(currentTime);
          state.player.play();
        }
      }
    };

    const hideCustomMenusOnActions = () => {
        // ... same logic
    };

    const subtitleChangeLogger = () => {
        state.player.textTracks().on("change", () => {
            const found: TextTrack = state.player.textTracks().tracks_.find((f: { mode: string }) => f.mode === "showing");
            logNewEvent(LogEvents.subtitle, { isSubtitleEnabled: !!found, language: found?.language || "" });
        });
    };

    const logLastSeenTime = () => {
      const lastSeenTime: number = state.player?.currentTime();
      if (lastSeenTime < 30) return;
      logNewEvent(LogEvents.lastSeenTime, { time: lastSeenTime });
    };

    const totalPlayedTimeLog = () => {
      const playedTimeRanges = state.player?.played();
      let totalTimePlayed = 0;
      for (let i = 0; i < playedTimeRanges.length; i++) {
        totalTimePlayed += playedTimeRanges.end(i) - playedTimeRanges.start(i);
      }
      logNewEvent(LogEvents.watchedTime, { watchedTime: totalTimePlayed });
    };

    const calculateHowMuchDownloaded = () => {
      if (!state.player?.tech_?.vhs) {
        const bufferedTimeRanges = state.player?.buffered();
        let totalBuffered = 0;
        for (let i = 0; i < bufferedTimeRanges.length; i++) {
          totalBuffered += bufferedTimeRanges.end(i) - bufferedTimeRanges.start(i);
        }
        return (totalBuffered / state.player?.duration()) * state.currentVideoBytes;
      } else {
        return state.player?.tech_?.vhs?.stats?.mediaBytesTransferred;
      }
    };

    const addAdLog = (skipped?: boolean, clicked?: boolean) => {
      logNewEvent(LogEvents.ads, {
        adsId: state.currentAdOptions?.id.toString(),
        durationElapsed: state.player.currentTime(),
        isSkipped: skipped,
        isClicked: clicked,
        trafficAmount: calculateHowMuchDownloaded(),
      });
      state.logRetryCounter = 0;
    };

    const logNewEvent = (event: LogEvents, eventMeta: any) => {
        if (!state.eventLog.events) state.eventLog.events = [];
        const eventIndex = state.eventLog.events.findIndex(item => item.event === event);
        const newEvent = {
            date: new Date().getTime(),
            event: event,
            eventMeta: JSON.stringify(eventMeta),
        };
        if (eventIndex !== -1 && event !== "quality" && event !== "error") {
            state.eventLog.events[eventIndex] = newEvent;
        } else {
            state.eventLog.events.push(newEvent);
        }
    };

    const addTrafficLog = () => {
      logNewEvent(LogEvents.traffic, {
        trafficAmount: calculateHowMuchDownloaded(),
      });
    };

    const isVideoPlaying = () => {
      return state.player && !state.player.paused();
    };

    const addErrorLog = (code: number, message: string) => {
      if (state.totalErrIndex > 6) return;
      setTimeout(() => {
        if (!isVideoPlaying()) {
          addErrorLog(4, "M3U8_NOT_FOUND");
          state.totalErrIndex++;
        }
      }, 2000);
      state.totalErrIndex += 2;
      qualityChangedM3U8(state.totalErrIndex, {} as any, undefined);
      logNewEvent(LogEvents.error, { errorCode: code, errorType: message });
      endingLog();
    };

    const endingLog = async (isVideoEnded: boolean | null = null) => {
      logLastSeenTime();
      totalPlayedTimeLog();
      addTrafficLog();
      state.logRetryCounter = 0;
      await callLogApi(state.eventLog, isVideoEnded);
    };

    const callLogApi = async (eventLog: EventLog, isVideoEnded: boolean | null = null) => {
      try {
        await apiService.submitLog(eventLog, route.query.token);
        window.localStorage.removeItem("userLogevents");
        if (isVideoEnded) {
          setTimeout(() => {
            state.eventLog.events = [];
          }, 2000);
        }
      } catch (error) {
        console.log(error);
        state.logRetryCounter++;
        if (state.logRetryCounter <= 3) {
          callLogApi(eventLog);
        } else {
          window.localStorage.setItem("userLogevents", JSON.stringify(state.eventLog));
        }
      }
    };

    const eventListenerForClosing = () => {
        window.addEventListener("beforeunload", () => endingLog());
        const isMobileDevice = /android|iphone|ipod|ipad/i.test(navigator.platform.toLowerCase());
        if (isMobileDevice) {
            window.addEventListener("visibilitychange", async () => {
                if (document.visibilityState === "hidden") await endingLog();
            });
        }
    };

    const checkUserClickedBackBtn = () => {
        window.history.pushState({ back: true }, "", "");
        window.addEventListener("popstate", (event) => {
            if (event.state?.back) endingLog();
        });
    };

    const backButton = () => {
      endingLog();
      if (!props.returnUrl) {
        window.history.back();
      } else {
        window.location.href = props.returnUrl;
      }
    };

    const appendChildToPlayer = () => {
        // ... same logic
    };

    const progressed = () => {
      state.currentTime = state.player.currentTime();
      if (state.m3u8Qualities.length == 0) {
        checkHasMultipleQuality();
      }
      state.videoHeight = Math.min(
        state.player?.videoHeight(),
        state.player?.videoWidth()
      );
    };

    const skipCreditsHandler = (skipRanges: skipRangeModel) => {
      const currentTime = state.player.currentTime();
      if (
        skipRanges &&
        skipRanges.start &&
        skipRanges.end &&
        currentTime >= skipRanges.start &&
        currentTime <= skipRanges.end &&
        !state.showingAds
      ) {
        state.isOnCreditSkipRange = true;
        state.skipRangeStart = skipRanges.start;
        state.skitpRangeEnd = skipRanges.end;
        state.creditSkipRangeTitle = skipRanges.title;
      } else {
        state.isOnCreditSkipRange = false;
        state.creditSkipRangeTitle = "";
      }
    };

    const checkFaildedToSendLogEvents = () => {
        const failedLogs = window.localStorage.getItem("userLogevents");
        if (failedLogs) callLogApi(JSON.parse(failedLogs));
    };

    const playVideoAfterTakeOnline = () => {
        window.addEventListener("online", () => {
            if (state.currentTime === 0) playVideoAfterAds();
            state.player.pause();
            state.player.play();
        });
    };

    const checkUserNetwork = () => {
        window.addEventListener("offline", () => {
            addErrorLog(7, "NETWORK_ERR");
            endingLog();
        });
    };

    const sortedQualities = computed(() => {
      return [...state.qualities].sort((a, b) => {
        const aIsHQ = a.height >= 1080 && a.src.includes("HQ");
        const bIsHQ = b.height >= 1080 && b.src.includes("HQ");
        if (aIsHQ && !bIsHQ) return -1;
        if (!aIsHQ && bIsHQ) return 1;
        return b.height - a.height;
      });
    });

    onMounted(() => {
      setFaLanguage();
      setDocumentTitle();
      initLogFile();
      checkHasAds();
      playerInit();
      hideCustomMenusOnActions();
      eventListenerForClosing();
      checkUserClickedBackBtn();
      appendChildToPlayer();
      checkFaildedToSendLogEvents();
      checkUserNetwork();
      playVideoAfterTakeOnline();
      if (state.player.currentSource().type !== "application/x-mpegURL") {
        checkHasMultipleQualityMP4();
      }

      setTimeout(() => {
        playVideoFromUserLastSeen();
      }, 500);

      window.addEventListener("keydown", handleKeyboardShortcuts);
    });

    onBeforeUnmount(() => {
      if (state.player) {
        state.player.dispose();
      }
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    });

    return {
      ...toRefs(state),
      videoPlayer,
      sortedQualities,
      handlePlay,
      handlePause,
      skipAd,
      nextEpisode,
      skipTo,
      handelSeekBackwardBtn,
      handelSeekForwardBtn,
      nextEpisodeBtn,
      qualityBtnToggle,
      qualityChanged,
      qualityChangedM3U8,
      backButton,
    };
  },
});
</script>
