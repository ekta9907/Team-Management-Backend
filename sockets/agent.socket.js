const agents = new Map();

module.exports = (io, socket) => {
  socket.on("register-agent", ({ userId }) => {
    if (!userId) return;

    agents.set(userId, socket.id);
    io.emit("agents-online", Array.from(agents.keys()));
  });

  socket.on("disconnect", () => {
    for (const [id, sid] of agents.entries()) {
      if (sid === socket.id) agents.delete(id);
    }
  });
};
