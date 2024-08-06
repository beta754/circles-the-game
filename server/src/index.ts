import express from "express"
import * as http from "http"
import { Server } from "socket.io"
import { Game } from "./Game";
import { Actions, Events } from "./Game.types";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ["websocket"],
  cors: {
    origin: "*"
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

const game = new Game()
game.start();

game.on("event", (args) => {
  sockets.emit("event", args);
});

const UnsafeActions = new Set<Actions[keyof Actions]["__type"]>([
  "AddCircle",
  "RemoveCircle"
])

const sockets = io.on('connection', (socket) => {
  game.events.forEach(e => socket.emit("event", e));
  game.circles.forEach(circle => socket.emit("event", {
    __type: "CircleMoved",

    id: circle.id,
    x: circle.x,
    y: circle.y
  } as Events["CircleMoved"]))

  console.info(`100|SocketConnected|id#${socket.id}`);
  if (!game.circles.has(socket.id)) {
    game.dispatch(socket.id, {
      __type: "AddCircle"
    })
  }

  function handler(args: Actions[keyof Actions]) {
    if (UnsafeActions.has(args.__type)) {
      return
    }

    game.dispatch(socket.id, args);
  }
  socket.on("dispatch", handler)

  socket.once("disconnect", () => {
    console.info(`100|SocketDisconnected|id#${socket.id}`);

    game.dispatch(socket.id, {
      __type: "RemoveCircle"
    })

    socket.off("dispatch", handler)
  })
});

server.listen(5000, () => {
  console.log('listening on *:5000');
});
