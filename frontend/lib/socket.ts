import { io } from "socket.io-client"

// Initialize socket connection
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000"

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// Set up event listeners
socket.on("connect", () => {
  console.log("Socket connected:", socket.id)

  // Authenticate socket with user info if available
  const token = localStorage.getItem("authToken")
  const userName = localStorage.getItem("userName")
  const userEmail = localStorage.getItem("userEmail")

  if (token && userEmail) {
    socket.emit("authenticate", { token, userName, userEmail })
  }
})

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error)
})

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason)
})

// Export socket instance
export default socket

