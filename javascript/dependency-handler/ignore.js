function StallHandler() {
    var size = 64;
    var array = [];

    this.insert = function(instruction) {
        let found = array.find(item => {return item.instruction === instruction});
        if (found) { return; }
        array.push({ instruction: instruction, status: 0 });
        return true;
    }
    // Return array of up to n executable instructions
    this.getExecutables = function(n) {
        let count = 0, retArr = [];
        if (!array.length) { return [null];}
        if (array.length === 1 && array[0].status === 0) {
            array[0].status = 1;
            return [array[0].instruction];
        } else {
            var available = array.filter(item => { return item.status === 0 });
            if (!available) { return [null]; }
            available.map(item => {
                let index = array.indexOf(item);
                for (let i = index - 1; i >= 0; i--) {
                    if (checkRaW(array[i].instruction, item.instruction)) { return; }
                }
                retArr.push(item.instruction);
                item.status = 1;
            });

            return retArr;
        }
    }
    this.execute = function(instruction) {
        
    }
    this.wb = function(instruction) {
        let i = array.find(item => {return item.instruction === instruction && item.status === 1});
        let index = array.indexOf(i);
        if (index > -1 )
            array.splice(index, 1);
        return true;
    }
    this.remove = function(instruction) {
        let i = array.find(item => {return item.instruction === instruction});
        let index = array.indexOf(i);
        if (index > -1 )
            array.splice(index, 1);
        return true;        
    }
}

