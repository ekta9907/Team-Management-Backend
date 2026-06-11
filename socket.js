const { Server } = require("socket.io");
const { agents, agentSockets, viewersForAgent } = require("./agentsMap");

module.exports = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    console.log("🔥 SOCKET CONNECT HIT");
    console.log("socket.id =", socket.id);
    console.log("handshake.auth =", socket.handshake.auth);

    const { tenantId, userId, role } = socket.handshake.auth;

    if (!tenantId || !userId || !role) {
      console.log("❌ Missing auth fields");
      return socket.disconnect(true);
    }

    socket.tenantId = tenantId;
    socket.userId = userId;
    socket.role = role;

    console.log(`✅ Connected ${role}: ${userId} | tenant: ${tenantId}`);

    socket.join(tenantId);

    /* ======================= AGENT REGISTER ======================= */
    if (role === "agent") {
      if (!agents.has(tenantId)) agents.set(tenantId, new Set());
      agents.get(tenantId).add(userId);

      const key = `${tenantId}:${userId}`;
      agentSockets.set(key, socket.id);

      io.to(tenantId).emit("agents-online", Array.from(agents.get(tenantId)));
    }

    /* ======================= VIEWER JOIN ======================= */
    socket.on("viewer-join", ({ agentId }) => {
      if (role !== "viewer") return;

      const agentKey = `${tenantId}:${agentId}`;

      if (!viewersForAgent.has(agentKey))
        viewersForAgent.set(agentKey, new Set());

      viewersForAgent.get(agentKey).add(socket.id);

      const agentSocketId = agentSockets.get(agentKey);

      if (!agentSocketId) {
        return socket.emit("error", { message: "Agent not online" });
      }

      io.to(agentSocketId).emit("start-stream", {
        agentId,
        viewerSocketId: socket.id
      });
    });

    /* ======================= STOP STREAM ======================= */
    socket.on("stop-stream", ({ agentId }) => {
      if (role !== "viewer") return;

      const agentKey = `${tenantId}:${agentId}`;
      const agentSocketId = agentSockets.get(agentKey);

      if (agentSocketId) {
        io.to(agentSocketId).emit("stop-stream", {
          viewerSocketId: socket.id
        });
      }

      viewersForAgent.get(agentKey)?.delete(socket.id);
    });

    /* ======================= FRAME FORWARD ======================= */
    socket.on("screen-frame", ({ agentId, frame, viewerSocketId }) => {
      if (role !== "agent") return;

      if (io.sockets.sockets.get(viewerSocketId)) {
        io.to(viewerSocketId).emit("screen-frame", { agentId, frame });
      }
    });

    /* ======================= DISCONNECT ======================= */
    socket.on("disconnect", () => {
      console.log(`❌ Disconnected ${role}: ${userId}`);

      if (role === "agent") {
        agents.get(tenantId)?.delete(userId);
        agentSockets.delete(`${tenantId}:${userId}`);
        viewersForAgent.delete(`${tenantId}:${userId}`);

        io.to(tenantId).emit(
          "agents-online",
          Array.from(agents.get(tenantId) || [])
        );
      }

      if (role === "viewer") {
        for (const set of viewersForAgent.values()) {
          set.delete(socket.id);
        }
      }
    });
  });
};
