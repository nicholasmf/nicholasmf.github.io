function AlwaysTruePredictor() {
    const pred = this;
    var array = [];

    this.predict = function(address) {
        let item = pred.search(address);
        let index = array.indexOf(item);
        array.splice(index, 1);
        return item;
    }
    this.update = function(address, target, taken) {
        array.push({ address: address, target: target });
    }
    this.render = function(container) {

    }
    this.search = function(address, target) {
        return array.find(item => {
            return item.address === address;
        });
    }
}

function AlwaysFalsePredictor() {
    this.predict = function(address) {
        return undefined;
    }
    this.update = function(address, target, taken) {

    }
    this.render = function(container) {
        
    }
}