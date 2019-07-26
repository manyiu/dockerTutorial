const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const redis = require("redis");
const { promisify } = require("util");

const { env: { ENVIRONMENT = "DEVELOPMENT" } = {} } = process;

if (ENVIRONMENT === "PRODUCTION") {
  require("dotenv").config({
    path: path.resolve(process.cwd(), ".env.production")
  });
} else {
  require("dotenv").config({
    path: path.resolve(process.cwd(), ".env.development")
  });
}

const {
  env: {
    ALLOWED_HOST = "http://localhost:80",
    PORT = 3001,
    MONGO_HOST = "localhost",
    MONGO_PORT = 27017,
    REDIS_HOST = "localhost",
    REDIS_PORT = 6379
  } = {}
} = process;

mongoose.connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/vgt`, {
  useNewUrlParser: true
});

const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  retry_strategy: () => 1000
});
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const corsOptions = {
  origin: ALLOWED_HOST,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Content-Length",
    "X-Requested-With",
    "Accept"
  ],
  methods: ["GET", "PATCH", "POST", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200
};

const getTime = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const todayString = `${yyyy}-${mm}-${dd}`;
  const offTime = new Date(today.getTime() + 1000 * 60 * 60 * 9);

  return [offTime, todayString];
};

const app = express();

client.on("error", function(err) {
  console.log("Redis error:", err);
});

var dateSchema = new mongoose.Schema({
  date: String,
  time: String
});
var DateModel = mongoose.model("Date", dateSchema);

app.use(cors(corsOptions));

app.get("/", async (req, res) => {
  const [time, today] = getTime();

  const redisValue = await getAsync(today);

  if (redisValue) {
    console.log("Found value in Redis");
    
    return res.send({
      today,
      value: redisValue
    });
  } else {
    const mongoEntry = await DateModel.findOne({ date: today });

    if (mongoEntry && mongoEntry.time) {
      console.log("Found value in Mongodb");

      const mongoValue = mongoEntry.time;

      await setAsync(today, mongoValue);

      return res.send({
        today,
        value: mongoValue
      });
    } else {
      console.log("New value");

      const offTime = new DateModel({ date: today, time });

      await offTime.save();

      await setAsync(today, time);

      return res.send({
        today,
        value: time
      });
    }
  }
});

app.listen(PORT, err => {
  if (err) {
    console.log("Listen error:", err);
  }

  console.log(`API running on port ${PORT}`);
});
