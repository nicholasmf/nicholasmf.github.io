function StallHandler() {
    var size = 64;
    var array = [];

    this.insert = function(instruction) {
        array.push({ instruction: instruction, status: 0 });
        return true;
    }
    // Return array of up to n executable instructions
    this.getExecutables = function(n) {
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
    this.wb = function(instruction) {
        let i = array.find(item => {return item.instruction === instruction && item.status === 1});
        let index = array.indexOf(i);
        if (index > -1 )
            array.splice(index, 1);
        return true;
    }
    this.remove = function(instruction) {
        let i = array.find(item => {return item.instruction === instruction && item.status === 1});
        let index = array.indexOf(i);
        if (index > -1 )
            array.splice(index, 1);
        return true;        
    }
}

