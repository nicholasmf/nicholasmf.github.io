"use strict";

/******** Pipeline steps *********
 * Fetch
 * Decode
 * Register allocation and renaming
 * microop reordering
 * execution
 * retirement
 */

function Register(name, index) {
    const register = this;
    this.value = 0;
    this.name = name;
    this.index = index;
    this.get = function() {
        return register.value;
    }
    this.set = function(value, noAnimation) {
        if (isNumber(value)) register.value = value;

        var containerName, registerName;
        if (register.name && register.name.indexOf("temp") !== -1) { 
            containerName = "tempRegistersContainer";
            registerName = register.pointedName;
        }
        else { 
            containerName = "registersContainer";
            registerName = register.name;
        }
        /****** Update render *****/
        const container = $(`#${containerName} .row`);
        let elem = container.children().eq(register.index);
        $(elem).find('.panel-body').text(register.value);
        $(elem).find('.panel-heading').text(registerName);

        if (noAnimation) { return; }
        let panel = elem.children()[0];
        $(panel).removeClass('panel-default');
        $(panel).addClass('panel-info');

        $(`#${containerName}`).animate({
            scrollTop: (113 * Math.floor(register.index / 12))
        }, 200);

        setTimeout(function() {
            $(panel).removeClass('panel-info');
            $(panel).addClass('panel-default');                
        }, 800);
    }
}

/************************ Data Memory **************************
 * get (address)
 * set (address, value)
 * render
*/
function DataMemory(size) {
    const mem = this;
    this.memoryArray = [];
    this.size = size;

    for (let i = 0; i < size; i++) {
        this.memoryArray[i] = 0;
    }

    // Returns the value on address
    this.get = function(address) {
        if (address < 0 || address >= mem.size) { return undefined; }
        return mem.memoryArray[address];
    }

    // Set the value on address
    this.set = function(address, value, noAnimation) {
        if (address < 0 || address >= mem.size) { return undefined; }
        mem.memoryArray[address] = value;

        // Updates HTML
        let table = $("#dataMemory tbody");
        let col = table.find('td').eq(address);
        col.text(value);

        if (noAnimation) { return; }
        table.animate({
            scrollTop: 0
        }, 200);
        col.addClass("info");
        setTimeout(function() {
            col.removeClass("info");
        }, 800)
    }

    // Renders the HTML table
    this.render = function() {
        let table = $("#dataMemory tbody");
        let row = null;
        mem.memoryArray.map((item, i) => {
            if (i % 10 === 0) {
                let rowI = i / 10;
                if (row) {
                    table.append(row);
                }
                row = $("<tr></tr>");
                let colI = $(`<th>${rowI}</th>`);
                row.append(colI);
            }
            let col = $(`<td>${item}</td>`);
            row.append(col);
        });
        table.append(row);
    }

    // Clear - set 0 for all addressess
    this.clear = function() {
        for (let i = 0; i < size; i++) {
            this.set(i, 0, true);
        }
    }
}

function Simulator() {
    const sim = this;
    var execution;
    
    this.registers = 64;
    this.tempRegisters = 256;

    this.registersArray = [];
    this.tempRegistersArray = [];
    for (let i = 0; i < this.registers; i++) {
        var name = "";
        if (i < 16) {
            name = `T${i}`;
        }
        this.registersArray[i] = new Register(name, i);
    }
    for (let i = 0; i < this.tempRegisters; i++) {
        this.tempRegistersArray[i] = new Register("temp"+i, i);
    }
	
    this.DataMemory = new DataMemory(64);
    /********* Simulator params
     * registers: number of registers available
     * tempRegisters: number of temporary registers available
     */
    // this.init = function(params) {
    //     this.registers = params.registers || 64;
    //     this.tempRegisters = params.registers || 256;

    //     this.registersArray = new Array(this.registers);
    //     this.tempRegistersArray = new Array(this.tempRegisters);

    //     this.renderRegistersBank();
    // }

    window.onload = function() {
        sim.renderRegistersBank();
        sim.DataMemory.render();
    };

    /******************** Clear lists, pipeline and memory *****************/
    this.clear = function() {
		var pipeline = document.getElementsByClassName("pipeline")[0];
		var instructions = document.getElementById("instructions");
		var finalList = document.getElementById("finalList");
		if(execution) {
			clearInterval(execution);
			pipeline.innerHTML = "";
			instructions.innerHTML = "";
			finalList.innerHTML = "";
			//$(pipeline).html("");
			//$(".pipeline").html("");
        }
        

        for (let i = 0; i < this.registers; i++) {
            this.registersArray[i].set(0, true);
        }
        for (let i = 0; i < this.tempRegisters; i++) {
            this.tempRegistersArray[i].set(0, true);
        }
        sim.DataMemory.clear();
    }

    this.resume = function() {
        if (sim.timeInterval) {
            execution = setInterval(sim.cicle , sim.timeInterval * 1000);
        }
    }

    this.stop = function() {
        if (execution) {
            clearInterval(execution);
        }
    }

    this.nextStep = function() {
//		console.log(sim.branchPredictor);
        sim.cicle();
    }

    this.setTimeInterval = function(value) {
        sim.timeInterval = value;
    }

    this.setBP = function(bp) {
        if (bp)
            sim.branchPredictor = bp;
    }

    this.setDependencyHandler = function(dh) {
        if (dh) { sim.dependencyHandler = dh; }
    }

    this.run = function(instructionSet, instructions, architecture) {
        if (!instructionSet || !instructions) { return; }

        sim.instructionSet = instructionSet;
        sim.instructions = instructions;
        sim.architecture = architecture;
        architecture.init(sim.DataMemory);
		
        // Render
        var instructionsList = document.getElementById("instructions");
        instructions.map((instruction) => {//create visible instruction list
            var newItem = document.createElement('li');
			var instructionOperands = getOperands(instruction);
			var instructionOperandsString = ' (';
			for(let i=0; i<instructionOperands.length; i++)
			{
				if(instructionOperands[i].isRegister)
				{
					instructionOperandsString = instructionOperandsString + instructionOperands[i].value.name;
				}
				else
				{
					instructionOperandsString = instructionOperandsString + instructionOperands[i].value;
				}
				if(i != instructionOperands.length - 1)
				{
					instructionOperandsString = instructionOperandsString + ', ';
				}
			}
			instructionOperandsString = instructionOperandsString + ')';
            newItem.textContent = (instruction.address + '.' + instruction.name + instructionOperandsString);
            newItem.className = 'list-group-item';
            instructionsList.appendChild(newItem);
        });
        if (sim.branchPredictor) 
			sim.branchPredictor.render ($("#cacheContainer"));
        
        // Execute
//       console.log(sim.architecture.name);

        sim.cicle = function() {   
			
			//sim.architecture.p5Arq(instructions, execution);
			sim.architecture.pipeLoop(instructions, execution, sim.branchPredictor, sim.dependencyHandler);
			
			//console.log("gDI: " + sim.architecture.getDecodeInstruction().name);
			//console.log("pc: " + pc + " LR: " + sim.fillNoop);            
        };
		if (sim.timeInterval) {
			execution = setInterval(sim.cicle , sim.timeInterval * 1000);
        }
    }

    this.renderRegistersBank = function() {
        const container = $("#registersContainer");
        const row = $("<div class='row'></div>");
        const col = $("<div class='col-xs-1'></div>");
        const tempContainer = $("#tempRegistersContainer");
        const tempRow = $("<div class='row'></div>");
        const tempCol = $("<div class='col-xs-1'></div>");
    
        container.empty();

        for (let i = 0; i < sim.registers; i++) {
            let register = sim.registersArray[i];
            let newCol = col.clone();
            let name = register.name ? ("$" + register.name) : i;
            let panel = $(`<div class='panel panel-default'><div class='panel-heading'>${name}</div><div class='panel-body'>${register.get()}</div></div>`)
            newCol.append(panel);
            row.append(newCol);
        }
        container.append(row);

        tempContainer.empty();
        for (let i = 0; i < sim.tempRegisters; i++) {
            let register = sim.tempRegistersArray[i];
            let newCol = col.clone();
            let name = register.pointedName ? ("$" + register.pointedName) : i;
            let panel = $(`<div class='panel panel-default'><div class='panel-heading'>${name}</div><div class='panel-body'>${register.get()}</div></div>`)
            newCol.append(panel);
            tempRow.append(newCol);
        }
        tempContainer.append(tempRow);
    }
}