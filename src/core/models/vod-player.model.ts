import type { SubtitleLabels } from "../enums/player.enum";
import type { adsModel, creditActions, nextVideoModel, skipRangeModel } from "./player.model";

export interface VodPlayerContentPayload {
    contentId: string | null;
    episodeId: string | null;
}

export interface VodPlayerTrailerPayload extends VodPlayerContentPayload {
    trailerId: string | null;
}


export interface VodPlayerContentDto {
    videos: Array<SourceDto>;
    title: string;
    thumbnailUrl: string;
    subtitles: Array<SubtitlDto>;
    ads: Array<any>;
    lastSeenTime: number;
    nextVideo: nextVideoModel;
    credit: Array<creditActions>;
    returnUrl: string;
    skipRanges:Array<skipRangeModel>
}

// export interface AdsDto extends adsModel {
//     videos: [
//         {
//             url: string;
//         }
//     ],
// }
export interface SubtitlDto {
    url: string;
    language: SubtitleLabels;
}

export interface SourceDto {
    url: string;
}
