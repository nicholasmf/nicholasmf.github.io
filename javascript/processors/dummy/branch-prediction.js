function AlwaysTruePredictor() {
    this.predict = function(instruction) {
        return instruction.params.branchTo;
    }
    this.update = function(instruction, taken) {

    }
    this.render = function(container) {

    }
}

function AlwaysFalsePredictor() {
    this.predict = function(instruction) {
        return undefined;
    }
    this.update = function(instruction, taken) {

    }
    this.render = function(container) {
        
    }
}