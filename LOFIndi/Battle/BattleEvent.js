class BattleEvent { 
    constructor(event, battle) { 
        this.event = event;
        this.battle = battle;


    }
textMessage(){

    console.log("Text Message")

}


    init(resolve){
        this[this.event.type](resolve);


    }
}