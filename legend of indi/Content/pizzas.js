window.PizzaTypes = {
  normal: "normal",
  spicy: "spicy",
  veggie: "veggie",
  fungi: "fungi",
  chill: "chill",
}

window.Pizzas = {
  "s001": {
    name: "Sandalmander",
    description: "The Sandal Lizard",
    type: PizzaTypes.spicy,
    src: "images/characters/pizzas/s001.png",
    icon: "images/icons/spicy.png",
    actions: ["damage1", "saucyStatus", "clumsyStatus",  ],
  },
  "s002": {
    name: "sally",
    description: "wip",
    type: PizzaTypes.spicy,
    src: "images/characters/pizzas/s002.png",
    icon: "images/icons/spicy.png",
    actions: [ "damage1", "saucyStatus", "clumsyStatus" ],
  },
  "v001": {
    name: "Harasaur",
    description: "The mystical frog",
    type: PizzaTypes.veggie,
    src: "images/characters/pizzas/v001.png",
    icon: "images/icons/veggie.png",
    actions: [ "damage1" ],
  },
  "f001": {
    name: "Fungitle",
    description: "wip",
    type: PizzaTypes.fungi,
    src: "images/characters/pizzas/f001.png",
    icon: "images/icons/fungi.png",
    actions: [ "damage1" ],
  }
}