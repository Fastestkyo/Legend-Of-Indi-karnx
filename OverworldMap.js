class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
    this.isPaused = false;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    )
  }

  isSpaceTaken(currentX, currentY, direction) {
    const {
      x,
      y
    } = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.id = key;

      //TODO: determine if this object should actually mount
      object.mount(this);

    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
        break;
      }
    }

    this.isCutscenePlaying = false;

    //Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf]
        })
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events)
    }
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x, y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {
      x,
      y
    } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }

}

window.OverworldMaps = {
  DemoRoom: {
    id: "DemoRoom",
    lowerSrc: "images/maps/DemoLower.png",
    upperSrc: "images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "images/characters/people/npc2.png",
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: 800
          },
          {
            type: "stand",
            direction: "up",
            time: 800
          },
          {
            type: "stand",
            direction: "right",
            time: 1200
          },
          {
            type: "stand",
            direction: "up",
            time: 300
          },
        ],
        talking: [{
            required: ["TALKED_TO_ERIO"],
            events: [{
              type: "textMessage",
              text: "Isn't Erio the coolest?",
              faceHero: "npcA"
            }, ]
          },
          {
            events: [{
                type: "textMessage",
                text: "I'm going to crush you!",
                faceHero: "npcA"
              },
              {
                type: "battle",
                enemyId: "beth"
              },
              {
                type: "addStoryFlag",
                flag: "DEFEATED_BETH"
              },
              {
                type: "textMessage",
                text: "You crushed me like weak pepper.",
                faceHero: "npcA"
              },
              // { type: "textMessage", text: "Go away!"},
              //{ who: "hero", type: "walk",  direction: "up" },
            ]
          }
        ]
      }),
      npcB: new Person({
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        src: "images/characters/people/erio.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "Bahaha!",
              faceHero: "npcB"
            },
            {
              type: "addStoryFlag",
              flag: "TALKED_TO_ERIO"
            }
            //{ type: "battle", enemyId: "erio" }
          ]
        }]
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ]
      }),
      pizzaStone: new PizzaStone({
        x: utils.withGrid(2),
        y: utils.withGrid(7),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["v001", "f001"],
      }),
    },
    walls: {
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 4)]: [{
        events: [{
            who: "npcB",
            type: "walk",
            direction: "left"
          },
          {
            who: "npcB",
            type: "stand",
            direction: "up",
            time: 500
          },
          {
            type: "textMessage",
            text: "You can't be in there!"
          },
          {
            who: "npcB",
            type: "walk",
            direction: "right"
          },
          {
            who: "hero",
            type: "walk",
            direction: "down"
          },
          {
            who: "hero",
            type: "walk",
            direction: "left"
          },
        ]
      }],
      [utils.asGridCoord(5, 10)]: [{
        events: [{
          type: "changeMap",
          map: "Kitchen",
          x: utils.withGrid(2),
          y: utils.withGrid(2),
          direction: "down"
        }]
      }]
    }

  },
  // Kitchen: {
  //   id: "Kitchen",
  //   lowerSrc: "images/maps/KitchenLower.png",
  //   upperSrc: "images/maps/KitchenUpper.png",
  //   gameObjects: {
  //     hero: new Person({
  //       isPlayerControlled: true,
  //       x: utils.withGrid(5),
  //       y: utils.withGrid(5),
  //     }),
  //     npcB: new Person({
  //       x: utils.withGrid(10),
  //       y: utils.withGrid(8),
  //       src: "images/characters/people/npc3.png",
  //       talking: [
  //         {
  //           events: [
  //             { type: "textMessage", text: "You made it! This video is going to be such a good time!", faceHero:"npcB" },
  //           ]
  //         }
  //       ]
  //     })
  //   },
  //   cutsceneSpaces: {
  //     [utils.asGridCoord(5,10)]: [
  //       {
  //         events: [
  //           { 
  //             type: "changeMap", 
  //             map: "Street",
  //             x: utils.withGrid(29),
  //             y: utils.withGrid(9), 
  //             direction: "down"
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // },
  Bedroom: {
    id: "Bedroom",
    lowerSrc: "images/maps/BedroomLower.png",
    upperSrc: "images/maps/BedroomUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      sis: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "images/characters/people/sister.png",
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: 800
          },
          {
            type: "stand",
            direction: "up",
            time: 800
          },
          {
            type: "stand",
            direction: "right",
            time: 1200
          },
          {
            type: "stand",
            direction: "up",
            time: 300
          },
        ],
        talking: [{
          events: [{
            type: "textMessage",
            text: "Go meet mom!",
            faceHero: "sis" 
          }]
        }]
      }),
      Computer: new Person({
        x: utils.withGrid(9),
        y: utils.withGrid(3),
        src: "images/characters/empty.png",
        useShadow:false,
        talking: [{
          events: [{
              type: "textMessage",
              text: "You turn on your computer",
            },
            {
              type: "textMessage",
              text: "You check your email:",
            },
            {
              type: "textMessage",
              text: "HAPPY BIRTHDAY, KARNX!!! - from mom",
            },
            {
              type: "textMessage",
              text: "ayy bro turning 13!! - from homie",
            },
            {
              type: "textMessage",
              text: "Hello, karnx. Happy birthday. Your mom must have asked you to meet me. ill be in the UpperStreet - lab ",
            },
            {
              type: "textMessage",
              text: "-Dr. Kumar",
            },
            {
              type: "addStoryFlag",
              flag: "CHECKED_EMAIL"
            }
            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

      Cabinet: new Person({
        x: utils.withGrid(2),
        y: utils.withGrid(4),
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bookshelf",
            },
            {
              type: "textMessage",
              text: "It is full of books",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      
      Cabinet2: new Person({
        x: utils.withGrid(3),
        y: utils.withGrid(4),
        useShadow:true,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bookshelf",
            },
            {
              type: "textMessage",
              text: "It is full of books",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

      Bed1 :new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(4),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Bed2 :new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(4),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Bed3 :new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(5),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Bed4 :new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(5),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Bed5 :new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(5),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Bed6 :new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(4),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bed",
            },
            {
              type: "textMessage",
              text: "It is neatly arranged",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

      Locker :new Person({
        x: utils.withGrid(11),
        y: utils.withGrid(5),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your Cupboard",
            },
            {
              type: "textMessage",
              text: "It has your clothes and stuff",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Locker2 :new Person({
        x: utils.withGrid(12),
        y: utils.withGrid(5),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your Cupboard",
            },
            {
              type: "textMessage",
              text: "It has your clothes and stuff",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

      play :new Person({
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your Toybox",
            },
            {
              type: "textMessage",
              text: "It has your Toys - namely pokemon plushes",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      play2 :new Person({
        x: utils.withGrid(2),
        y: utils.withGrid(9),
        useShadow:false,
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your Toybox",
            },
            {
              type: "textMessage",
              text: "It has your Toys - namely pokemon plushes",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      
      

    },
    walls: {
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(8, 3)]: true,
     
      [utils.asGridCoord(10, 3)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(12, 3)]: true,
      [utils.asGridCoord(13, 4)]: true,
      [utils.asGridCoord(13, 5)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(13, 7)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(12, 10)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(11, 4)]: true,
    },
    cutsceneSpaces: {

      [utils.asGridCoord(5, 10)]: [{
        events: [{
          type: "changeMap",
          map: "LivingRoom",
          x: utils.withGrid(7),
          y: utils.withGrid(2),
          direction: "down"
        }]
      }]
    }

  },
  Street: {
    id: "Street",
    lowerSrc: "images/maps/StreetLower.png",
    upperSrc: "images/maps/StreetUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(21),
        y: utils.withGrid(9),
      }),
      npcB: new Person({
        x: utils.withGrid(22),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "HEY!",
              faceHero: "npcB"
            },
            {
              type: "textMessage",
              text: "Did u hear about the new lab?",
              faceHero: "npcB"
            },
          ]
        }],
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: "2000"
          },
          {
            type: "stand",
            direction: "right",
            time: "200"
          },
          {
            type: "stand",
            direction: "left",
            time: "400"
          },
          {
            type: "stand",
            direction: "right",
            time: "2500"
          },
        ]
      }),
      Randomdude2: new Person({
        x: utils.withGrid(19),
        y: utils.withGrid(9),
        src: "images/characters/people/npc5.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "yooo!",
              faceHero: "npcB"
            },
            {
              type: "textMessage",
              text: "karnx was here"
            }

          ]
        }],
        behaviorLoop: [{
            type: "walk",
            direction: "right"
          },
          {
            type: "stand",
            time: "500",
            direction: "up"
          },
          {
            type: "walk",
            direction: "down"
          },
          {
            type: "walk",
            direction: "left"
          },
          {
            type: "stand",
            time: "900",
            direction: "right"
          },
          {
            type: "walk",
            direction: "up"
          },
        ]
      }),
    },
    walls: {
      [utils.asGridCoord(4, 9)]: true,
      [utils.asGridCoord(6, 9)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(12, 9)]: true,

      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(15, 7)]: true,
      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(17, 7)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(19, 7)]: true,
      [utils.asGridCoord(20, 7)]: true,
      [utils.asGridCoord(21, 7)]: true,
      [utils.asGridCoord(22, 7)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(24, 7)]: true,
      [utils.asGridCoord(24, 6)]: true,
      [utils.asGridCoord(24, 5)]: true,
      [utils.asGridCoord(24, 4)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(26, 5)]: true,
      [utils.asGridCoord(26, 6)]: true,
      [utils.asGridCoord(26, 7)]: true,
      [utils.asGridCoord(27, 7)]: true,

      [utils.asGridCoord(28, 8)]: true,
      [utils.asGridCoord(28, 9)]: true,
      [utils.asGridCoord(30, 9)]: true,
      [utils.asGridCoord(31, 9)]: true,
      [utils.asGridCoord(32, 9)]: true,
      [utils.asGridCoord(33, 9)]: true,
      [utils.asGridCoord(34, 9)]: true,

      [utils.asGridCoord(34, 10)]: true,
      [utils.asGridCoord(34, 11)]: true,
      [utils.asGridCoord(34, 12)]: true,

      [utils.asGridCoord(33, 13)]: true,
      [utils.asGridCoord(32, 13)]: true,
      [utils.asGridCoord(31, 13)]: true,
      [utils.asGridCoord(30, 13)]: true,
      [utils.asGridCoord(29, 13)]: true,
      [utils.asGridCoord(28, 13)]: true,
      [utils.asGridCoord(27, 13)]: true,
      [utils.asGridCoord(26, 13)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,
      [utils.asGridCoord(23, 13)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(21, 13)]: true,
      [utils.asGridCoord(20, 13)]: true,
      [utils.asGridCoord(19, 13)]: true,
      [utils.asGridCoord(18, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(15, 13)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(12, 13)]: true,
      [utils.asGridCoord(11, 13)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(8, 13)]: true,
      [utils.asGridCoord(7, 13)]: true,
      [utils.asGridCoord(6, 13)]: true,
      [utils.asGridCoord(5, 13)]: true,
      [utils.asGridCoord(4, 13)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(2, 13)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(3, 9)]: true,
      [utils.asGridCoord(3, 8)]: true,

      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(17, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(17, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(17, 11)]: true,

      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(19, 11)]: true,

      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(26, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(26, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(26, 11)]: true,
    },

    cutsceneSpaces: {
      [utils.asGridCoord(5, 9)]: [{
        events: [{
          type: "changeMap",
          map: "LivingRoom",
          x: utils.withGrid(6),
          y: utils.withGrid(12),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(25, 5)]: [{
        events: [{
          type: "changeMap",
          map: "StreetNorth",
          x: utils.withGrid(7),
          y: utils.withGrid(15),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(29, 9)]: [{
        events: [
          {type: "textMessage", text:"You aint supposed to be here"},
          {who: "hero",type: "walk", direction:"down", time:"100"},
          {who: "hero",type: "walk", direction:"down", time:"100"}
         
        ]
      }]
    }
  },
  LivingRoom: {
    id: "LivingRoom",
    lowerSrc: "images/maps/LivingRoomLower.png",
    upperSrc: "images/maps/LivingRoomUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(2),

      }),
      npcA: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(8),
        src: "images/characters/people/npc4.png",
        behaviorLoop: [
          {who:"npcA",type:"stand",direction:"up",time:8},


        ],

        talking: [
         
          {
            required: ["TALKED_TO_MOM"],
            events: [{
                type: "textMessage",
                text: "You should get going!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Kumar doesn't like to wait.",
                faceHero: "npcA"
              },
            ]

          },
          {
            events: [{
                type: "textMessage",
                text: "AWWWWWWW!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Look at my sweet honey pie!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Hes turning 13!!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "You: Mom stop itttt!!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Alright, Alright",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "You: Why did u call me anyways?",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "As you know, pokemon can't be found in the wild in India.",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "This is because of the polution and stuff",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Go meet doctor Kumar in his lab, He'll give you more information",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Check your computer for info.",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "You: Okay, Thanks",
                faceHero: "npcA"
              },
              {
                type: "addStoryFlag",
                flag: "TALKED_TO_MOM"
              },

            ]
          },

          
         



        ]

        
      
      }),
      Dad: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(11),
        src: "images/characters/people/erio.png",
        behaviorLoop: [{
            type: "stand",
            direction: "down",
            time: 800
          },
          {
            type: "stand",
            direction: "right",
            time: 400
          },
          {
            type: "stand",
            direction: "left",
            time: 1200
          },
          {
            type: "stand",
            direction: "up",
            time: 800
          },

        ],
        talking: [
          
          {
            required: ["CHECKED_EMAIL", "TALKED_TO_MOM"],
            events: [{
                type: "textMessage",
                text: "Oh im blocking the way?",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "So sorry",
                faceHero: "npcA"
              },
              {
                who: "hero",
                type: "walk",
                direction: "up",
                time: 800
              },
              {
                who: "hero",
                type: "walk",
                direction: "up",
                time: 800
              },
              {
                who: "Dad",
                type: "walk",
                direction: "up",
                time: 800
              },
              {
                who: "Dad",
                type: "walk",
                direction: "right",
                time: 800
              },
              {
                who: "Dad",
                type: "walk",
                direction: "right",
                time: 800
              },
              {
                who: "hero",
                type: "walk",
                direction: "down",
                time: 800
              },
              {type:"addStoryFlag",flag:"MOVED_DAD"},
              // {
              //   who: "hero",
              //   type: "walk",
              //   direction: "down",
              //   time: 800
              // },
              // {
              //   who: "hero",
              //   type: "walk",
              //   direction: "down",
              //   time: 800
              // },

              {
                type: "addStoryFlag",
                flag: "MOVED_DAD"
              },
            ]

          },


          {
            events: [{
                type: "textMessage",
                text: "**He's on a call**",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Your thoughts: Check your email till then?",
                faceHero: "npcA"
              },
            ]
          }
        ]
      }),
      TV: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(5),
        useShadow: false,
        src: "images/characters/empty.png",
        
        talking: [{
           
            events: [
              {type:"textMessage", text:"You see the TV"},

              
            ]

          },


          
        ]
      }),

    },
    walls: {
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 2)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(6, 1)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(8, 1)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(9, 2)]: true,
      [utils.asGridCoord(9, 1)]: true,
      [utils.asGridCoord(10, 4)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(13, 5)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(13, 7)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(13, 11)]: true,

      [utils.asGridCoord(12, 12)]: true,
      [utils.asGridCoord(11, 12)]: true,
      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(5, 12)]: true,
      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true,
      [utils.asGridCoord(1, 12)]: true,

      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(5, 12)]: true,
      [utils.asGridCoord(6, 13)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 1)]: [{

        events: [{
          type: "changeMap",
          map: "Bedroom",
          x: utils.withGrid(5),
          y: utils.withGrid(10),
          direction: "up"
        }],
      }, ],
      [utils.asGridCoord(6, 12)]: [{
          events: [{
            type: "changeMap",
            map: "Street",
            x: utils.withGrid(5),
            y: utils.withGrid(10),
            direction: "down"
          }],
        },

      ],





      // [utils.asGridCoord(6,12)]: [
      //   {

      //     events: [
      //       [
      //       { who: "npcA", type: "walk",  direction: "right" },
      //       { who: "npcA", type: "walk",  direction: "right" },
      //       { who: "npcA", type: "walk",  direction: "down", time: 500 },
      //       { who: "npcA", type: "walk",  direction: "down", time: 500 },

      //       { type: "textMessage", text:"Your Not Ready Yet!!", faceHero: "npcA" },
      //       { type: "textMessage", text:"Come talk to me", faceHero: "npcA" },
      //       { who: "npcA", type: "walk",  direction: "up" },
      //       { who: "npcA", type: "walk",  direction: "up" },
      //       { who: "npcA", type: "walk",  direction: "left" },
      //       { who: "npcA", type: "walk",  direction: "left" },
      //       { who: "hero", type: "walk",  direction: "up" },
      //       { who: "hero", type: "walk",  direction: "up" },


      //       ]
      //     ]
      //   }
      // ]
    }
  },
  StreetNorth: {
    id: "StreetNorth",
    lowerSrc: "images/maps/StreetNorthLower.png",
    upperSrc: "images/maps/StreetNorthUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(9),
      }),
     npcrandom: new Person ({
       x: utils.withGrid(3),
       y: utils.withGrid(9),
       src: "images/characters/people/npc7.png",
       talking: [{
         events: [
          
          {
           type: "textMessage",
           text: "HEY!",
           faceHero:"npcrandom"
         },
         {
          type:"textMessage",
          text:"Look at my pokemon!",
          faceHero:"npcrandom"
         }
        
        ]
       }],
       behaviorLoop: [
      {type:"stand", direction:"right", time:2000},
      {type:"stand", direction:"up", time:1000},
      {type:"stand", direction:"down", time:1000}, 
       ]


     }),
      pkmn: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(9),
        src: "images/characters/pizzas/c001.png",
        talking: [{
          events: [{
            type: "textMessage",
            text: "grrrr"
          }]
        }],
        behaviorLoop: [

        ]
      }),


    },
    walls: {
      [utils.asGridCoord(6, 16)]: true,
      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(2, 16)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(0, 16)]: true,

      [utils.asGridCoord(-1, 15)]: true,
      [utils.asGridCoord(-1, 14)]: true,
      [utils.asGridCoord(-1, 13)]: true,
      [utils.asGridCoord(-1, 12)]: true,
      [utils.asGridCoord(-1, 11)]: true,
      [utils.asGridCoord(-1, 10)]: true,
      [utils.asGridCoord(-1, 9)]: true,
      [utils.asGridCoord(-1, 8)]: true,
      [utils.asGridCoord(-1, 7)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,

      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(6, 5)]: true,
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(12, 6)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(14, 6)]: true,
      [utils.asGridCoord(15, 6)]: true,

      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(16, 8)]: true,
      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(16, 12)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(16, 14)]: true,
      [utils.asGridCoord(16, 15)]: true,

      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(11, 16)]: true,
      [utils.asGridCoord(10, 16)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(8, 16)]: true,

      [utils.asGridCoord(7, 17)]: true,

      [utils.asGridCoord(6, 15)]: true,
      [utils.asGridCoord(5, 15)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(2, 15)]: true,
      [utils.asGridCoord(1, 15)]: true,

      [utils.asGridCoord(1, 14)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,

      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,

      [utils.asGridCoord(14, 7)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(14, 9)]: true,
      [utils.asGridCoord(14, 10)]: true,
      [utils.asGridCoord(14, 11)]: true,
      [utils.asGridCoord(14, 12)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(14, 14)]: true,

      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(12, 15)]: true,
      [utils.asGridCoord(11, 15)]: true,
      [utils.asGridCoord(10, 15)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(8, 15)]: true,
    },

    cutsceneSpaces: {



      [utils.asGridCoord(7, 5)]: [{
        events: [{
          type: "changeMap",
          map: "Lab",
          x: utils.withGrid(5),
          y: utils.withGrid(12),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(7, 16)]: [{
        events: [{
          type: "changeMap",
          map: "Street",
          x: utils.withGrid(25),
          y: utils.withGrid(5),
          direction: "up"
        }]
      }]
    }
  },
  Lab: {
    id: "Lab",
    lowerSrc: "images/maps/LabLower.png",
    upperSrc: "images/maps/LabUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(12),
      }),
      npcf: new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(10),
        src: "images/characters/people/npc3.png",
        talking: [
            {
              required:["Pokemon"],
              events: [
                {
                  type: "textMessage",
                  text: "First ones Fungitle",
                  faceHero: "npcf"
                },
                {
                  type: "textMessage",
                  text: "Second is Robinseed",
                  faceHero: "npcf"
                },
                {
                  type: "textMessage",
                  text: "Third is Harasaur",
                  faceHero: "npcf"
                },
                {
                  type: "textMessage",
                  text: "Kumar will probably be in the coffee shop, with his deciple",
                  faceHero: "npcf"
                },

              ]
            },
          
          
          {
            events: [{
                type: "textMessage",
                text: "Dr kumar isn't here right now.",
                faceHero: "npcf"
              },
              {
                type: "textMessage",
                text: "Choose a pokemon.",
                faceHero: "npcf"
              },
              {
                type: "textMessage",
                text: "First ones Fungitile",
                faceHero: "npcf"
              },
              {
                type: "textMessage",
                text: "Second is Robinseed",
                faceHero: "npcf"
              },
              {
                type: "textMessage",
                text: "Third is Harasaur",
                faceHero: "npcf"
              },
              {
                type: "textMessage",
                text: "Kumar will probably be in the coffee shop, with his deciple",
                faceHero: "npcf"
              },
              {
                type: "addStoryFlag",
                flag: "Pokemon"
              }

            ]
          },




        ],

      }),
      pizzaStone: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(10),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["v001", ],
      }),
      pizzaStone2: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(8),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["f001", ],
      }),
      pizzaStone3: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["c001", ],
      }),




    },
    walls: {
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(0, 3)]: true,

      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,

      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(10, 4)]: true,

      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(10, 6)]: true,
      [utils.asGridCoord(10, 7)]: true,
      [utils.asGridCoord(10, 8)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(10, 11)]: true,

      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(6, 12)]: true,

      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(5, 13)]: true,

      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(5, 7)]: true,
      [utils.asGridCoord(6, 7)]: true,
      

      [utils.asGridCoord(4 , 9)]: true,
      [utils.asGridCoord(5 , 9)]: true,
      [utils.asGridCoord(6 , 9)]: true,
      [utils.asGridCoord(7 , 9)]: true,
      [utils.asGridCoord(8 , 9)]: true,
      [utils.asGridCoord(9 , 9)]: true,

      [utils.asGridCoord(1 , 4)]: true,

      [utils.asGridCoord(3 , 4)]: true,
      [utils.asGridCoord(4 , 4)]: true,
      
      [utils.asGridCoord(6 , 4)]: true,
      [utils.asGridCoord(7 , 4)]: true,
    },

    cutsceneSpaces: {
      [utils.asGridCoord(5, 12)]: [{
        events: [{
          type: "changeMap",
          map: "StreetNorth2",
          x: utils.withGrid(7),
          y: utils.withGrid(5),
          direction: "down"
        }]
      }],

    }
  },
  StreetNorth2: {
    id: "StreetNorth2",
    lowerSrc: "images/maps/StreetNorthLower.png",
    upperSrc: "images/maps/StreetNorthUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(9),
        useShadow:true,
      }),
      npcrandom2: new Person ({
        x: utils.withGrid(3),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [
          {
            required:"BATTLE_RANDOM2",
            events: [
              {type:"textMessage", text:"You're hacking!"},


            ]


          },
          
          {
          events: [
           
           {
            type: "textMessage",
            text: "HEY!"
          },
          {
           type:"textMessage",
           text:"Look at my pokemon!"
 
          },
          {
            type:"textMessage",
            text:"I bet its better than yours!"
  
           },
           {type:"battle", enemyId:"random2"},
           {type:"addStoryFlag", flag:"BATTLE_RANDOM2"}
         ]
        }],
        behaviorLoop: [
       {type:"stand", direction:"right", time:2000},
       {type:"stand", direction:"up", time:1000},
       {type:"stand", direction:"down", time:1000}, 
        ]
 
 
      }),
      pkmn: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(9),
        src: "images/characters/pizzas/c001.png",
        talking: [{
          events: [{
            type: "textMessage",
            text: "grrrr"
          }]
        }],
        behaviorLoop: [

        ]
      }),


    },
    walls: {
      [utils.asGridCoord(6, 16)]: true,
      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(2, 16)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(0, 16)]: true,

      [utils.asGridCoord(-1, 15)]: true,
      [utils.asGridCoord(-1, 14)]: true,
      [utils.asGridCoord(-1, 13)]: true,
      [utils.asGridCoord(-1, 12)]: true,
      [utils.asGridCoord(-1, 11)]: true,
      [utils.asGridCoord(-1, 10)]: true,
      [utils.asGridCoord(-1, 9)]: true,
      [utils.asGridCoord(-1, 8)]: true,
      [utils.asGridCoord(-1, 7)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,

      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(6, 5)]: true,
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(12, 6)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(14, 6)]: true,
      [utils.asGridCoord(15, 6)]: true,

      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(16, 8)]: true,
      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(16, 12)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(16, 14)]: true,
      [utils.asGridCoord(16, 15)]: true,

      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(11, 16)]: true,
      [utils.asGridCoord(10, 16)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(8, 16)]: true,

      [utils.asGridCoord(7, 17)]: true,

      [utils.asGridCoord(6, 15)]: true,
      [utils.asGridCoord(5, 15)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(2, 15)]: true,
      [utils.asGridCoord(1, 15)]: true,

      [utils.asGridCoord(1, 14)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,

      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,

      [utils.asGridCoord(14, 7)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(14, 9)]: true,
      [utils.asGridCoord(14, 10)]: true,
      [utils.asGridCoord(14, 11)]: true,
      [utils.asGridCoord(14, 12)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(14, 14)]: true,

      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(12, 15)]: true,
      [utils.asGridCoord(11, 15)]: true,
      [utils.asGridCoord(10, 15)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(8, 15)]: true,
    },

    cutsceneSpaces: {



      [utils.asGridCoord(7, 5)]: [{
        events: [
         {type:"textMessage", text:"You aint supposed to be here"},
          {who:"hero", type:"walk", direction:"down"},
          {who:"hero", type:"walk", direction:"down"}
        ]
      }],
      [utils.asGridCoord(7, 16)]: [{
        events: [{
          type: "changeMap",
          map: "Street2",
          x: utils.withGrid(25),
          y: utils.withGrid(5),
          direction: "down"
        }]
      }]
    }
  },
  Street2: {
    id: "Street2",
    lowerSrc: "images/maps/StreetLower.png",
    upperSrc: "images/maps/StreetUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(21),
        y: utils.withGrid(9),
      }),
      npcB: new Person({
        x: utils.withGrid(22),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "HEY!",
              faceHero: "npcB"
            },
            {
              type: "textMessage",
              text: "Did u hear about the new lab?",
              faceHero: "npcB"
            },
          ]
        }],
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: "2000"
          },
          {
            type: "stand",
            direction: "right",
            time: "200"
          },
          {
            type: "stand",
            direction: "left",
            time: "400"
          },
          {
            type: "stand",
            direction: "right",
            time: "2500"
          },
        ]
      }),
      Randomdude2: new Person({
        x: utils.withGrid(19),
        y: utils.withGrid(9),
        src: "images/characters/people/npc5.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "yooo!",
              faceHero: "npcB"
            },
            {
              type: "textMessage",
              text: "karnx was here"
            }

          ]
        }],
        behaviorLoop: [{
            type: "walk",
            direction: "right"
          },
          {
            type: "stand",
            time: "500",
            direction: "up"
          },
          {
            type: "walk",
            direction: "down"
          },
          {
            type: "walk",
            direction: "left"
          },
          {
            type: "stand",
            time: "900",
            direction: "right"
          },
          {
            type: "walk",
            direction: "up"
          },
        ]
      }),
    },
    walls: {
      [utils.asGridCoord(4, 9)]: true,
      [utils.asGridCoord(6, 9)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(12, 9)]: true,

      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(15, 7)]: true,
      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(17, 7)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(19, 7)]: true,
      [utils.asGridCoord(20, 7)]: true,
      [utils.asGridCoord(21, 7)]: true,
      [utils.asGridCoord(22, 7)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(24, 7)]: true,
      [utils.asGridCoord(24, 6)]: true,
      [utils.asGridCoord(24, 5)]: true,
      [utils.asGridCoord(24, 4)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(26, 5)]: true,
      [utils.asGridCoord(26, 6)]: true,
      [utils.asGridCoord(26, 7)]: true,
      [utils.asGridCoord(27, 7)]: true,

      [utils.asGridCoord(28, 8)]: true,
      [utils.asGridCoord(28, 9)]: true,
      [utils.asGridCoord(30, 9)]: true,
      [utils.asGridCoord(31, 9)]: true,
      [utils.asGridCoord(32, 9)]: true,
      [utils.asGridCoord(33, 9)]: true,
      [utils.asGridCoord(34, 9)]: true,

      [utils.asGridCoord(34, 10)]: true,
      [utils.asGridCoord(34, 11)]: true,
      [utils.asGridCoord(34, 12)]: true,

      [utils.asGridCoord(33, 13)]: true,
      [utils.asGridCoord(32, 13)]: true,
      [utils.asGridCoord(31, 13)]: true,
      [utils.asGridCoord(30, 13)]: true,
      [utils.asGridCoord(29, 13)]: true,
      [utils.asGridCoord(28, 13)]: true,
      [utils.asGridCoord(27, 13)]: true,
      [utils.asGridCoord(26, 13)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,
      [utils.asGridCoord(23, 13)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(21, 13)]: true,
      [utils.asGridCoord(20, 13)]: true,
      [utils.asGridCoord(19, 13)]: true,
      [utils.asGridCoord(18, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(15, 13)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(12, 13)]: true,
      [utils.asGridCoord(11, 13)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(8, 13)]: true,
      [utils.asGridCoord(7, 13)]: true,
      [utils.asGridCoord(6, 13)]: true,
      [utils.asGridCoord(5, 13)]: true,
      [utils.asGridCoord(4, 13)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(2, 13)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(3, 9)]: true,
      [utils.asGridCoord(3, 8)]: true,

      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(17, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(17, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(17, 11)]: true,

      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(19, 11)]: true,

      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(26, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(26, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(26, 11)]: true,
    },

    cutsceneSpaces: {
      [utils.asGridCoord(5, 9)]: [{
        events: [{
          type: "changeMap",
          map: "LivingRoom2",
          x: utils.withGrid(6),
          y: utils.withGrid(12),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(25, 5)]: [{
        events: [{
          type: "changeMap",
          map: "StreetNorth2",
          x: utils.withGrid(7),
          y: utils.withGrid(15),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(29, 9)]: [{
        events: [
          { 
            type: "changeMap", 
            map:"Shop",
            x: utils.withGrid(5),
            y: utils.withGrid(12),
            direction: "up"
          
          }
         
        ]
      }]
    }
  },
  LivingRoom2: {
    id: "LivingRoom2",
    lowerSrc: "images/maps/LivingRoomLower.png",
    upperSrc: "images/maps/LivingRoomUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(2),

      }),
      Mum: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(8),
        src: "images/characters/people/npc4.png",
        talking: [
            {
              required: ["BYEBYE"],
              events: [
                {type:"textMessage", text:"Bye! Good Luck!"},

              ]


            },
          
          {
          events: [
            {type:"textMessage", text:"Hey! what happened?"},
            {type:"textMessage", text:"You: He told me to meet him at the shop, i'll set out on my jouney now."},
            {type:"textMessage", text:"I see, Good luck!"}, {type: "addStoryFlag", flag: "BYEBYE"}

          ]





        }]
          }),

          
         



        

        
      
      
      

    },
    walls: {
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 2)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(6, 1)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(8, 1)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(9, 2)]: true,
      [utils.asGridCoord(9, 1)]: true,
      [utils.asGridCoord(10, 4)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(13, 5)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(13, 7)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(13, 11)]: true,

      [utils.asGridCoord(12, 12)]: true,
      [utils.asGridCoord(11, 12)]: true,
      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(5, 12)]: true,
      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true,
      [utils.asGridCoord(1, 12)]: true,

      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(5, 12)]: true,
      [utils.asGridCoord(6, 13)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 1)]: [{

        events: [{
          type: "changeMap",
          map: "Bedroom2",
          x: utils.withGrid(5),
          y: utils.withGrid(10),
          direction: "up"
        }],
      }, ],
      [utils.asGridCoord(6, 12)]: [{
          events: [{
            type: "changeMap",
            map: "Street2",
            x: utils.withGrid(5),
            y: utils.withGrid(10),
            direction: "down"
          }],
        },

      ],





      // [utils.asGridCoord(6,12)]: [
      //   {

      //     events: [
      //       [
      //       { who: "npcA", type: "walk",  direction: "right" },
      //       { who: "npcA", type: "walk",  direction: "right" },
      //       { who: "npcA", type: "walk",  direction: "down", time: 500 },
      //       { who: "npcA", type: "walk",  direction: "down", time: 500 },

      //       { type: "textMessage", text:"Your Not Ready Yet!!", faceHero: "npcA" },
      //       { type: "textMessage", text:"Come talk to me", faceHero: "npcA" },
      //       { who: "npcA", type: "walk",  direction: "up" },
      //       { who: "npcA", type: "walk",  direction: "up" },
      //       { who: "npcA", type: "walk",  direction: "left" },
      //       { who: "npcA", type: "walk",  direction: "left" },
      //       { who: "hero", type: "walk",  direction: "up" },
      //       { who: "hero", type: "walk",  direction: "up" },


      //       ]
      //     ]
      //   }
      // ]
    }
  },
  Bedroom2: {
    id: "Bedroom2",
    lowerSrc: "images/maps/BedroomLower.png",
    upperSrc: "images/maps/BedroomUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "images/characters/people/npc2.png",
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: 800
          },
          {
            type: "stand",
            direction: "up",
            time: 800
          },
          {
            type: "stand",
            direction: "right",
            time: 1200
          },
          {
            type: "stand",
            direction: "up",
            time: 300
          },
        ],
        talking: [{
            required: "TALKED_TO_SIS",
            events: [{
                type: "textMessage",
                text: "Go meet mom!",
                faceHero: "npcA"
              },

            ]

          },
          {
            events: [{
                type: "textMessage",
                text: "RECEIVED: 1x Sandalmander",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Here take this!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "Moms calling you!",
                faceHero: "npcA"
              },
              {
                type: "textMessage",
                text: "She is in the next room",
                faceHero: "npcA"
              },
              {
                type: "addStoryFlag",
                flag: "TALKED_TO_SIS"
              }

              // { type: "textMessage", text: "Go away!"},
              //{ who: "hero", type: "walk",  direction: "up" },
            ]
          }
        ]
      }),
      Computer: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(4),
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You turn on your computer",
            },
            {
              type: "textMessage",
              text: "You check your email:",
            },
            {
              type: "textMessage",
              text: "HAPPY BIRTHDAY, KARNX!!! - from mom",
            },
            {
              type: "textMessage",
              text: "ayy bro turning 13!! - from homie",
            },
            {
              type: "textMessage",
              text: "Hello, karnx. Happy birthday. Your mom must have asked you to meet me. ill be in the UpperStreet - lab ",
            },
            {
              type: "textMessage",
              text: "-Dr. Kumar",
            },
            {
              type: "addStoryFlag",
              flag: "CHECKED_EMAIL"
            }
            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

      Cabinet: new Person({
        x: utils.withGrid(2),
        y: utils.withGrid(4),
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bookshelf",
            },
            {
              type: "textMessage",
              text: "It is full of books",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),
      Cabinet2: new Person({
        x: utils.withGrid(3),
        y: utils.withGrid(4),
        src: "images/characters/empty.png",
        talking: [{
          events: [{
              type: "textMessage",
              text: "You see your bookshelf",
            },
            {
              type: "textMessage",
              text: "It is full of books",
            },


            // { type: "textMessage", text: "Go away!"},
            //{ who: "hero", type: "walk",  direction: "up" },
          ]
        }]
      }),

    },
    walls: {
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(10, 3)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(12, 3)]: true,
      [utils.asGridCoord(13, 4)]: true,
      [utils.asGridCoord(13, 5)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(13, 7)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(12, 10)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
    },
    cutsceneSpaces: {

      [utils.asGridCoord(5, 10)]: [{
        events: [{
          type: "changeMap",
          map: "LivingRoom2",
          x: utils.withGrid(7),
          y: utils.withGrid(2),
          direction: "down"
        }]
      }]
    }

  },
  Shop: {
    id: "Shop",
    lowerSrc: "images/maps/CoffeeShopLower.png",
    upperSrc: "images/maps/CoffeeShopUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(12),
      }),
      kumar: new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [
          {
            required:["TalkedToKumar"],
            events: [
              {type:"textMessage", text:"Talk to him to start the battle"}


            ]

          },
          
          {
          events: [
            {type:"textMessage", text:"Hi! This is (rival)"},
            {who:"rival", type:"walk", direction:"down"},
            {type:"textMessage", text:"Hi!"},
            {who:"rival", type:"stand", direction:"left"},
       
            {who:"hero", type:"stand", direction:"right"},
            {type:"textMessage", text:"YOU: Hello."},
            {type:"textMessage", text:"You must have already got a second pokemon, right?"},
            {type:"textMessage", text:"YOU: Yeah."},
            {type:"textMessage", text:"How about we battle now?"},
            {type:"textMessage", text:"YOU: Sure"},
            {who:"hero", type:"stand", direction:"up"},
            {type:"textMessage", text:"Just go talk to him to start the battle"},
            {who:"rival", type:"walk", direction:"up"},
            {who:"rival", type:"stand", direction:"down"},
            {type:"addStoryFlag", flag:"TalkedToKumar"},
          ]
        },
        
      
      ],
        behaviorLoop: [
        ]
      }),
      rival: new Person({
        x: utils.withGrid(6),
        y: utils.withGrid(9),
        src: "images/characters/people/npc2.png",
        talking: [{ 
          events: [
            {type:"textMessage", text:"You're cooked."},
            {type:"battle", enemyId:"rival"},
            {type:"addStoryFlag", flag:"BeatRival"},{type:"textMessage", text:"That was sick!!"},
            {type:"textMessage", text:"Alright ill be going now.."},
            {who:"hero", type:"stand", direction:"up"},
            {type:"textMessage", text:"yeah ill also be going now."},
            {type:"changeMap",
              map:"Shop2",
              x:utils.withGrid(6),
              y:utils.withGrid(10), 
              direction:"down"}
          ]
        }],
        behaviorLoop: []
      }),
      shopkeeper: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(5),
        src: "images/characters/people/npc4.png",
        talking: [{ 
          events: [
           {type:"textMessage", text:"Hello!", faceHero:"shopkeeper"},
           {type:"textMessage", text:"Welcome to Coffee Cavern!", faceHero:"shopkeeper"}
          ]
        }
        
      
      ],
        behaviorLoop: [
          {who:"shopkeeper",type:"stand", direction:"down", time:"2"},
        ]
      }),


    },
    walls: {    
      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true, 
      [utils.asGridCoord(1, 12)]: true,

      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 3)]: true,

      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(10, 3)]: true,

      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(11, 11)]: true,

      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(6, 12)]: true,

      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(2, 5)]: true,   
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,
    
      [utils.asGridCoord(2  , 8)]: true,
      [utils.asGridCoord(3  , 8)]: true,
      [utils.asGridCoord(4  , 8)]: true,


      [utils.asGridCoord(7  , 8)]: true,
      [utils.asGridCoord(8  , 8)]: true,
      [utils.asGridCoord(9  , 8)]: true,

      [utils.asGridCoord(2  , 10)]: true,
      [utils.asGridCoord(3  , 10)]: true,
      [utils.asGridCoord(4  , 10)]: true,

      [utils.asGridCoord(7  , 10)]: true,
      [utils.asGridCoord(8  , 10)]: true,
      [utils.asGridCoord(9  , 10)]: true,

      [utils.asGridCoord(5 , 12)]: true,
    },


    cutsceneSpaces: {



      [utils.asGridCoord(5, 12)]: [{
        events: [{
          type: "changeMap",
          map: "Street2",
          x: utils.withGrid(29),
          y: utils.withGrid(9),
          direction: "down"
        }]
      }]
    }
  },
  Shop2: {
    id: "Shop2",
    lowerSrc: "images/maps/CoffeeShopLower.png",
    upperSrc: "images/maps/CoffeeShopUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(12),
      }),
      shopkeeper: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(5),
        src: "images/characters/people/npc4.png",
        talking: [{ 
          events: [
           {type:"textMessage", text:"Hello!", faceHero:"shopkeeper"},
           {type:"textMessage", text:"Welcome to Coffee Cavern!", faceHero:"shopkeeper"}
          ]
        }
        
      
      ],
        behaviorLoop: [
          {who:"shopkeeper",type:"stand", direction:"down", time:"2"},
        ]
      }),
      
        
      
     

    },
    walls: {    
      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true, 
      [utils.asGridCoord(1, 12)]: true,

      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 3)]: true,

      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(10, 3)]: true,


      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(2, 5)]: true,   
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(11, 11)]: true,

      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(6, 12)]: true,

      [utils.asGridCoord(2  , 8)]: true,
      [utils.asGridCoord(3  , 8)]: true,
      [utils.asGridCoord(4  , 8)]: true,


      [utils.asGridCoord(7  , 8)]: true,
      [utils.asGridCoord(8  , 8)]: true,
      [utils.asGridCoord(9  , 8)]: true,

      [utils.asGridCoord(2  , 10)]: true,
      [utils.asGridCoord(3  , 10)]: true,
      [utils.asGridCoord(4  , 10)]: true,

      [utils.asGridCoord(7  , 10)]: true,
      [utils.asGridCoord(8  , 10)]: true,
      [utils.asGridCoord(9  , 10)]: true,

      [utils.asGridCoord(5 , 12)]: true,
    },

    cutsceneSpaces: {



      [utils.asGridCoord(5, 12)]: [{
        events: [{
          type: "changeMap",
          map: "Street3",
          x: utils.withGrid(29),
          y: utils.withGrid(9),
          direction: "down"
        }]
      }]
    }
  },
  Street3: {
    id: "Street3",
    lowerSrc: "images/maps/StreetLower.png",
    upperSrc: "images/maps/StreetUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(21),
        y: utils.withGrid(9),
      }),
      npcB: new Person({
        x: utils.withGrid(22),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [
            {
              required:["BEATR1"],
              events: [
              {type: "textMessage", text:"NAH ID WIN"}


              ]

            },
          {
          events: [{
              type: "textMessage",
              text: "HEY!",
              faceHero: "npcB"
            },
            {
              type: "textMessage",
              text: "Lets fight!!",
              faceHero: "npcB"
            },
            {
              type:"battle",
              enemyId:"r1"
            },
            {type:"addStoryFlag", flag:"BEATR1"}

          ]
        }],
        behaviorLoop: [{
            type: "stand",
            direction: "left",
            time: "2000"
          },
          {
            type: "stand",
            direction: "right",
            time: "200"
          },
          {
            type: "stand",
            direction: "left",
            time: "400"
          },
          {
            type: "stand",
            direction: "right",
            time: "2500"
          },
        ]
      }),
      
    },
    walls: {
      [utils.asGridCoord(4, 9)]: true,
      [utils.asGridCoord(6, 9)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(12, 9)]: true,

      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(15, 7)]: true,
      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(17, 7)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(19, 7)]: true,
      [utils.asGridCoord(20, 7)]: true,
      [utils.asGridCoord(21, 7)]: true,
      [utils.asGridCoord(22, 7)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(24, 7)]: true,
      [utils.asGridCoord(24, 6)]: true,
      [utils.asGridCoord(24, 5)]: true,
      [utils.asGridCoord(24, 4)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(26, 5)]: true,
      [utils.asGridCoord(26, 6)]: true,
      [utils.asGridCoord(26, 7)]: true,
      [utils.asGridCoord(27, 7)]: true,

      [utils.asGridCoord(28, 8)]: true,
      [utils.asGridCoord(28, 9)]: true,
      [utils.asGridCoord(30, 9)]: true,
      [utils.asGridCoord(31, 9)]: true,
      [utils.asGridCoord(32, 9)]: true,
      [utils.asGridCoord(33, 9)]: true,
      [utils.asGridCoord(34, 9)]: true,

      [utils.asGridCoord(34, 10)]: true,
      [utils.asGridCoord(34, 11)]: true,
      [utils.asGridCoord(34, 12)]: true,

      [utils.asGridCoord(33, 13)]: true,
      [utils.asGridCoord(32, 13)]: true,
      [utils.asGridCoord(31, 13)]: true,
      [utils.asGridCoord(30, 13)]: true,
      [utils.asGridCoord(29, 13)]: true,
      [utils.asGridCoord(28, 13)]: true,
      [utils.asGridCoord(27, 13)]: true,
      [utils.asGridCoord(26, 13)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,
      [utils.asGridCoord(23, 13)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(21, 13)]: true,
      [utils.asGridCoord(20, 13)]: true,
      [utils.asGridCoord(19, 13)]: true,
      [utils.asGridCoord(18, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(15, 13)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(12, 13)]: true,
      [utils.asGridCoord(11, 13)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(8, 13)]: true,
      [utils.asGridCoord(7, 13)]: true,
      [utils.asGridCoord(6, 13)]: true,
      [utils.asGridCoord(5, 13)]: true,
      [utils.asGridCoord(4, 13)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(2, 13)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(3, 9)]: true,
      [utils.asGridCoord(3, 8)]: true,

      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(17, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(17, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(17, 11)]: true,

      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(19, 11)]: true,

      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(26, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(26, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(26, 11)]: true,
    },

    cutsceneSpaces: {
      [utils.asGridCoord(5, 9)]: [{
        events: [
          {type: "textMessage", text:"You aint supposed to be here"},
          {who: "hero",type: "walk", direction:"down", time:"100"},
          {who: "hero",type: "walk", direction:"down", time:"100"},
          {type: "textMessage", text:"Go to the lab?"},
        ]
      }],
      [utils.asGridCoord(25, 5)]: [{
        events: [
         {
          type:"changeMap",
          map:"StreetNorth3",
          x: utils.withGrid(7),
          y: utils.withGrid(15),
         }
        ]
      }],
      [utils.asGridCoord(29, 9)]: [{
        events: [
         {
          type:"changeMap",
          map:"Shop2",
          x: utils.withGrid(5),
          y: utils.withGrid(12),
          direction: "up"
         }
        ]
      }]
    }
  },
  StreetNorth3: {
    id: "StreetNorth3",
    lowerSrc: "images/maps/StreetNorthLower.png",
    upperSrc: "images/maps/StreetNorthUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(9),
      }),
      npcrandom3: new Person ({
        x: utils.withGrid(3),
        y: utils.withGrid(9),
        src: "images/characters/people/npc7.png",
        talking: [
          {
            required:["JEFFDOWN"],
            events: [
              {type:"textMessage", text:"YOU'RE HACKING"}

            ]
          },
          {
            events: [
              {type:"textMessage", text:"HEY!", faceHero:"npcrandom3"},
              {type:"textMessage", text:"LOOK AT MY POKEMON!", faceHero:"npcrandom3"},
              {type:"textMessage", text:"I BET ITS BETTER THAN YOURS!", faceHero:"npcrandom3"},
              {type:"battle", enemyId:"random3"},
              {type: "addStoryFlag", flag:"JEFFDOWN"}
            ]
          }
      ],
        behaviorLoop: [
       {type:"stand", direction:"right", time:2000},
       {type:"stand", direction:"up", time:1000},
       {type:"stand", direction:"down", time:1000}, 
        ]
 
 
      }),
      pkmn: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(9),
        src: "images/characters/pizzas/c001.png",
        talking: [{
          events: [{
            type: "textMessage",
            text: "grrrr"
          }]
        }],
        behaviorLoop: [

        ]
      }),


    },
    walls: {
      [utils.asGridCoord(6, 16)]: true,
      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(2, 16)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(0, 16)]: true,

      [utils.asGridCoord(-1, 15)]: true,
      [utils.asGridCoord(-1, 14)]: true,
      [utils.asGridCoord(-1, 13)]: true,
      [utils.asGridCoord(-1, 12)]: true,
      [utils.asGridCoord(-1, 11)]: true,
      [utils.asGridCoord(-1, 10)]: true,
      [utils.asGridCoord(-1, 9)]: true,
      [utils.asGridCoord(-1, 8)]: true,
      [utils.asGridCoord(-1, 7)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,

      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(6, 5)]: true,
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(12, 6)]: true,
      [utils.asGridCoord(13, 6)]: true,
      [utils.asGridCoord(14, 6)]: true,
      [utils.asGridCoord(15, 6)]: true,

      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(16, 8)]: true,
      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(16, 12)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(16, 14)]: true,
      [utils.asGridCoord(16, 15)]: true,

      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(11, 16)]: true,
      [utils.asGridCoord(10, 16)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(8, 16)]: true,

      [utils.asGridCoord(7, 17)]: true,

      [utils.asGridCoord(6, 15)]: true,
      [utils.asGridCoord(5, 15)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(2, 15)]: true,
      [utils.asGridCoord(1, 15)]: true,

      [utils.asGridCoord(1, 14)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,

      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,

      [utils.asGridCoord(14, 7)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(14, 9)]: true,
      [utils.asGridCoord(14, 10)]: true,
      [utils.asGridCoord(14, 11)]: true,
      [utils.asGridCoord(14, 12)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(14, 14)]: true,

      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(12, 15)]: true,
      [utils.asGridCoord(11, 15)]: true,
      [utils.asGridCoord(10, 15)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(8, 15)]: true,
    },

    cutsceneSpaces: {



      [utils.asGridCoord(7, 5)]: [{
        events: [{
          type: "changeMap",
          map: "Lab2",
          x: utils.withGrid(5),
          y: utils.withGrid(12),
          direction: "up"
        }]
      }],
      [utils.asGridCoord(7, 16)]: [{
        events: [{
          type: "changeMap",
          map: "Street3",
          x: utils.withGrid(25),
          y: utils.withGrid(5),
          direction: "down"
        }]
      }]
    }
  },
  Lab2: {
    id: "Lab2",
    lowerSrc: "images/maps/LabLower.png",
    upperSrc: "images/maps/LabUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(12),
      }),
      gym: new Person ({
        src:"images/characters/people/secondBoss.png",
        x: utils.withGrid(5),
        y: utils.withGrid(5), 
        talking:[ {
        events: [
          {type:"textMessage", text:"Hello"},
          {type:"textMessage", text:"Im the gym leader here."},
          {type:"textMessage", text:"Get ready."},
          {type:"battle", enemyId:"boss"},
          {type:"textMessage", text:"Alright, the demo is over..."},
          {type:"changeMap", map:"DemoRoom", x: utils.withGrid(5), y: utils.withGrid(5), direction:"up"}
        ]}]
      }),     
      pizzaStone: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(10),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["v001", ],
      }),
      pizzaStone2: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(8),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["f001", ],
      }),
      pizzaStone3: new PizzaStone({
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        storyFlag: "USED_PIZZA_STONE",
        pizzas: ["c001", ],
      }),




    },
    walls: {
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(0, 3)]: true,

      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,

      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(10, 4)]: true,

      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(10, 6)]: true,
      [utils.asGridCoord(10, 7)]: true,
      [utils.asGridCoord(10, 8)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(10, 11)]: true,

      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(6, 12)]: true,

      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(2, 12)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(5, 13)]: true,

      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(5, 7)]: true,
      [utils.asGridCoord(6, 7)]: true,
      

      [utils.asGridCoord(4 , 9)]: true,
      [utils.asGridCoord(5 , 9)]: true,
      [utils.asGridCoord(6 , 9)]: true,
      [utils.asGridCoord(7 , 9)]: true,
      [utils.asGridCoord(8 , 9)]: true,
      [utils.asGridCoord(9 , 9)]: true,
    },

    cutsceneSpaces: {
      [utils.asGridCoord(5, 12)]: [{
        events: [{
          type: "changeMap",
          map: "StreetNorth3",
          x: utils.withGrid(7),
          y: utils.withGrid(5),
          direction: "down"
        }]
      }],

    }
  },
  
}