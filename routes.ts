import express, { Request, Response } from "express";
import { getStars, sendGoodMorning, updateTopic } from "./methods";

const routes = express.Router();

routes.get("/", async (req: Request, res: Response) => {
  res.send(`Please, sir, I want some more ginger bread.`).end();
});

routes.post("/", async (req: Request, res: Response) => {
  const stars = await getStars();
  res.json({
    response_type: "in_channel",
    text: `We have ${stars} stars at the moment.`,
  });
});

routes.get("/goodmorning", async (req: Request, res: Response) => {
  await sendGoodMorning();
  res.json("ok");
});

routes.put("/topic", async (req: Request, res: Response) => {
  if (req.body?.topic) {
    updateTopic(req.body?.topic);
    res.json("ok");
  } else {
    res.json({ status: "nok", msg: "Missing topic" });
  }
});

export default routes;
