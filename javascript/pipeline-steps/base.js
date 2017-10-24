function PipelineStep(stepName, stepExecution, params) {
	
    const pipeStep = this;
    const name = stepName;
    this.execution = stepExecution;
	var instruction;
    for (let property in params) {
        // Handle each property of params
        this[property] = params[property];
        if (property === "b") {
            // Do something
        }
    }
	
	
	this.getStepInstruction = function()
	{
		return instruction;
	}

	this.setStepInstruction = function(newInstruction)
	{
		instruction = newInstruction;
	}
	
	this.setStepInstructionCycle = function(cycle)
	{
		if(instruction)
			instruction.cycle = cycle;
	}

	this.getStepName = function()
	{
		return name;
	}
	
	
	
	

    this.render = function(prevStep, containerPipeline) {
        var count =  containerPipeline.children(`.${prevStep}`).length;
        var instruction = containerPipeline.children(`.${prevStep}:eq(0)`);
        if (count) {
            setTimeout(function() {
                instruction.removeClass(prevStep);//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
                instruction.addClass(name);//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
            }, 80)
        }
    }
}