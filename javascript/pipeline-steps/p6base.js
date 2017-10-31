function P6PipelineStep(stepName, stepExecution, params) {
	
    const pipeStep = this;
    const name = stepName;
    this.execution = stepExecution;
    this.count = 0;
    var maxSize = params.maxSize || 3;

	var instructions = [];
    for (let property in params) {
        // Handle each property of params
        this[property] = params[property];
    }
	
	
	this.getStepInstructions = function()
	{
		return instructions;
	}

	this.setStepInstruction = function(newInstructions)
	{
        if (!newInstructions) { return; }
        if (newInstructions.length === undefined) {
            instructions.push(newInstructions);            
        }
        else {
            newInstructions.map(item => {
                instructions.push(item);
            });
        }
	}

	this.setStepInstructionsCycle = function(cycle)
	{
        instructions.map(item => {
            if (!item.cycle) {
                item.cycle = cycle;
            }
        });
	}

    this.isEmpty = function() {
        return instructions.length === 0;
    }

    this.remove = function(instruction) {
        let index = instructions.indexOf(instruction);
        if (index > -1) {
            instructions.splice(index, 1);
        }
    }

    this.disableInstructions = function(start) {
        instructions.map(instruction => {
            if (!isNumber(start) || (isNumber(start) && instruction.entryOrder > start)) {
                instruction.executeMe = false;
                var elem;
                if (instruction.name === "NoOp") {
                    elem = pipeStep.containerPipeline.children(`.noop-${instruction.cycle}`);
                }
                else {
                    elem = pipeStep.containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
                }
                elem.removeClass('background-info');
                elem.addClass('background-disabled');
            }
        });
    }

    // Remove instructions from dependency handler
    this.removeFromDH = function(dh) {
        instructions.map(instruction => {
            if (!instruction.executeMe) dh.remove(instruction);
        })
    }

    // Return n first instructions according to filter
    this.getNInstructions = function(n, filter) {
        let count = 0;
        let ins = instructions.filter(instruction => {
            let ret = ((!isNumber(n) || count < n) && 
                (!filter || (filter && filter(instruction))));
            if (ret) { count++; }
            return ret;
        });
        ins.map(instruction => {
            let index = instructions.indexOf(instruction);
            instructions.splice(index, 1);
        });
        return ins;
    }

    // Return number of instructions till max size
    this.missingInstructions = function() {
        return maxSize - instructions.length;
    }

	// this.setBranchAlreadyPredicted = function(predicted)
	// {
	// 	if(instruction)
	// 		instruction.AlreadyPredicted = predicted;
	// }
	
	this.getStepName = function()
	{
		return name;
	}

	// this.getBranchAlreadyPredicted = function(instruction)
	// {

	// 	return instruction.AlreadyPredicted;
	// }
	
    this.render = function(prevStep, containerPipeline) {
        //var count =  containerPipeline.children(`#${prevStep}`).length;
        const self = this;
        instructions.map(instruction => {
            var elem;
            if (instruction.name === "NoOp") {
                elem = containerPipeline.children(`.noop-${instruction.cycle}`);
            }
            else {
                elem = containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
            }
            //setTimeout(function() {
                elem.removeClass(prevStep);//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
                elem.addClass(name);//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
                if (!instruction.executeMe) {
                    elem.removeClass('background-info');
                    elem.addClass('background-disabled');
                }
                self.offsetRender(containerPipeline);
            //}, 80);
        });
        //setTimeout(() => { pipeStep.offsetRender(prevStep, containerPipeline); }, 80);
    }
    this.offsetRender = function(containerPipeline) {
        //let elems = containerPipeline.children(`.${prevStep}`);
        instructions.map((instruction, i) => {
            var elem;
            if (instruction.name === "NoOp") {
                elem = containerPipeline.children(`.noop-${instruction.cycle}`);
            }
            else {
                elem = containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
            }
            elem.css("top", (80 * i + 'px'));
        });
    }
}