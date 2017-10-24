/// Architected register file - holds pointers to temp register ( renomeador )
function ARF() {
    var size = 64;
    var memory = [];
    var tempArraySize = simulator.tempRegisters;
    var tempArrayPos = 0;
    var tempArray = simulator.tempRegistersArray;
    var regArray = simulator.registersArray;

    // Updates a registers pointer and return new register
    this.update = function(register) {
        let i = register.index;
        let tempI = tempArray[tempArrayPos++];
        if (tempArrayPos === tempArraySize) tempArrayPos = 0;
        memory[i] = tempI;
        return tempI;
    }

    // Get correspondent of a register
    this.get = function(register) {
        let i = register.index;
        return memory[i];
    }

    // Remove temp register
    this.remove = function(register) {
        var index = -1;
        memory.forEach((item, i) => {
            if (item === register) index = i; 
        });
        if (index > -1) {
            memory[index] = undefined;
            return regArray[index];
        }
        return undefined;      
    }
}

// // Physical register file - stores data
// function PRF() {
//     var size = 256;
//     var memory = simulator.tempRegistersArray;
//     var pos = 0;

//     // Insert new register
//     this.insert = function(value) {
//         memory[pos++].set(value);
//         return pos-1;
//     }

//     // Get register of address
//     this.get = function(address) {
//         return memory[address];
//     }
// }

// Reservation Station
function RS(ins, vj, vk, qj, qk, a) {
    var busy = false;
    var Vj, Vk, Qj, Qk, A;
    var instruction;
    var executed = false;
    // Init
    busy = true;
    instruction = ins;
    Vj = vj;
    Vk = vk;
    Qj = qj;
    Qk = qk;
    A = a;

    // Update
    this.update = function(vj, vk, qj, qk, a) {
        if (vj) Vj = vj;
        if (vk) Vk = vk;
        if (qj) Qj = qj;
        if (qk) Qk = qk;
        if (a) A = a;
    }

     // Remove
     this.remove = function() {
         ins = Vj = Vk = Qj = Qk = A = undefined;
         busy = 0;
     }

     // Get instruction
     this.getInstruction = function() {
         return instruction;
     }

     // Return if is executable and is not executing (no more dependencies) 
     this.isExecutable = function() {
        if (instruction.executedCycles) return false;
        if (instruction.type === DATA_TYPES.DATA_TRANSFER) {
            return A !== undefined;
        }
        if (instruction.type === DATA_TYPES.ARITHMETIC) {
            return Vj !== undefined && Vk !== undefined;
        }
    }

     // Update fields if register is on dependences
     this.updateDependence = function(register) {
         if (Qj === register) {
             Qj = undefined;
             Vj = register.get();
         }
         if (Qk === register) {
             Qk = undefined;
             Vk = register.get();
         }
     }
}

// Reservation stations handler
/**
 * Public methods:
 *      - insert(instruction)
 *      - wb(instruction)
 *      - getExecutables()
 */ 

function RSHandler(size) {
    const stations = this;
    var size = size;
    var array = [];
    var pos = 0;
    var arf = new ARF();

    // Insert a instruction on reservation stations
    this.insert = function(instruction) {
        rename(instruction, arf);

        if (instruction.type === DATA_TYPES.ARITHMETIC) {
            let source = isObject(instruction.params.source) ? instruction.params.source : undefined;
            let source1 = isObject(instruction.params.source1) ? instruction.params.source1 : undefined;
            let source2 = isObject(instruction.params.source2) ? instruction.params.source2 : undefined;
            let s1 = (source || source1);
            
            let s1val = (isObject(instruction.params.source) ? instruction.params.source.get() : instruction.params.source) ||
                        (isObject(instruction.params.source1) ? instruction.params.source1.get() : instruction.params.source1);

            let s2val = isObject(instruction.params.source2) ? instruction.params.source2.get() : instruction.params.source2;

            array[pos++] = new RS(instruction,  s1 ? undefined : s1val, source2 ? undefined : s2val, s1, source2);
        }
        else if (instruction.type === DATA_TYPES.DATA_TRANSFER) {
            let a = instruction.params.address || instruction.params.value;
            array[pos++] = new  RS(instruction, undefined, undefined, undefined, undefined, a);
        }
    }

    // Update
    this.update = function(register) {
        array.map(rs => {
            rs.updateDependence(register);
        });
    }

    // Get rs of instruction
    this.getRS = function(instruction) {
        return array.find(rs => {
            return rs.getInstruction().cycle === instruction.cycle;
        });
    }

    // Get all instructions available for execution
    this.getExecutables = function() {
        return array.filter(rs => {
            return rs.isExecutable();
        }).map(rs => { return rs.getInstruction(); });
    }

    // Clear rs of instruction - if instruction has dest, remove from ARF and update original register
    this.wb = function(instruction) {
        let rs = stations.getRS(instruction);
        if (!rs) return;
        let dest = instruction.params.dest;
        if (isObject(dest)) {
            stations.update(dest);
            let originalRegister = arf.remove(dest);
            if (originalRegister) originalRegister.set(dest.get());
        }
    }
}

// Rename registers from instruction
function rename(instruction, arf) {
    if (!instruction.params) { return; }
    let dest = isObject(instruction.params.dest) ? instruction.params.dest : undefined;
    let source = isObject(instruction.params.source) ? instruction.params.source : undefined;
    let source1 = isObject(instruction.params.source1) ? instruction.params.source1 : undefined;
    let source2 = isObject(instruction.params.source2) ? instruction.params.source2 : undefined;
    
    if (source) {
        instruction.params.source = arf.get(source);
    }
    if (source1) {
        var temp = arf.get(source1);
        instruction.params.source1 = temp || source1.get();
    }
    if (source2) {
        var temp = arf.get(source2);
        instruction.params.source2 = temp || source2.get();
    }
    if (dest) {
        instruction.params.dest = arf.update(dest);
    }

}

// let arf = new ARF();
// RSHandler consegue receber 3 instrucoes por vez - p6
// 5 instrucoes por ciclo podem sair da reservation stations para execucao
// let rshandler = new RSHandler(256, arf);
//let datamem = new DataMemory(64);
// iSet = Test2InstructionSet;
// let i1 = iSet.ADD(T0, 1);
// let i2 = iSet.ADD(T1, T0);
// let i3 = iSet.ADD(T1, 2);
// let i4 = iSet.ADD(T2, 2);
// let b1 = iSet.BRANCH_IF_ZERO(T0, 3);
// let b2 = iSet.BRANCH_IF_ZERO(T1, 6);
// let m1 = iSet.LOAD(T0, 1);
// let m2 = iSet.LOAD(T0, 2);
// let res;
// // T0 = 7, T1 = 5, T2 = 8
// code = [
//     iSet.LOAD(T0, 3),
//     iSet.LOAD(T1, 5),
//     iSet.ADD(T2, T0, T1),
//     iSet.ADD(T0, T0, 2),
//     iSet.ADD(T0, 6, 1)
// ];

// function MiniPipe() {
//     const pipe = this;
//     var fetch, decode, load, execute, store;
//     var pc = 0, result = {}, lastResult = {}, cycle;

//     this.run = function() {
//         pc = 0;
//         result = {};
//         lastResult = {};
//         fetch = decode = load = execute = store = undefined;
//         cycle = 0;

//         // while ((!(fetch === decode === load === execute === store === null) && pc < code.length)) {
//         //     pipe.iteration();
//         //     console.log(cycle);
//         // }
//     }

//     this.iteration = function() {
//         // Fetch
//         if (pc < code.length) {
//             fetch = code[pc++];
//             fetch.cycle = cycle;
//         }
//         else fetch = undefined;

//         // Decode
//         if (decode) {
//             rename(decode, arf);
//             rshandler.insert(decode);
//         }

//         // Load

//         // Execute
//         if (execute) {
//             execute.forEach(instruction => {
//                 if (instruction.type === DATA_TYPES.ARITHMETIC) {
//                     instruction.ula = instruction.executethis();
//                 }
//                 instruction.executedCycles++;
//             });
//         }

//         // Write back
//         if (store) {
//             store.forEach(instruction => {
//                 if (instruction.type === DATA_TYPES.DATA_TRANSFER) {
//                     instruction.executethis(datamem);
//                 }
//                 if (instruction.type === DATA_TYPES.ARITHMETIC) {
//                     instruction.params.dest.set(instruction.ula);
//                 }
//                 rshandler.wb(instruction);
//                 log(instruction);
//             });
//         }

//         //console.log(fetch, decode, execute, store);

//         //lastResult = result;
//         store = execute ? execute.filter(instruction => { return instruction.latency === instruction.executedCycles; }) : execute;
//         execute = rshandler.getExecutables();
//         //execute = load;
//         //load = decode;
//         decode = fetch;
//         fetch = undefined;

//         cycle++;
//     }
// }

// let pipe = new MiniPipe();
//pipe.run();
// res = checkRaW(i1, i2);
// console.log(res);
// res = checkRaW(i2, i3);
// console.log(res);
// res = checkRaW(i3, i4);
// console.log(res);
// res = checkWaR(i2, i1);
// console.log(res);
// res = checkWaW(m1,i3);
// console.log(res);
// rename(i1, arf);
// log(i1);
// rename(b1, arf);
// log(b1);
// rename(i2, arf);
// log(i2);
// rename(m1, arf);
// log(m1);


// window.onload = function() {
//     simulator.renderRegistersBank();
//     datamem.render();
//     datamem.set(3, 3);
//     datamem.set(5, 5);
    
//     pipe.run();
// }