import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import Phaser from 'phaser';
import { Events } from './hooks/Socket.types';
import { dispatch, socket, subscribe, useServer } from './hooks/Socket';

class CircleState {
  constructor(
    readonly id: string,
    readonly gfx: Phaser.GameObjects.Graphics,

    public vx: number,
    public vy: number,

  ) { }
}

const game = new Phaser.Game({
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  transparent: true,
  type: Phaser.WEBGL,
  parent: "phaser",

  scene: {
    update: () => {

    },
    preload: () => {

    },
    create() {
      const camera = this.cameras.add(undefined, undefined, undefined, undefined, true, "primary");
      camera.setBackgroundColor(0);
      camera.setZoom(5);

      const circles = new Map<string, CircleState>();
      const projectiles = new Map<string, Phaser.GameObjects.Graphics>();

      subscribe(e => {
        switch (e.__type) {
          case "ProjectileCreated": {
            if (projectiles.has(e.id)) {
              return;
            }

            const projectile = this.add.graphics({
              x: e.x,
              y: e.y,
              lineStyle: {
                width: .5,
                color: e.color
              }
            })

            projectiles.set(e.id, projectile);

            const rect = new Phaser.Geom.Rectangle(0, 0, e.width, e.height)
            projectile.strokeRectShape(rect)

            projectile.on(Phaser.GameObjects.Events.REMOVED_FROM_SCENE, () => {
              console.info("projectile removed.")
            })
            const onUpdate = (_, delta: number) => {
              const step = delta / 1000;
              projectile.setPosition(
                projectile.x + (e.vx * step),
                projectile.y + (e.vy * step)
              )
            }
            this.events.addListener("update", onUpdate);

            projectile.once(Phaser.GameObjects.Events.DESTROY, () => {
              this.events.removeListener("update", onUpdate);
            })
            return;
          }

          case "ProjectileRemoved": {

            const projectile = projectiles.get(e.id)

            projectile?.destroy(true);

            projectiles.delete(e.id);
            return;
          }

          case "CircleAdded": {
            if (circles.has(e.id)) {
              return;
            }

            const circle = this.add.graphics({
              x: e.x,
              y: e.y,
              fillStyle: {
                color: e.color
              }
            })

            const state = new CircleState(e.id, circle, 0, 0)
            circles.set(e.id, state)
            circle.fillCircle(0, 0, e.radius);

            const onUpdate = (_: undefined, delta: number) => {
              const step = delta / 1000
              circle.setPosition(
                circle.x + state.vx * step,
                circle.y + state.vy * step,
              )
            }

            this.events.addListener("update", onUpdate);
            circle.once(Phaser.GameObjects.Events.DESTROY, () => {
              this.events.removeListener("update", onUpdate);
            })

            if (e.id === socket.id) {
              const follow = () => {
                const next = camera.getScroll(circle.x, circle.y)
                camera.setScroll(next.x, next.y)
              }
              this.events.addListener("update", follow);
              circle.once(Phaser.GameObjects.Events.DESTROY, () => {
                this.events.removeListener("update", follow);
              })
            }
            return;
          }

          case "CircleRemoved": {
            const circle = circles.get(e.id).gfx

            circle.destroy(true);

            circles.delete(e.id);
            return
          }

          case "CircleMoved": {
            const circle = circles.get(e.id).gfx

            circle.setPosition(e.x, e.y);
            return;
          }

          case "CircleColorChanged": {
            const circle = circles.get(e.id).gfx
            circle.clear();

            circle.fillStyle(e.color);
            circle.fillCircle(0, 0, 10);

            return;
          }

          case "CircleVelocityChanged": {
            const circle = circles.get(e.id)

            circle.vx = e.vx
            circle.vy = e.vy
            return;
          }
        }
      })

      const up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      const down = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      const left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      const right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

      const wasDown = {
        [up.keyCode]: false,
        [down.keyCode]: false,
        [left.keyCode]: false,
        [right.keyCode]: false,
        [space.keyCode]: false,
      }
      const lastPressed = {
        [up.keyCode]: Date.now(),
        [down.keyCode]: Date.now(),
        [left.keyCode]: Date.now(),
        [right.keyCode]: Date.now(),
        [space.keyCode]: Date.now(),
      }

      let lastVx = 0;
      let lastVy = 0;

      this.events.addListener("update", (_: undefined, delta: number) => {
        const self = circles.get(socket.id)?.gfx

        if ((Date.now() - lastPressed[space.keyCode]) > 50 && space.isDown) {
          lastPressed[space.keyCode] = Date.now();

          const mouse = camera.getWorldPoint(this.input.mousePointer.x, this.input.mousePointer.y);

          const angle = Phaser.Math.Angle.Between(self.x, self.y, mouse.x - 1, mouse.y - 1)
          dispatch({
            __type: "CreateProjectile",

            direction: angle
          })
        }
        wasDown[space.keyCode] = space.isDown
        lastPressed[space.keyCode] = space.isDown ? lastPressed[space.keyCode]
          : Date.now()

        let dx = 0;
        let dy = 0;

        if (wasDown[up.keyCode] && !up.isDown) {
          wasDown[up.keyCode] = false
        } else if (up.isDown) {
          wasDown[up.keyCode] = true
          lastPressed[up.keyCode] = Date.now()
          dy -= 1;
        }

        if (wasDown[down.keyCode] && !down.isDown) {
          wasDown[down.keyCode] = false
        } else if (down.isDown) {
          wasDown[down.keyCode] = true
          lastPressed[down.keyCode] = Date.now()
          dy += 1;
        }

        if (wasDown[left.keyCode] && !left.isDown) {
          wasDown[left.keyCode] = false
        } else if (left.isDown) {
          wasDown[left.keyCode] = true
          lastPressed[left.keyCode] = Date.now()
          dx -= 1;
        }

        if (wasDown[right.keyCode] && !right.isDown) {
          wasDown[right.keyCode] = false
        } else if (right.isDown) {
          wasDown[right.keyCode] = true
          lastPressed[right.keyCode] = Date.now()
          dx += 1;
        }

        if (dx !== lastVx || dy !== lastVy) {
          dispatch({
            __type: "ChangeAcceleration",

            x: dx,
            y: dy
          })
        }

        lastVx = dx;
        lastVy = dy;
      })

      const bounds = {
        minX: 0,
        maxX: window.screen.availWidth,
        minY: 0,
        maxY: window.screen.availHeight
      }
      for (let x = bounds.minX; x < bounds.maxX; x = x + 10) {
        const line = new Phaser.Geom.Line(x, bounds.minY, x, bounds.maxY)

        const graphics = this.add.graphics({
          lineStyle: {
            width: 1,
            color: 0x00dd00
          }
        });

        graphics.strokeLineShape(line);
      }

      for (let y = bounds.minY; y < bounds.maxY; y = y + 10) {
        const line = new Phaser.Geom.Line(bounds.minX, y, bounds.maxX, y)

        const graphics = this.add.graphics({
          lineStyle: {
            width: 1,
            color: 0x00dd00
          }
        });

        graphics.strokeLineShape(line);
      }
    }
  }
})

function App() {
  return (
    <>
    </>
  );
}

export default App;
