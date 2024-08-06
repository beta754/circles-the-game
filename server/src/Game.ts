import EventEmitter from "events";
import { v4 } from "uuid";
import { Actions, Events } from "./Game.types";
import { clamp } from "./Math";

function randomColor() {
  const r = Math.floor(Math.random() * 255)
  const g = Math.floor(Math.random() * 255)
  const b = Math.floor(Math.random() * 255)

  return parseInt(`0x${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`, 16)
}

export class Circle {
  x = Math.floor(Math.random() * 250);
  y = Math.floor(Math.random() * 250);
  radius = 10;

  vx = 0;
  vy = 0;

  color = randomColor()

  constructor(readonly id: string) { }
}

export class Projectile {

  width = 2;
  height = 2;
  color = randomColor()

  vx: number
  vy: number

  constructor(
    readonly id: string,
    readonly createdBy: string,
    public x: number,
    public y: number,
    public direction: number,
    public speed: number
  ) {
    this.vx = Math.cos(direction) * speed
    this.vy = Math.sin(direction) * speed
  }
}

export class Game extends EventEmitter {
  actions = Array.of<any>();
  events = Array.of<any>();

  circles = new Map<string, Circle>()
  projectiles = new Map<string, Projectile>();

  started = false;

  projectileSpeed = 100;
  circleSpeed = 65;

  maxX = 100000;
  maxY = 100000;

  push<TKey extends Events[keyof Events]["__type"]>(event: Extract<Events[keyof Events], { __type: TKey }>) {
    this.events.push(event)
    this.emit("event", event)
  }

  async start() {
    if (this.started) {
      return
    }
    this.started = true;

    let next = Date.now();
    while (this.started) {
      const last = next;
      next = Date.now();
      const delta = next - last;

      const circles = [...this.circles.values()]

      const step = delta / 1000
      circles.forEach(circle => {
        if (circle.vx === 0 && circle.vy === 0) {
          return;
        }

        const lastVx = circle.vx
        const lastVy = circle.vy

        const collidesWith = circles.find(other => {
          if (other.id === circle.id) {
            return false
          }

          // √[(x₂ - x₁)² + (y₂ - y₁)²]
          const distance = Math.sqrt((other.x - circle.x) ** 2 + (other.y - circle.y) ** 2)
          return distance <= 20;
        })

        if (collidesWith) {
          circle.vx = collidesWith.x > circle.x ? -1
            : 1
          circle.vy = collidesWith.y > circle.y ? -1
            : 1
        }

        const nextX = circle.x + circle.vx * step
        const nextY = circle.y + circle.vy * step
        circle.x = clamp(nextX, 10, this.maxX - 10);
        circle.y = clamp(nextY, 10, this.maxY - 10);
        if (nextX !== circle.x || nextY !== circle.y) {
          circle.vx = nextX > circle.x ? -1
            : 1
          circle.vy = nextY > circle.y ? -1
            : 1;
        }

        if (lastVx !== circle.vx || lastVy !== circle.vy) {
          this.push({
            __type: "CircleVelocityChanged",

            id: circle.id,
            vx: circle.vx,
            vy: circle.vy
          })
        }
      })

      const projectiles = [...this.projectiles.values()]
      projectiles.forEach(projectile => {

        projectile.x = clamp(projectile.x + projectile.vx * step, 0, this.maxX - 10);
        projectile.y = clamp(projectile.y + projectile.vy * step, 0, this.maxY - 10);

        const collidesWith = circles.find(other => {
          // √[(x₂ - x₁)² + (y₂ - y₁)²]
          const distance = Math.sqrt((other.x - projectile.x) ** 2 + (other.y - projectile.y) ** 2)
          return distance <= 10;
        })

        if (collidesWith) {
          collidesWith.color = randomColor()
          this.push({
            __type: "CircleColorChanged",
            id: collidesWith.id,
            color: collidesWith.color
          })
        }

        if (
          collidesWith ||
          projectile.x <= 0 || projectile.x >= (this.maxX - 2) ||
          projectile.y <= 0 || projectile.y >= (this.maxY - 2)
        ) {
          this.projectiles.delete(projectile.id)
          this.push({
            __type: "ProjectileRemoved",
            id: projectile.id
          })
          return
        }
      })

      const updateMs = Date.now() - next;
      // console.info(`100|update|delta#${delta}|duration#${updateMs}|circles#${this.circles.size}`);
      await new Promise(resolve => setTimeout(resolve, Math.max(0, 16 - updateMs)))
    }
  }
  stop() {
    this.started = false;
  }

  dispatch(subject: string, action: Actions[keyof Actions]) {

    this.actions.push(action)
    switch (action.__type) {
      case "CreateProjectile": {

        const circle = this.circles.get(subject);

        const xAngle = Math.cos(action.direction)
        const yAngle = Math.sin(action.direction)

        // top:  0, -1  <-- add
        // bot:  0,  1
        // lef:  1,  0
        // rig: -1,  0  <-- add

        const dx = xAngle * (circle.radius + 1) + clamp(3 * xAngle, -3, .414)
        const dy = yAngle * (circle.radius + 1) + clamp(3 * yAngle, -3, .414)

        const projectile = new Projectile(
          v4(),
          circle.id,
          circle.x + dx,
          circle.y + dy,
          action.direction,
          this.projectileSpeed
        )

        this.projectiles.set(projectile.id, projectile);
        this.push({
          __type: "ProjectileCreated",

          id: projectile.id,

          color: projectile.color,
          height: projectile.height,
          width: projectile.width,

          x: projectile.x,
          vx: projectile.vx,
          y: projectile.y,
          vy: projectile.vy,
          direction: projectile.direction,
          speed: projectile.speed
        })

        return;
      }

      case "ChangeAcceleration": {

        const circle = this.circles.get(subject);
        circle.vx = this.circleSpeed * clamp(action.x, -1, 1);
        circle.vy = this.circleSpeed * clamp(action.y, -1, 1);

        this.push({
          __type: "CircleVelocityChanged",

          id: subject,
          vx: circle.vx,
          vy: circle.vy
        })
        return;
      }

      case "Decelerate": {

        const circle = this.circles.get(subject);
        circle.vx = this.circleSpeed * clamp(action.x, -1, 1);
        circle.vy = this.circleSpeed * clamp(action.y, -1, 1);

        return;
      }

      case "AddCircle": {

        const circle = new Circle(subject);
        this.circles.set(subject, circle);

        this.push({
          __type: "CircleAdded",

          id: circle.id,

          x: circle.x,
          y: circle.y,
          radius: circle.radius,

          color: circle.color
        })

        return;
      }

      case "RemoveCircle": {
        this.circles.delete(subject);

        this.push({
          __type: "CircleRemoved",

          id: subject
        })

        return;
      }
    }
  }
}
