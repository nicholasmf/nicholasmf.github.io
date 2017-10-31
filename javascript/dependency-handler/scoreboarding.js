function ScoreboardUnit(instruction, qj, qk) {
    this.instruction = instruction;
    var qj = qj,
        qk = qk,
        rj = qj ? qj.ready === false : true,
        rk = qk ? qk.ready === false : true;

    this.isExecutable = function() {
//        console.log(rj && rk, rj, rk);
        return (rj && rk);
    }

    this.updateQ = function(item) {
//        console.log(qj, qk, item);
        if (qj === item) { rj = true; }
        if (qk === item) { rk = true; }
    }

    this.updateR = function() {
        rj = false;
        rk = false;
    }

    this.isReading = function(register) {
        return rj === register || rk === register;
    }
}

function Scoreboard(registersCount) {
    var size = registersCount;
    var scoreboard = [];
    var waitingWrite = [];

    this.insert = function(instruction) {
        if (!instruction.params) { return true; }
        let found = scoreboard.find(item => { return item.instruction === instruction; });
        if (found) { return false; }        
        let dest = isObject(instruction.params.dest) ? instruction.params.dest : undefined;
        let index = dest ? dest.index : undefined;
        if (isNumber(index) && waitingWrite[index]) { return false; }
        else {
            let wsIndex0 = isObject(instruction.params.source) ? instruction.params.source.index : undefined;
            let wsIndex1 = isObject(instruction.params.source1) ? instruction.params.source1.index1 : undefined;
            let wsIndex2 = isObject(instruction.params.source2) ? instruction.params.source2.index2 : undefined;
            
            let waitSource0 = isNumber(wsIndex0) ? waitingWrite[wsIndex0] : undefined;
            let waitSource1 = isNumber(wsIndex1) ? waitingWrite[wsIndex1] : undefined;
            let ws1 = isNumber(wsIndex0) ? waitSource0 : waitSource1;
            
            let waitSource2 = isObject(instruction.params.source2) ? waitingWrite[instruction.params.source2.index] : undefined;
            let newUnit = new ScoreboardUnit(instruction, ws1, waitSource2);
            scoreboard.push(newUnit);
            if (isNumber(index)) {
                waitingWrite[index] = { ready: true };
            }
            return true;
        }
    }
    // Get up to n executable instructions
    this.getExecutables = function(n) {
        let count = 0;
        if (scoreboard.length === 0) { return [null]; }
        return scoreboard.filter(item => {
            if (item.isExecutable() && count < n) { 
                count++;
                item.updateR();
                return true;
            }
            return false;
        }).map(item => { return item.instruction; });
    }
    this.execute = function(instruction) {

    }
    this.wb = function(instruction) {
        if (!instruction.params) { return true; }
        let dest = instruction.params.dest;
        let index = dest ? dest.index : undefined;
        let thisItem = scoreboard.find(item => { return item.instruction === instruction; });
        if (!thisItem) { console.error("Item do scoreboard foi perdido"); return true; }
        let thisIndex = scoreboard.indexOf(thisItem);

        // let waitingRead = scoreboard.find(item => {
        //     isReading(dest);
        // });

        if (isNumber(index)) {
            scoreboard.map(item => {
                item.updateQ(waitingWrite[index]);
            });
        }
        if (thisIndex > -1) {
            let removedItem  = scoreboard.splice(thisIndex, 1);
        }

        if (isNumber(index)) {
            waitingWrite[index] = undefined;
        }

        return true;
    }
    this.remove = function(instruction) {
        if (!instruction.params) { return true; }
        let dest = isObject(instruction.params.dest) ? instruction.params.dest : undefined;
        let index = dest ? dest.index : undefined;
        let thisItem = scoreboard.find(item => { return item.instruction === instruction; });
        if (!thisItem) { return true; }
        let thisIndex = scoreboard.indexOf(thisItem);

        // let waitingRead = scoreboard.find(item => {
        //     item.isReading(dest);
        // });

        if (thisIndex > -1) {
            let removedItem = scoreboard.splice(thisIndex, 1);
        }

        if (isNumber(index)) {
            waitingWrite[index] = undefined;
        }

        return true;        
    }
}