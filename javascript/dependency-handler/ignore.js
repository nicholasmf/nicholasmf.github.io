function StallHandler() {
    var size = 64;
    var array = [];

    this.insert = function(instruction) {
        array.push({ instruction: instruction, status: 0 });
    }
    this.wb = function(instruction) {
        let i = array.find(item => {return item.instruction === instruction && item.status === 1});
        let index = array.indexOf(i);
        if (index > -1 )
            array.splice(index, 1);
    }
    // Return array of executable instructions
    this.getExecutables = function() {
        if (!array.length) { return [null];}
        if (array.length === 1 && array[0].status === 0) {
            array[0].status = 1;
            return [array[0].instruction];
        } else {
            var first = array.find(item => { return item.status === 0 });
            if (!first) { return [null]; }
            var index = array.indexOf(first);
            for (let i = index - 1; i >= 0; i--) {
                if (checkRaW(array[i].instruction, first.instruction)) { return []; }
            }
            first.status = 1;
            return [first.instruction];
        }
    }
}

