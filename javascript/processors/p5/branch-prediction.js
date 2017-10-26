// Branch Target Buffer
function BTB() {
    this.cache = new associativeCache(8, 2);
    
    // target address if predict to be taken, undefined otherwise
    this.predict = function(address) {
        let entry = this.cache.search(address);
        if (entry && entry.history > 1) {
            return entry.value;
        }
        else {
            return undefined;
        }
    }

    // update entry on BTB
    this.update = function(address, target, taken) {
        let entry = this.cache.search(address);
        if (entry) {
            let history = entry.history;
            if (taken) {
                if (history === 0) {
                    this.cache.update(address, {history: 3});
                }
                else if (history < 3) {
                    this.cache.update(address, {history: history + 1});
                }
            }
            else {
                if (history > 0) {
                    this.cache.update(address, {history: history - 1});
                }
            }
        }
        else {
			if(taken)
				this.cache.insert(address, target, taken ? 3 : 0);
        }
    }

    // Render BTB
    this.render = function(container) {
        this.cache.render(container);
    }
};


/******** testing BTB *********/
// let predictor = new BTB();
// var instruction = {address: 3, params: { branchTo: 9} };
// console.log(predictor.predict(instruction));
// predictor.update(instruction, true);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, true);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, true);
// console.log(predictor.predict(instruction));
// predictor.update(instruction, false);
// console.log(predictor.predict(instruction));
