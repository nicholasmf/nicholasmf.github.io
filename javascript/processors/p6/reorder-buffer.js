function ReorderBuffer(size) {
    function InstructionStatus(instruction) {
        this.instruction = instruction;
        this.executed = false;
    }

    var properties = {
        size: size,
        array: []
    };

    this.get = function(name) {
        return properties[name];
    }

    this.set = function(name, value) {
        properties[name] = value;
    }

    this.insert = function(elem) {
        let array = this.get('array');
        let found = array.find(item => { return item.instruction === elem });
        if (!found) array.push(new InstructionStatus(elem));
    }

    this.insertArray = function(array) {
        const self = this;
        array.map(item => {
            self.insert(item);
        });
    }

    this.remove = function(elem) {
        let array = this.get('array');
        let index = array.indexOf(elem);
        if (index === -1) { return undefined; }
        else {
            return array.splice(index, 1).instruction;
        }
    }

    this.removeArray = function(instructions) {
        const self = this;
        let array = this.get('array');

        instructions.forEach(instruction => {
            if (instruction.executeMe) { return; }
            let found = array.find(elem => { return elem.instruction === instruction});
            if (found) console.log('found', found);
            else { console.log ('not found'); }
            if (found) self.remove(found);
        });
    }

    this.removeFirstN = function(n) {
        const self = this;
        let ordered = this.get('array').sort((a, b) => { return a.instruction.entryOrder - b.instruction.entryOrder });
        ordered = ordered.slice(0, ordered.length);
        
        for (let i = 0; i < n; i++) {
            self.remove(ordered[i]);
        }
    }

    this.getFirstN = function(n) {
        let ordered = this.get('array').sort((a, b) => { return a.instruction.entryOrder - b.instruction.entryOrder });
        return ordered.slice(0, n).map(item => { return item.instruction; });
    }
}