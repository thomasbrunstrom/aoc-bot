const { get, post } = require("axios");
const GOAL = 3000;

const LEADERBOARD_URL = "https://adventofcode.com/2022/leaderboard/private/view/641193.json";
const POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
const CHANNEL_INFO_URL = `https://slack.com/api/conversations.info?channel=${process.env.channelId}`;
const SET_TOPIC_URL = "https://slack.com/api/conversations.setTopic";
const CHANNEL_HISTORY_URL = `https://slack.com/api/conversations.history?channel=${process.env.channelId}`;
const DELETE_MESSAGE_URL = "https://slack.com/api/chat.delete";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  Authorization: `Bearer ${process.env.token}`,
};

const privateLeaderboardCode = process.env.privateLeaderboardCode;
let cache = { time: 0, data: null, stars: 0 };
let channelTopic =
  `:snowflake: AoC 2022: https://adventofcode.com :snowflake: 13|37 leaderboard: https://1337co.de/15 | Join our private leaderboard with code: ${privateLeaderboardCode} :snowflake: more info coming!`;

const buildCache = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    await fetchStars();
  }
  return cache;
};

const getStars = async () => {
  await buildCache();
  return await cache.stars;
};

const fetchStars = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    const fe = await get(LEADERBOARD_URL, {
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

const rebuildCache = (json) => {
  json = json || cache.data;

  const members = Object.values(json.members);
  const active_members = members.filter((m) => m.stars > 0);
  const stars = members.reduce((sum, { stars }) => sum + stars, 0);
  const stars_per_active_member = stars / active_members.length;
  const stars_per_day = stars / (new Date().getDate() - 1); // -1 as good morning message happens as new day is active

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

const sendGoodMorning = async () => {
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
  text += `\n\n<https://adventofcode.com/2022/day/${day}|[Today's puzzle]>`;
  text += `\n\nLet's continue in a thread! 🎄`;

  const msg = {
    channel: process.env.channelId,
    text,
  };

  const send = await post(POST_MESSAGE_URL, msg, { headers });

  // Add a message to start a discussion thread about today's puzzle
  const threadMsg = {
    channel: process.env.channelId,
    thread_ts: send.data.ts,
    text: `*What was your thoughts on day ${day}?*`,
  }

  await post(POST_MESSAGE_URL, threadMsg, { headers });
  return send;
};

const updateTopic = async (newTopic) => {
  channelTopic = newTopic || channelTopic;
  await buildCache();
  const currentTopic = await get(CHANNEL_INFO_URL, { headers });

  const topicStarsMatch = currentTopic.data.channel.topic.value.match(/\:star\:=([0-9]{0,4})\s{1}\|/m);

  if (topicStarsMatch && topicStarsMatch.length) {
    const topicStars = parseInt(topicStarsMatch[1]);
    if (topicStars !== cache?.stars) {
      const topic = `⭐=${cache?.stars} | ${channelTopic}`;
      const topicChange = {
        channel: process.env.channelId,
        topic,
      };
      await post(SET_TOPIC_URL, topicChange, { headers });

      await deleteLatestTopicUpdate();
    }
  }
};

const deleteLatestTopicUpdate = async () => {
  const res = await get(CHANNEL_HISTORY_URL, { headers });

  if (res.data.ok) {
    const messageToDelete = res.data.messages.find((mes) => mes.subtype === "channel_topic");

    const payload = {
      channel: process.env.channelId,
      ts: messageToDelete?.ts
    }

    await post(DELETE_MESSAGE_URL, payload, { headers });
  }
};

module.exports = {
  sendGoodMorning,
  fetchStars,
  buildCache,
  updateTopic,
  getStars,
  rebuildCache,
};
