import type {SubtitleLabels, LogEvents} from "@/core/enums/player.enum";

export interface subtitleModel {
    src: string,
    kind: 'subtitles' | 'captions' | 'chapters' | 'descriptions' | 'metadata',
    srclang: string,
    label: SubtitleLabels
}

export interface adsModel {
    id: number,
    videos: [
        {
            src: string;
        }
    ],
    clickLink: string,
    thumbnailUrl: string,
    showSkipAdSecond: number,
}

export interface sourceModel {
    src: string,
    type?: string,
    label?: string,
    selected?: boolean
}

export interface PlayerOptionsModel {
    sources: Array<sourceModel>;
    subtitles?: Array<subtitleModel>;
    ads?: Array<adsModel>;
    poster?: string;
    lastSeenTime?: number;
    title?: string;
    returnUrl?: string;
    nextVideo: nextVideoModel;
    creditActions: Array<creditActions>;
}

export interface creditActions {
    actionType: "SKIP" | "NEXT_ITEM",
    startTime: number,
    endTime: number,
    title: string
}

export interface nextVideoModel {
    id: string,
    thumbnailUrl: string,
    title: string
}

export interface skipRangeModel {
    end: number,
    start: number,
    title: string
}

export interface QualityModel {
    src: string,
    label: string,
    height: number,
}

export interface EventLog {
    date: number,
    events: {
        date: number,
        event: LogEvents,
        eventMeta: string
    }[],
    feature: 'player',
    featureMeta: string
}

export interface AdOptionsModel {
    skipOffset: number,
    id: number,
    clickLink: string,
    poster: string,
}
