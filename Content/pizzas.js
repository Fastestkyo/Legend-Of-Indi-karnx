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
    actions: ["damage1",  "clumsyStatus",  ],
  },
  "s002": {
    name: "Spicat",
    description: "Cat on fire",
    type: PizzaTypes.spicy,
    src: "images/characters/pizzas/s002.png",
    icon: "images/icons/spicy.png",
    actions: [ "damage1", "saucyStatus",  ],
  },
  "s003": {
    name: "Cerbeetle",
    description: "Cerberus Beetle",
    type: PizzaTypes.spicy,
    src: "images/characters/pizzas/s003.png",
    icon: "images/icons/spicy.png",
    actions: [ "damage2","clumsyStatus"  ],
  },
  "v001": {
    name: "Harasaur",
    description: "The mystical frog",
    type: PizzaTypes.veggie,
    src: "images/characters/pizzas/v001.png",
    icon: "images/icons/veggie.png",
    actions: [ "damage1", "clumsyStatus" ],
  },
  "f001": {
    name: "Fungitle",
    description: "The mushroom of the forest",
    type: PizzaTypes.fungi,
    src: "images/characters/pizzas/f001.png",
    icon: "images/icons/fungi.png",
    actions: [ "damage1", "saucyStatus" ],
  },
  "f002": {
    name: "Crowsion",
    description: "Dr death",
    type: PizzaTypes.fungi,
    src: "images/characters/pizzas/f002.png",
    icon: "images/icons/fungi.png",
    actions: [ "damage2", "clumsyStatus" ],
    
  },
"c001": {
    name: "Robinseed",
    description: "robin seed",
    type: PizzaTypes.chill,
    src: "images/characters/pizzas/c001.png",
    icon: "images/icons/veggie.png",
    actions: [ "damage1", "clumsyStatus" ],
    
  }
,
"c002": {
    name: "Akhil",
    description: "idk",
    type: PizzaTypes.chill,
    src: "images/characters/pizzas/c002.png",
    icon: "images/icons/veggie.png",
    actions: [ "damage3", "clumsyStatus" ],
    
  }
}