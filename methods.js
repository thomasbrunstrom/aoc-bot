const axios = require("axios").default;
const GOAL = 3000;

let cache = { time: 0, data: null, stars: 0 };
let channelTopic =
  "AoC 2021: https://adventofcode.com | tretton37 leaderboard: https://1337co.de/15 | Join our private leaderboard with code: 641193-05404f1a https://app.happeo.com/channels/122683394/ActivitiesKnowledge/discussion/77542093";

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
    const fe = await axios.get("https://adventofcode.com/2021/leaderboard/private/view/641193.json", {
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
  const stars_per_day = stars / new Date().getDate();

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
  let text = `Good morning coders... This is the current stats!!!\n\nCurrent number of ⭐: ${cache?.stars}\n\n`;
  if (cache?.stars > GOAL) {
    text += `⭐ ahead of goal: ${cache?.stars}\n`;
    text += `that is about ${cache?.percent_done} percent so far`;
  } else {
    text += `⭐ needed to reach our goal of ${GOAL}: ${GOAL - cache?.stars}, let's gooooo! 🙌🥳\n`;
    text += `if we keep up at current pace with ${cache?.active_members} coders we'll end up with ${cache?.trajectory} stars by 25th December`;
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
  const currentTopic = await axios.get(`https://slack.com/api/conversations.info?channel=${process.env.channelId}`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.token}`,
    },
  });

  const topicStarsMatch = currentTopic.data.channel.topic.value.match(/\:star\:=([0-9]{0,4})\s{1}\|/m);

  if (topicStarsMatch && topicStarsMatch.length) {
    const topicStars = parseInt(topicStarsMatch[1]);
    if (topicStars != cache?.stars) {
      const topic = `⭐=${cache?.stars} | ${channelTopic}`;
      const topicChange = {
        channel: process.env.channelId,
        topic,
      };
      await axios.post("https://slack.com/api/conversations.setTopic", topicChange, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${process.env.token}`,
        },
      });
    }
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
