import express from "express";
import cors from "cors";
import router from "./router";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // Mailgun form posts
app.use((req, res, next) => {
  if (req.originalUrl === "/api/email/parse") {
    console.log("=== Incoming Mailgun POST ===");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Keys:", Object.keys(req.body));
    console.log(
      "Body Preview:",
      JSON.stringify(req.body, null, 2).slice(0, 1000)
    );
    console.log("=============================");
  }
  next();
});
app.use(router);

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});
