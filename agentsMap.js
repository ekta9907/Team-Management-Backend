

const agents = new Map();           // tenantId -> Set(userId)
const agentSockets = new Map();     // tenantId:userId -> socketId
const viewersForAgent = new Map();  // tenantId:userId -> Set(viewerSocketId)
console.log(agents, agentSockets, viewersForAgent)
module.exports = { agents, agentSockets, viewersForAgent };