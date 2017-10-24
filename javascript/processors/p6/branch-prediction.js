// Pattern History Table
function PatterHistoryTable(n) {
    const pht = this;
    var n = n;
    var size = Math.pow(2, n);
    var array = [];
    var history = 0;

    for (let i = 0; i < size; i++) {
        array[i] = 0;
    }

    // Updates the history table
    this.update = function(taken) {
        let value = array[history];
        if (taken && value < 3) {
            array[history]++;
        }
        else if (!taken && value > 0) {
            array[history]--;
        }
        history = Math.floor((history * 2) % size) + (taken ? 1 : 0);
    }

    // Get actual prediction
    this.get = function() {
        return array[history];
    }
}

// BTB for PPMX, PPro, P2, P3
function AdaptivePredictorBTB() {
    const btb = this;
    var size = 8;
    var ways = 2;
    var sets = size/ways;
    var phtBits = 3;
    this.cache = new associativeCache(size, ways);

    // target address if predict to be taken, undefined otherwise
    this.predict = function(instruction) {
        let entry = btb.cache.search(instruction.address);
        if (entry && entry.getHistory() > 1) {
            return entry.value;
        }
        else {
            return undefined;
        }
    }


    // update entry on BTB
    this.update = function(instruction, taken) {
        let address = instruction.address;
        let target = instruction.params.branchTo;
        let entry = this.cache.search(address);
        if (entry) {
            entry.history.update(taken);
            // Visual update
            this.cache.update(address);
        }
        else {
            this.cache.insert(address, target, new PatterHistoryTable(phtBits));
        }
    }

    // Render BTB
    this.render = function(container) {
        this.cache.render(container);
    }
}


/******** testing BTB *********/
// var predictor;
// window.onload = function() {
// predictor = new AdaptivePredictorBTB();
// predictor.render($("#cacheContainer"));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, true);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// predictor.update(3, 9, false);
// console.log(predictor.predict(3));
// }