import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
import { sendGoodMorning, updateTopic } from "./methods";
import routes from "./routes";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5505;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

cron.schedule("55 5 * * *", async () => {
  await sendGoodMorning();
});

cron.schedule("0 8,12,18 * * *", async () => {
  await updateTopic();
});

app.use("/", routes);
app.listen(PORT, () => {
  console.log(`Server is now listening on ${PORT}`);
});
