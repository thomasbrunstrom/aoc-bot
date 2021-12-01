const routes = require("express").Router();
const { buildCache, updateTopic, sendGoodMorning } = require("./methods");

routes.post("/", async (req, res) => {
  await buildCache();
  res.json({
    response_type: "in_channel",
    text: `We have ${cache?.stars} stars at the moment.`,
  });
});

routes.get("/goodmorning", async (req, res) => {
  await sendGoodMorning();
  res.json("ok");
});

routes.put("/topic", async (req, res) => {
  if (req.body?.topic) {
    channelTopic = req.body.topic;
    updateTopic();
    res.json("ok");
  } else {
    res.json({ status: "nok", msg: "Missing topic" });
  }
});

module.exports = routes;
