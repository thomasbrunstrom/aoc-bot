require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios").default;
const app = express();
const PORT = 5505;

const cache = {time: 0, data: null};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.post("/", async (req, res) => {
  if (cache.time < Date.now() + 900 || cache.data == null) {
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
    cache.time = Date.now() + 15 * 60 * 1000;
  }
  if (req?.body.text) {
    console.log(text);
  }
  res.json({response_type: "in_channel", text: `We have ${cache.stars} stars at the moment.`});
});

app.listen(PORT, () => {
  console.log(`Server is now listening on ${PORT}`);
});
