require("dotenv").config();
const fs = require("fs").promises;
const express = require("express");
const cors = require("cors");
const axios = require("axios").default;
const app = express();
const PORT = 5505;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

let cache = {time: 0, data: null};
let lastTimePostedDay = new Date(Date.now()).getDate();

let channelTopic = "AoC 2021: https://adventofcode.com | tretton37 leaderboard: https://1337co.de/15 | Join our private leaderboard with code: 641193-05404f1a https://app.happeo.com/channels/122683394/ActivitiesKnowledge/discussion/77542093 | ";

const buildCache = async () => {
  if (process.env.isDev || cache?.time < Date.now()) {
    try {
      cache = JSON.parse(await fs.readFile("cache.json"));
    } catch (error) {
      await fetchStars();
      await fs.writeFile("cache.json", JSON.stringify(cache));
    }
  } else {
    cache = await fetchStars();
  }
};

const fetchStars = async () => {
  if (cache?.time < Date.now()) {
    const fe = await axios.get("https://adventofcode.com/2021/leaderboard/private/view/641193.json", {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0",
        Cookie: `session=${process.env.session};`,
      },
      withCredentials: true,
    });
    const json = fe.data;
    const stars = Object.values(json.members).reduce((sum, {stars}) => sum + stars, 0);
    cache.data = json;
    cache.stars = stars;
    cache.time = Date.now() + 900000;
  }
};

const sendGoodMorning = async () => {
  if (!cache?.data?.length && cache?.time < Date.now()) {
    await buildCache();
  }

  let text = `Good morning coders... This is the current stats!!!\n\nCurrent number of 🌟: ${cache.stars}\n\n`;
  if (cache.stars > 3000) {
    text += `🌟 ahead of goal: ${cache.stars}\n`;
    text += `that is about ${Math.round((cache.stars / 3000) * 10000) / 100} percent so far`;
  } else {
    text += `🌟 behind of goal: ${3000 - cache.stars}, `;
  }

  text += `.\n\nAmazing 🙌🥳\nTodays challenge can be found here: https://adventofcode.com/2021/day/${new Date(Date.now()).getDate()}`;

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
  await updateTopic();
  return send;
};

const updateTopic = async () => {
  const topic = channelTopic + `🌟- count: ${cache?.stars}`;
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

setInterval(async () => {
  let now = new Date(Date.now());
  let nowDay = now.getDate();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (nowDay > lastTimePostedDay && hours == "5" && minutes == "55") {
    console.log("Posting update to channel");
    lastTimePostedDay = nowDay;
    await sendGoodMorning();
  }
}, 10000);

app.post("/", async (req, res) => {
  await buildCache();
  res.json({response_type: "in_channel", text: `We have ${cache.stars} stars at the moment.`});
});

app.get("/goodmorning", async (req, res) => {
  await sendGoodMorning();
  res.json("ok");
});
app.put("/topic", async (req, res) => {
  if (req.body?.topic) {
    channelTopic = req.body.topic;
    updateTopic();
    res.json("ok");
  } else {
    res.json({status: "nok", msg: "Missing topic"});
  }
});
app.listen(PORT, () => {
  console.log(`Server is now listening on ${PORT}`);
});
