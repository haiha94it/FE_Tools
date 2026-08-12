import axios from "axios";
import { getProxyAgent } from "@/lib/proxy-helper";

/**
 * Proxy Zalo comments/list — filter + cursor load-more:
 *   orderBy, status, ads
 *   prevCmtId, prevVidId, lastIndex  (trang sau)
 * @example first:  orderBy=1&status=0&ads=0
 * @example next:   + prevCmtId & prevVidId & lastIndex
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      clientCookie,
      proxy,
      orderBy = 1,
      status = 0,
      ads = 0,
      prevCmtId,
      prevVidId,
      lastIndex,
    } = body ?? {};

    const agentOptions = getProxyAgent(proxy);

    const params = {
      orderBy: Number(orderBy) === 2 ? 2 : 1,
      status: Number(status) === 1 ? 1 : 0,
      ads: Number(ads) === 1 ? 1 : 0,
    };

    if (prevCmtId != null && prevCmtId !== "") {
      params.prevCmtId = String(prevCmtId);
    }
    if (prevVidId != null && prevVidId !== "") {
      params.prevVidId = String(prevVidId);
    }
    if (
      lastIndex != null &&
      lastIndex !== "" &&
      !Number.isNaN(Number(lastIndex))
    ) {
      params.lastIndex = Number(lastIndex);
    }

    const response = await axios.get(
      "https://video.zalo.me/v2/public-api/comments/list",
      {
        params,
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language":
            "en-GB-oxendict,en;q=0.9,fr;q=0.8,vi;q=0.7,fr-FR;q=0.6,en-US;q=0.5,en-GB;q=0.4",
          "cache-control": "no-cache",
          dnt: "1",
          pragma: "no-cache",
          priority: "u=1, i",
          referer: "https://video.zalo.me/creator/binh-luan",
          "sec-ch-ua":
            '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
          Cookie: `webSession=${clientCookie}`,
        },
        ...agentOptions,
      },
    );

    const raw = response.data?.data;
    let comments = [];
    if (Array.isArray(raw)) {
      comments = raw;
    } else if (raw && typeof raw === "object") {
      if (Array.isArray(raw.list)) comments = raw.list;
      else if (Array.isArray(raw.comments)) comments = raw.comments;
      else if (Array.isArray(raw.data)) comments = raw.data;
    }

    const batchLen = comments.length;
    const prevIndex =
      lastIndex != null &&
      lastIndex !== "" &&
      !Number.isNaN(Number(lastIndex))
        ? Number(lastIndex)
        : 0;
    const nextLastIndex = prevIndex + batchLen;

    const last = batchLen > 0 ? comments[batchLen - 1] : null;
    const nextPrevCmtId = last?.id != null ? String(last.id) : null;
    const nextPrevVidId =
      last?.video?.id != null
        ? String(last.video.id)
        : last?.videoId != null
          ? String(last.videoId)
          : null;

    const hasMore = batchLen > 0;
    const nextCursor =
      hasMore && nextPrevCmtId
        ? {
            prevCmtId: nextPrevCmtId,
            prevVidId: nextPrevVidId,
            lastIndex: nextLastIndex,
          }
        : null;

    return new Response(
      JSON.stringify({
        count: batchLen,
        results: comments,
        hasMore: Boolean(nextCursor),
        nextCursor,
        filters: {
          orderBy: params.orderBy,
          status: params.status,
          ads: params.ads,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching comments:", error.message);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch comments",
        details: error.message,
        zalo: error?.response?.data ?? null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
