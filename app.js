require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const PORT = 5505;
const routes = require("./routes");
const { sendGoodMorning, updateTopic } = require("./methods");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

cron.schedule("55 5 * * *", async () => {
  await sendGoodMorning();
});

cron.schedule("0 * * * *", async () => {
  await updateTopic();
});

app.use("/", routes);
app.listen(PORT, () => {
  console.log(`Server is now listening on ${PORT}`);
});
