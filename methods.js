const axios = require("axios").default;

let cache = { time: 0, data: null, stars: 0 };
let channelTopic =
  "AoC 2021: https://adventofcode.com | tretton37 leaderboard: https://1337co.de/15 | Join our private leaderboard with code: 641193-05404f1a https://app.happeo.com/channels/122683394/ActivitiesKnowledge/discussion/77542093";

const buildCache = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    await fetchStars();
    return cache;
  }
};

const getStars = async () => {
  await buildCache();
  return await cache.stars;
};

const fetchStars = async () => {
  if (!cache.data || cache?.time < Date.now()) {
    const fe = await axios.get("https://adventofcode.com/2021/leaderboard/private/view/641193.json", {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
        Cookie: `session=${process.env.session};`,
      },
      withCredentials: true,
    });

    const json = fe.data;
    const stars = Object.values(json.members).reduce((sum, { stars }) => sum + stars, 0);
    cache.data = json;
    cache.stars = stars;
    cache.time = Date.now() + 900000;
  }
};

const sendGoodMorning = async () => {
  await buildCache();
  let text = `Good morning coders... This is the current stats!!!\n\nCurrent number of ⭐: ${cache?.stars}\n\n`;
  if (cache?.stars > 3000) {
    text += `⭐ ahead of goal: ${cache?.stars}\n`;
    text += `that is about ${Math.round((cache?.stars / 3000) * 10000) / 100} percent so far`;
  } else {
    text += `⭐ behind of goal: ${3000 - cache?.stars}, let's gooooo! 🙌🥳`;
  }
  text += `\nTodays challenge can be found here: https://adventofcode.com/2021/day/${new Date(Date.now()).getDate()}`;

  const msg = {
    channel: process.env.channelId,
    text,
  };

  const send = await axios.post("https://slack.com/api/chat.postMessage", msg, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.token}`,
    },
  });
  return send;
};

const updateTopic = async (newTopic) => {
  channelTopic = newTopic || channelTopic;
  await buildCache();
  const topic = `⭐=${cache?.stars} | ${channelTopic}`;
  const topicChange = {
    channel: process.env.channelId,
    topic,
  };

  const send2 = await axios.post("https://slack.com/api/conversations.setTopic", topicChange, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.token}`,
    },
  });
};

module.exports = {
  sendGoodMorning,
  fetchStars,
  buildCache,
  updateTopic,
  getStars,
};
