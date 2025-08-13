<template>
 <loading v-if="loading" />

<error
  v-else-if="errorStatus !== 0 || !sources?.length"
  :errorMessage="errorMessage"
  :errorStatus="errorStatus"
>

</error>
<video-player
  v-else-if="sources?.length && !loading"
  :sources="sources"
  :ads="ads"
  :poster="poster"
  :subtitles="subtitles"
  :title="title"
  :returnUrl="returnUrl"
  :nextVideo="nextVideo"
  :creditActions="creditActions"
  :contentId="contentId"
  :episodeId="episodeId"
  :trailerId="trailerId"
  :lastSeenTime='lastSeenTime'
  :skipRanges = 'skipRanges'
/>


</template>

<script lang="ts">
import Vue from "vue";
import VideoPlayer from "@/components/app-video-player/app-video-player.vue";
import { apiService } from "@/api";
import type {
  VodPlayerContentDto,
  VodPlayerContentPayload,
  VodPlayerTrailerPayload,
} from "@/core/models/vod-player.model";
import type {
  creditActions,
  nextVideoModel,
  skipRangeModel,
  sourceModel,
  subtitleModel,
} from "@/core/models/player.model";
import Loading from "@/components/loading/loading.vue";
import Error from "@/components/error/error.vue";

export default Vue.extend({
  name: "watch",
  components: { Error, Loading, VideoPlayer },
  data() {
    return {
      params: {} as VodPlayerContentPayload,
      sources: [] as Array<sourceModel>,
      subtitles: [] as Array<subtitleModel>,
      ads: [] as Array<any>,
      poster: "" as string,
      lastSeenTime: 0 as number,
      title: "" as string,
      skipRanges: [] as Array<skipRangeModel>,
      returnUrl: "" as string | null,
      nextVideo: {} as nextVideoModel,
      creditActions: [] as Array<creditActions>,
      contentId: 0 as number,
      episodeId: 0 as number,
      trailerId: 0 as number,
      loading: true as boolean,
      errorMessage: "" as string,
      errorStatus: 0 as number,
    };
  },
  async mounted(): Promise<void> {
    if (!this.$route.query) {
      this.initFunction();
    }
  },
  methods: {
    async initFunction() {
      this.loading = true;
      const { params, query } = this.$route;
      this.returnUrl = (query?.return_url as string) ?? null;

      if (!params?.id) {
        if (!query?.data) {
          this.errorMessage = "محتوا مورد نظر یافت نشد";
          this.errorStatus = 404;
          this.loading = false;
          return;
        }

        const data = this.decodePlayerOptions(query.data as string);
        this.updatePlayerData(data);
        return;
      }

      this.sources = [];
      this.contentId = +params.id;
      this.episodeId = +query?.episodeId;
      this.trailerId = +query?.trailerId;
      const paramsObj = {
        contentId: this.contentId.toString(),
        episodeId: this.episodeId ? this.episodeId?.toString() : null,
      };

      if (this.trailerId) {
        const payload: VodPlayerTrailerPayload = {
          ...paramsObj,
          trailerId: this.trailerId?.toString(),
        };
        const trailerData: VodPlayerContentDto = await apiService
          .getTrailer(payload)
          .then((res) => res.data)
          .catch((error) => {
            this.errorMessage = error.message;
            this.errorStatus = error.statusCode;
            this.loading = false;
          });

        this.updatePlayerData(trailerData);
      } else {
        const movieData: VodPlayerContentDto = await apiService
          .getMovie(paramsObj,this.$route.query.token)
          .then((res) => res.data)
          .catch((error) => {
            this.errorMessage = error.message;
            this.errorStatus = error.statusCode;
            this.loading = false;
          });
        this.updatePlayerData(movieData);
      }
    },
    decodePlayerOptions(data: string | null): VodPlayerContentDto {
      try {
        return JSON.parse(decodeURIComponent(atob(data as any) || ""));
      } catch (error) {
        this.errorMessage = "";
        this.errorStatus = 500;
        return {
          videos: [],
          subtitles: [],
          thumbnailUrl: "",
          ads: [],
          title: "",
          returnUrl: "",
          nextVideo: { id: "", title: "", thumbnailUrl: "" },
          credit: [],
          lastSeenTime: -1,
        };
      }
    },
    checkIfIsVideo(url: string): boolean {
      return (
        url.includes(".mp4") ||
        url.includes(".avi") ||
        url.includes(".mov") ||
        url.includes(".wmv") ||
        url.includes(".mkv")
      );
    },
    updatePlayerData(movieData: VodPlayerContentDto) {
 
      
      this.sources =
        movieData.videos?.map((video: any) => {
          if (/^https?:\/\//i.test(video.url))
            return {
              ...video,
              src: video.url,
              type: this.checkIfIsVideo(video.url)
                ? undefined
                : "application/x-mpegURL",
              url: undefined,
            };
        }) || [];
        this.skipRanges= movieData.skipRanges
        this.sources = [
  ...this.sources.filter(v => v.type === "application/x-mpegURL" ),
  ...this.sources.filter(v => v.type !== "application/x-mpegURL")
];
   
        
      this.subtitles =
        movieData.subtitles?.map((sub: any) => ({
          ...sub,
          src: sub.url,
          language: sub.language,
          url: undefined,
        })) || [];
      this.title = movieData.title;
      this.poster = movieData.thumbnailUrl || "";
      this.nextVideo = movieData.nextVideo || {};
      this.lastSeenTime = movieData.lastSeenTime
      this.creditActions = movieData.credit || [];
      this.ads =
        movieData.ads?.map((ad) => ({
          ...ad,
          videos:
            ad.videos?.map((video: any) => ({
              ...video,
              src: video.url,
              url: undefined,
            })) || [],
        })) || [];
      this.loading = false;
    },
  },
  watch: {
    "$route.query": {
      handler: function (query) {
        this.initFunction();
      },
      immediate: true,
    },
  },
  setup(){
    
  }
});
</script>

