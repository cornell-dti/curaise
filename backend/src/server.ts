import express from "express";
import cors from "cors";
import router from "./router";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.path === "/api/email/parse") {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});
app.use(router);

app.listen(process.env.PORT, () => {
  console.log(`Running on port ${process.env.PORT}`);
});
