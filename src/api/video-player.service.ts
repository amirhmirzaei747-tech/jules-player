import type {
  VodPlayerContentPayload,
  VodPlayerTrailerPayload,
} from "@/core/models/vod-player.model";
import { http } from "@/core/utilities/axios";
import type { EventLog } from "@/core/models/player.model";
import { EncryptAES } from "@/core/utilities/crypto";

const controller: string = "v1/user/vod/content";

const logController: string = (import.meta as any).env.VITE_LOG_URL;

export const getMovie = (
  params: VodPlayerContentPayload,
  token: string | (string | null)[]
) => {
  return http.getByParams(`${controller}/player`, params, null, {
    headers: {
      "Authorization": token,
      'from-browser':true,
      'Content-type': 'application/json',
    },
  });
};

export const getTrailer = (params: VodPlayerTrailerPayload) => {
  return http.getByParams(`${controller}/trailer`, params);
};

export const submitLog = (
  params: EventLog,
  token: string | (string | null)[]
) => {
  const data: string = EncryptAES({ logs: [params] });

  return http.post(`${logController}log-collector`, { data: data }, null, {
    headers: { Platform: "web", Authorization: token, 'from-browser':true },
  });
};
