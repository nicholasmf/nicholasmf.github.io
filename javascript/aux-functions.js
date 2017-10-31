// check if a var is an object
function isObject(elem) {
    return (elem !== null && elem !== undefined && typeof elem === 'object');
}

// Check if var is not null and not undefined
function isNumber(item) {
    return (!isNaN(item) && item !== null);
}

// Returns value of elem - if elem is Register, calls get method; if elem is number returns itself
function getValue(elem) 
{
    if (elem !== null && elem !== undefined && typeof elem === 'object' && elem.get)
    {
        return elem.get();
    }
    else
    {
        return elem;
    }
}

// Return instruciton operands
/**
 * 
 * @param instruction
 * Returns an object with:
 * - name: name of the operand (dest, source1, address...)
 * - value: register or integer
 * - isRegister: boolean, true if operand is a register
 * - registerName: string with the name of the register, if operand is register
 */
function getOperands(instruction) {
    let retArr = [];
    if (!instruction || !instruction.params) { return []; }
    for (let property in instruction.params) {
        let value = instruction.params[property];
        let obj = {
            name: property,
            value: value,
            isRegister: isObject(value),
            registerName: isObject(value) ? value.name : undefined
        };
        retArr.push(obj);
    }
    return retArr;
}

// Returns if two instructions are true dependent (RaW)
function checkRaW(i1, i2) {
    if (!i1.params || !i2.params) { return false; }    

    let i1dest = isObject(i1.params.dest) ? i1.params.dest : {};
    let i2dest = isObject(i2.params.dest) ? i2.params.dest : {};
    let i2source0 = isObject(i2.params.source) ? i2.params.source : {};
    let i2source1 = isObject(i2.params.source1) ? i2.params.source1 : {};
    let i2source2 = isObject(i2.params.source2) ? i2.params.source2 : {};
    let i2source = i2source0.get !== undefined ? i2source0 : i2source1;
    let i2source2Exist = getValue(i2.params.source2) !== undefined;

    if ((i2.type === DATA_TYPES.ARITHMETIC && !i2source2Exist) && i1dest === i2dest) {
        return true;
    }
    if (i1dest === i2source || i1dest === i2source2) {
        return true;
    }
    return false;
}

// Returns if two instructions has anti-dependence (WaR)
function checkWaR(i1, i2) {
    if (!i1.params || !i2.params) { return false; }    

    let i1dest = isObject(i1.params.dest) ? i1.params.dest : {};
    let i2dest = isObject(i2.params.dest) ? i2.params.dest : {};
    let i1source0 = isObject(i1.params.source) ? i1.params.source : {};
    let i1source1 = isObject(i1.params.source1) ? i1.params.source1 : {};
    let i1source2 = isObject(i1.params.source2) ? i1.params.source2 : {};
    let i1source = i1source0.get !== undefined ? i1source0 : i1source1;
    let i1source2Exist = getValue(i1.params.source2) !== undefined;

    if ((i1.type === DATA_TYPES.ARITHMETIC && i1source2Exist) && i1dest === i2dest) {
        return true;
    }
    if (i1source === i2dest) {
        return true;
    }
    return false;
}

// Returns if two instructions has (WaW)
function checkWaW(i1, i2) {
    if (!i1.params || !i2.params) { return false; }    

    let i1dest = isObject(i1.params.dest) ? i1.params.dest : {};
    let i2dest = isObject(i2.params.dest) ? i2.params.dest : {};

    if (i1dest === i2dest) {
        return true;
    }
    return false;
}

// Print source and dest name
function logInstruction(instruction) {
    let dest = isObject(instruction.params.dest) ? instruction.params.dest.name : instruction.params.dest;
    let source = isObject(instruction.params.source) ? instruction.params.source.name : instruction.params.source;
    let source1 = isObject(instruction.params.source1) ? instruction.params.source1.name : instruction.params.source1;
    let source2 = isObject(instruction.params.source2) ? instruction.params.source2.name : instruction.params.source2;
    let log = "";

    if (dest) {
        log += "d: " + dest + " ";
    }
    if (source) {
        log += "s: " + source;
    }
    if (source1) {
        log += "s1: " + source1 + " ";
    }
    if (source2) {
        log += "s2: " + source2;
    }
    if (log) console.log(log);
}
