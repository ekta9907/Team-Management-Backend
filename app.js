require("dotenv").config();
const express = require("express");

const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const app = express();
const server = http.createServer(app);

  require("./socket")(server);

// 👇 ADD THIS LINE
// require("./sockets")(server);

app.use(cookieParser());

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

require("./src/configs/maindbConfig");
require("./src/cron/projectAutoDelete.cron");
const routes = require("./src/routes");
const punchRoutes = require("./src/routes/hrRoutes/routePunch");

app.set("views", path.join(__dirname, "test", "view"));
app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use("/server", routes);
app.use("/iclock", punchRoutes);



app.get("/", async (req, res) => {
  return res.status(200).json({ success: true, test: "working with domain url" });
});

app.get("/test", async (req, res) => {
  console.log("test");
  try {
    return res.status(200).json({ success: true, test: "working with test url" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
});



const PORT = process.env.PORT || 3001;
// const HOSTNAME = process.env.HOSTNAME || "localhost";
const HOSTNAME =  "0.0.0.0";


server.listen(PORT, HOSTNAME, () => {
  console.log(`Server + Socket running at http://${HOSTNAME}:${PORT}`);
});

// app.listen(PORT, HOSTNAME, () => {
//   console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
// });
