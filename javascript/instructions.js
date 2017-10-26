const DATA_TYPES = {
    DATA_TRANSFER: "Data transfer",
    ARITHMETIC: "Arithmetic",
    CONTROL: "Logical and program control",
	DIVISIBLE: "Test uops division"
}

function InstructionSet() {
	
}

function Instruction (name, type, MicroInstruction, params, executableInV, executethis) {
    this.name = name;
    this.type = type;
    this.MicroInstruction = MicroInstruction;
    this.params = params;
	this.executableInV = executableInV;
    this.executethis = executethis;
    this.latency = 1;
    this.executedCycles = 0;
	this.executeMe = true;

    if(type === DATA_TYPES.CONTROL)
    {//se a instrucao for do tipo controle, ela tera um metodo especial que retorna o endereco de destino
        var instruction = this;
        this.getTargetAddr = function() 
        {
            return instruction.params.branchTo;
        }
    }

    // returns a new object with the same properties
    this.copy = function() {
        var newIns = new Instruction();
        for (var prop in this) {
            if (prop === "params") {
                newIns.params = {};
                for (let param in this.params) {
                    newIns.params[param] = this.params[param];
                }
            }
            else {
                newIns[prop] = this[prop];
            }
        }
        return newIns;
    }
}

function MicroInstruction (name, type, params) {
    this.name = name;
    this.type = type;
    if (params) {
        this.branchResult = params.branchResult;
        this.branchTo = params.branchTo;
    }
}
