import axios from "axios";
const GOAL = 1477;

interface CompletionDayLevel {}
interface IMemberInfo {
  id: number;
  local_score: number;
  name: string;
  global_score: number;
  last_star_ts: number;
  completion_day_level: CompletionDayLevel;
  stars: number;
}

interface ILeaderBoard {
  owner_id: number;
  event: string;
  members: Record<string, IMemberInfo>;
}

interface ICache {
  time: number;
  data: ILeaderBoard | null;
  stars: number;
  members?: number;
  active_members?: number;
  stars_per_active_member?: string;
  stars_per_day?: string;
  trajectory?: string;
  percent_done?: string;
}

interface SlackMessage {
  type: string;
  subtype?: string;
  ts: string;
}

interface ISlackResponse {
  ok: boolean;
  messages: SlackMessage[];
}

export interface ISlackTopic {
  ok: boolean;
  channel: Channel;
}
export interface Channel {
  id: string;
  name: string;
  topic: Purpose;
}

export interface Purpose {
  value: string;
  creator: string;
  last_set: number;
}

const LEADERBOARD_URL = "https://adventofcode.com/2023/leaderboard/private/view/641193.json";
const POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
const CHANNEL_INFO_URL = `https://slack.com/api/conversations.info?channel=${process.env.channelId}`;
const SET_TOPIC_URL = "https://slack.com/api/conversations.setTopic";
const CHANNEL_HISTORY_URL = `https://slack.com/api/conversations.history?channel=${process.env.channelId}`;
const DELETE_MESSAGE_URL = "https://slack.com/api/chat.delete";

const getHeaders = () => {
  return {
    "Content-Type": "application/json; charset=utf-8",
    Authorization: `Bearer ${process.env.token}`,
  };
};

const privateLeaderboardCode = process.env.privateLeaderboardCode;
const sponsorJoinCode = process.env.sponsorJoinCode;
const cache: ICache = { time: 0, data: null, stars: 0 };
let channelTopic = `:snowflake: AoC 2023: https://adventofcode.com :snowflake: tretton37 leaderboard: coming soon | Join our private leaderboard with code: ${privateLeaderboardCode} :snowflake: Sponsor join code ${sponsorJoinCode} (internal use only)!:shushing_face:`;

const buildCache = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    await fetchStars();
  }
  return cache;
};

export const getStars = async () => {
  await buildCache();
  return cache.stars;
};

export const fetchStars = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    const fe = await axios.get<ILeaderBoard>(LEADERBOARD_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
        Cookie: `session=${process.env.session};`,
      },
      withCredentials: true,
    });

    const json = fe.data;
    rebuildCache(json);
  }
};

export const rebuildCache = (json: ILeaderBoard) => {
  json = json || cache.data;

  const members = Object.values(json.members);
  const active_members = members.filter((m) => m.stars > 0);
  const stars = members.reduce((sum, { stars }) => sum + stars, 0);
  const stars_per_active_member = stars / active_members.length;
  const currentDay = new Date().getDate() - 1; // -1 as good morning message happens as new day is active
  const stars_per_day = stars / (currentDay > 0 ? currentDay : 1); //Make sure we don't divide by 0.. (machine goes burr hurr durr)

  cache.data = json;
  cache.members = members.length;
  cache.active_members = active_members.length;
  cache.stars = stars;
  cache.time = Date.now() + 900000;
  cache.stars_per_active_member = stars_per_active_member.toFixed(2);
  cache.stars_per_day = stars_per_day.toFixed(2);
  cache.trajectory = (25 * stars_per_day).toFixed(0);
  cache.percent_done = ((stars / GOAL) * 100).toFixed(2);
  return cache;
};

export const sendGoodMorning = async () => {
  await buildCache();
  const day = new Date(Date.now()).getDate();
  let text = `*Good morning coders!* \n\n*Current number of ⭐: ${cache?.stars}*\n\n`;

  if (cache?.stars > GOAL) {
    text += `⭐ ahead of goal: ${cache?.stars}\n`;
    text += `that is about ${cache?.percent_done} percent so far`;
  } else {
    text += `We need _${GOAL - cache?.stars}_ ⭐ to reach our goal of *${GOAL}* so let's gooooo! 🙌🥳\n\n`;
    text += `If we keep up at current pace with ${cache?.active_members} coders we'll end up with ${cache?.trajectory} stars by 25th December`;
  }
  text += `\n\n<https://adventofcode.com/2023/day/${day}|[Today's puzzle]>`;
  text += `\n\nLet's continue in a thread! 🎄`;

  const msg = {
    channel: process.env.channelId,
    text,
  };
  const headers = getHeaders();
  const send = await axios.post(POST_MESSAGE_URL, msg, { headers });
  // Add a message to start a discussion thread about today's puzzle
  const threadMsg = {
    channel: process.env.channelId,
    thread_ts: send.data.ts,
    text: `*What was your thoughts on day ${day}?*`,
  };

  await axios.post(POST_MESSAGE_URL, threadMsg, { headers });
  return send;
};

export const updateTopic = async (newTopic = undefined) => {
  const headers = getHeaders();
  channelTopic = newTopic || channelTopic;
  await buildCache();
  const currentTopic = await axios.get<ISlackTopic>(CHANNEL_INFO_URL, { headers });
  const topicStarsMatch = currentTopic.data?.channel?.topic?.value?.match(/:star:=([0-9]{0,4})\s{1}\|/m);

  if (topicStarsMatch && topicStarsMatch.length) {
    const topicStars = parseInt(topicStarsMatch[1]);
    if (topicStars !== cache?.stars) {
      const topic = `:star:=${cache?.stars} | ${channelTopic}`;
      const topicChange = {
        channel: process.env.channelId,
        topic,
      };

      await axios.post(SET_TOPIC_URL, topicChange, { headers });
      await deleteLatestTopicUpdate();
    }
  }
};

const deleteLatestTopicUpdate = async () => {
  const headers = getHeaders();
  const res = await axios.get<ISlackResponse>(CHANNEL_HISTORY_URL, { headers });

  if (res.data.ok) {
    const messageToDelete = res.data.messages.find((mes) => mes.subtype === "channel_topic");

    const payload = {
      channel: process.env.channelId,
      ts: messageToDelete?.ts,
    };

    await axios.post(DELETE_MESSAGE_URL, payload, { headers });
  }
};
