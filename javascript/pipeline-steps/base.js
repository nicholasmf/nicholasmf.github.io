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

	this.setBranchAlreadyPredicted = function(predicted)
	{
		if(instruction)
			instruction.AlreadyPredicted = predicted;
	}
	
	this.getStepName = function()
	{
		return name;
	}
	
	this.getBranchAlreadyPredicted = function(instruction)
	{

		return instruction.AlreadyPredicted;
	}
	
	
	
	

    this.render = function(prevStep, containerPipeline) {
		if (!instruction) { return; }
        //var count =  containerPipeline.children(`#${prevStep}`).length;
		var elem;
		if (instruction.name === "NoOp") {
			elem = containerPipeline.children(`.noop-${instruction.cycle}`);
		}
		else {
			elem = containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
		}
		elem.removeClass(prevStep);//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
		elem.addClass(name);//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
		if (!instruction.executeMe) {
			elem.removeClass('background-info');
			elem.addClass('background-disabled');
		}
    }
}