const routes = require("express").Router();
const { updateTopic, sendGoodMorning, getStars } = require("./methods");

routes.post("/", async (req, res) => {
  const stars = await getStars();
  res.json({
    response_type: "in_channel",
    text: `We have ${stars} stars at the moment.`,
  });
});

routes.get("/goodmorning", async (req, res) => {
  await sendGoodMorning();
  res.json("ok");
});

routes.put("/topic", async (req, res) => {
  if (req.body?.topic) {
    updateTopic(req.body?.topic);
    res.json("ok");
  } else {
    res.json({ status: "nok", msg: "Missing topic" });
  }
});

module.exports = routes;
