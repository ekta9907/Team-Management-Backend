const { Server } = require("socket.io");

const agentSocket = require("./agent.socket");
const viewerSocket = require("./viewer.socket");
const webrtcSocket = require("./webrtc.socket");

module.exports = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    agentSocket(io, socket);
    viewerSocket(io, socket);
    webrtcSocket(io, socket);
  });
};
