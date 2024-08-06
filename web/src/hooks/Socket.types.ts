export interface Actions {
  ChangeAcceleration: {
    __type: "ChangeAcceleration"
    x: number
    y: number
  }
  Decelerate: {
    __type: "Decelerate"
    x: number
    y: number
  }

  AddCircle: {
    __type: "AddCircle"
  }
  RemoveCircle: {
    __type: "RemoveCircle"
  }

  CreateProjectile: {
    __type: "CreateProjectile"

    direction: number
  }
}

export interface Events {
  CircleMoved: {
    __type: "CircleMoved"

    id: string
    x: number
    y: number
  }
  CircleVelocityChanged: {
    __type: "CircleVelocityChanged"

    id: string
    vx: number
    vy: number
  }
  CircleColorChanged: {
    __type: "CircleColorChanged"

    id: string
    color: number
  },

  CircleAdded: {
    __type: "CircleAdded"

    id: string
    x: number
    y: number
    color: number
    radius: number
  }

  CircleRemoved: {
    __type: "CircleRemoved"

    id: string
  }

  ProjectileCreated: {
    __type: "ProjectileCreated"

    id: string
    x: number
    vx: number
    y: number
    vy: number
    height: number
    width: number
    direction: number
    speed: number
    color: number
  }
  ProjectileRemoved: {
    __type: "ProjectileRemoved"

    id: string
  }
}