const agents = new Map();

module.exports = (io, socket) => {
  socket.on("viewer-join", ({ userId }) => {
    const agentSocketId = agents.get(userId);

    if (agentSocketId) {
      io.to(agentSocketId).emit("start-stream", {
        viewerSocketId: socket.id
      });
    } else {
      socket.emit("error", { message: "Agent offline" });
    }
  });
};
