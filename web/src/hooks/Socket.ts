import { io, Socket } from "socket.io-client"
import { Actions, Events } from "./Socket.types";

export const socket = io("ws://localhost:5000", {
  transports: ["websocket"]
})
export function dispatch<TKey extends Actions[keyof Actions]["__type"]>(action: Extract<Actions[keyof Actions], { __type: TKey }>) {
  socket.emit("dispatch", action);
}

export function subscribe(handler: (event: Events[keyof Events]) => void) {
  socket.on("event", handler);

  return () => {
    socket.off("event", handler)
  }
}

export function useServer() {
  return [dispatch, subscribe, socket] as [typeof dispatch, typeof subscribe, typeof socket]
}

