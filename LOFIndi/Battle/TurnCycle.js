class TurnCycle {
    constructor({
        battle,
        onNewEvent
    }) {
        this.battle = battle;
        this.onNewEvent = onNewEvent;
        this.currentTeam = "player";

    }

    async turn() {



    }

    async init() {
        await this.onNewEvent({
            type: "textMessage",
            text: "Battle Starts..."


        })


        this.turn();
    }


}