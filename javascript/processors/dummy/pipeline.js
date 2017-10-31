function DummyPipe() {
	
	const SimplePipe = this;

	
	function fetchExecution(instructions, pc, cycle) {
		if(instructions[pc])
		{
			var newInst = instructions[pc].copy();
			newInst.entryOrder = cycle;
			this.setStepInstruction(newInst);
			this.setStepInstructionCycle(cycle);
			if(instructions[pc].type === DATA_TYPES.CONTROL)
			{
				this.setBranchAlreadyPredicted(false);//para verificar se ja previ o branch, e evita prever de novo se ocorrerem stalls
				newInst.renderAlreadyPredicted = false;
				newInst.renderAlreadyBranched = false;
			}
		}
		else
			this.setStepInstruction(undefined);
	}
	
	function decodeExecution(branchPredictor, dh) {
		let retArr = [];
		let instruction = this.getStepInstruction();
		if (instruction && dh) {
			retArr[1] = dh.insert(instruction);
		}
		else {
			retArr[1] = true;
		}
		var btbResult;	
		
		if(instruction && instruction.type === DATA_TYPES.CONTROL && !instruction.alreadyPredicted)//para verificar se ja previ o branch se ele ficar parado
		{//preciso executar se eu tiver um preditor ativo e se a instrucao for de branch
			branchPredictorResult = branchPredictor.predict(instruction.address);//branchPredictorResult recebe endereco de previsao se houver
	//		console.log("predictor result is: " + branchPredictorResult);
			instruction.btbResult = branchPredictorResult !== undefined;
			this.setBranchAlreadyPredicted(true);
		}
		else
		{
	//		console.log("predictor result is: dont see branch");
			branchPredictorResult = undefined;
		}
		retArr[0] = branchPredictorResult;
		return retArr;
	}
	
	function loadExecution() {
	
	}
	
	function executeExecution(branchPredictor, dh) {
		
		let instruction = this.getStepInstruction();
		instruction.executedCycles++;
		
		if(instruction && instruction.type === DATA_TYPES.ARITHMETIC)
		{
			instruction.result = instruction.executethis();
			//console.log("T0: ", instruction.params.dest);
		}
		
		if (instruction && instruction.type === DATA_TYPES.CONTROL) {
			if (instruction.name === "BRANCH IF ZERO") {
				instruction.executethis();
				branchPredictor.update(instruction.address, instruction.params.branchTo, instruction.params.branchResult);
			}
		}
	}
	
	function storeExecution(dataMemory, dh) {
		
		let instruction = this.getStepInstruction();
		
		if(instruction && instruction.result != undefined && instruction.type === DATA_TYPES.ARITHMETIC)
		{
			instruction.params.dest.set(instruction.result);
		}
		// Load and Store
		if(instruction && instruction.type === DATA_TYPES.DATA_TRANSFER) 
		{
			instruction.executethis(dataMemory);
		}
		if (instruction && dh) {
			dh.execute(instruction);
			dh.wb(instruction);
		}
	}
	

	
    this.fetch = new PipelineStep("fetch", fetchExecution);
	this.decode = new PipelineStep("decode", decodeExecution);
	this.load = new PipelineStep("load", loadExecution);
	this.execute = new PipelineStep("execute", executeExecution);
    this.store = new PipelineStep("store", storeExecution);
	
	
	var startedFlushingThisCycle;
	var pc = 0;
	var cycle = 0;
	var flushControl = -5;
	var stopFlushControl = -5;
	//var executionReturns = -1;
	var fetchI, decodeI, loadI, executeI, storeI;
	var dhResult = true;
	
    this.name = "Dummy Pipeline";
	var containerPipeline = $('<div class="container pipeline dummy"></div>');
	$("#pipelineDivGoesBeneath").append(containerPipeline);
	
	
	var DummyNameArr = ['decode', 'load', 'execute', 'store', 'fetch'];
	var textIdentifierArr = ['dummyDecode', 'dummyLoad', 'DummyExecute', 'DummyStore', 'DummyFetch'];
	for(let i=0; i<5; i++)
	{
		$("#pipelineDivGoesBeneath").append('<div class="fiveStepText ' + textIdentifierArr[i] + '">'+ DummyNameArr[i] + '</div>');
	}
	
	var stepNameArr = ['fiveStepDecodeGhost', 'fiveStepLoadGhost', 'fiveStepExecuteGhost', 'fiveStepStoreGhost', 'fiveStepFetchGhost'];
	for(let j=0; j<5; j++)
	{
		$(containerPipeline).append('<div class="fiveStepContainer ' + stepNameArr[j] + ' dummyHeight"></div>');
	}
	
	$(containerPipeline).append('<div class="fiveStepSeparator fiveStepLeft"></div>');
	$(containerPipeline).append('<div class="fiveStepSeparator fiveStepRight"></div>');
	
	
	this.renderPrediction = function(predictionAddr)
	{
		if(predictionAddr)
		{//se houver um predictionAddr, houve uma previsao positiva
			$('.container.pipeline.dummy').append("<div class='decodePredict positivePredict'>Jump to: " + predictionAddr +  "</div>");
		}
		else
		{//se for undefined, ou previ falso ou houve um miss da cache, de qlqr modo, o pipe acha q nao havera jump
			$('.container.pipeline.dummy').append("<div class='decodePredict'>No jump</div>");
			//console.log(herro);
		}
		var fade_out = function() {
			$(".decodePredict").fadeOut().remove();
		}

		setTimeout(fade_out, 940);
	}
	
	this.renderBranch = function(instruction)
	{
		if(instruction && instruction.type === DATA_TYPES.CONTROL && instruction.executeMe)
		{
			if(instruction.btbResult === instruction.params.branchResult) ///acertei a predicao
			{
				$('.container.pipeline.dummy').append("<div class='rightBranch dummyExecuteBranch'>Correct</div>");
			}
			else
			{
				$('.container.pipeline.dummy').append("<div class='wrongBranch dummyExecuteBranch'>Misprediction</div>");
			}
			var fade_out = function() {
				$(".dummyExecuteBranch").fadeOut().remove();
			}
			setTimeout(fade_out, 950);
		}
	}
	
	this.init = function(dataMemory) {
		SimplePipe.dataMemory = dataMemory;
    }
	

	this.pipeLoop = function(instructions, loopControl, branchPredictor, dependencyHandler)
	{
//		console.log("/////////////////////////////////////////");
        let dhRet = dependencyHandler ? dependencyHandler.getExecutables(1)[0] : null;
        let nextExecIns = dependencyHandler && decodeI ? ( dhRet === undefined ? new Instruction("NoOp") : dhRet === null ? decodeI : dhRet) : decodeI;
        if (decodeI && !decodeI.executeMe) { nextExecIns = decodeI; }
        else if (!dhResult) { nextExecIns = new Instruction("NoOp"); }
        if (nextExecIns && nextExecIns.name === "NoOp" && !nextExecIns.cycle) { nextExecIns.cycle = cycle; }
        let stallDecode = nextExecIns && nextExecIns.name === "NoOp" && decodeI;
        //console.log(fetchI, decodeI, executeI, loadI, storeI);
		
		let out = this.store.getStepInstruction();
		this.removeHTMLInstruction(out);		
        this.store.setStepInstruction( this.load.getStepInstruction() );
		this.load.setStepInstruction( this.execute.getStepInstruction() );
		this.execute.setStepInstruction( nextExecIns );
		if (!stallDecode) this.decode.setStepInstruction( this.fetch.getStepInstruction() );
		
        /////////////////// execucao das etapas /////////////////////////////
        // var predictionAddr = this.fetch.execution(instructions, pc, cycle, branchPredictor);
        // this.fetch.render(pc);
        // cycle++;
        var predictionAddr;
        if (stallDecode) { SimplePipe.insertNoOp("execute"); }
        else {
            this.fetch.execution(instructions, pc, cycle)
            this.fetch.render();
        }

		fetchI = this.fetch.getStepInstruction();
		decodeI = this.decode.getStepInstruction();
		loadI = this.load.getStepInstruction();
		executeI = this.execute.getStepInstruction();
		storeI = this.store.getStepInstruction();		
        

        //executo fetch, pois ele apenas pega a proxima instrucao da memoria
		if(decodeI && (!stallDecode || stallDecode && !dhResult))
		{	
			if(decodeI.executeMe)
			{
//                console.log("executing decode");
                [predictionAddr, dhResult] = this.decode.execution(branchPredictor, dependencyHandler);
            }
			this.decode.render("fetch", containerPipeline);
		}
		
		if(executeI)
		{

			if(executeI.executeMe)
			{
				this.execute.execution(branchPredictor, dependencyHandler);
//				console.log("executing execute");
			}
			this.execute.render("decode", containerPipeline);
		}
		
		
		if(loadI)
		{
			
			
			if(loadI.executeMe)
			{
				this.load.execution(pc);
//				console.log("executing load");
			}
			
			this.load.render("execute", containerPipeline);
		}
		
		if(storeI)
		{
			if(storeI.executeMe)
			{
				this.store.execution(SimplePipe.dataMemory, dependencyHandler);
//				console.log("executing store");
			}
			// else
			// {
			// 	if (dependencyHandler) dependencyHandler.wb(storeI);
			// }
			this.store.render("load", containerPipeline);
		}	
				
		/////////////////// fim da execucao das etapas /////////////////////////////
		
		//  console.log(this.fetch.getStepInstruction());
		//  console.log(this.decode.getStepInstruction());
		//  console.log(this.load.getStepInstruction());
		//  console.log(this.execute.getStepInstruction());
		//  console.log(this.store.getStepInstruction());
		
		//debugger;
		
		//////pipeline flushing control //////////////////////
		if(decodeI && decodeI.type === DATA_TYPES.CONTROL)
		{
			if(predictionAddr)
			{
				if(fetchI)
				{
                    fetchI.executeMe = false;
				}
			}
		}
		if(executeI && executeI.type === DATA_TYPES.CONTROL &&  executeI.executeMe/*!(executeI.cycle <= flushControl + 2)*/ )//deve existir uma instrucao em execute
		{//se houver um branch que errei a previsao, devo dar flush
			if(executeI.params.branchResult !== executeI.btbResult)//e esses enderecos nao forem iguais, errei munha previsao
			{
				//console.log("mistakes were made, flushing pipe");
				flushControl = executeI.cycle;//flush control recebe o ciclo da instrucao de branch q causou o flush
				stopFlushControl = cycle;//recebe o ciclo onde o flush foi iniciado
				if(fetchI) {
					fetchI.executeMe = false;
                }
                if(decodeI) {
                    decodeI.executeMe = false;
                    if(dependencyHandler) dependencyHandler.remove(decodeI);
                }
			}
		}
		
		if(cycle === stopFlushControl + 4)//passaram-se 4 ciclos desde o inicio do flush, posso parar
		{
			flushControl = -5;
			stopFlushControl = -5;
		}
		
		//////end of pipeline flushing control //////////////////////
		
		
		if(decodeI && decodeI.type === DATA_TYPES.CONTROL && decodeI.executeMe && !decodeI.renderAlreadyPredicted)
		{
				SimplePipe.renderPrediction(predictionAddr);
				decodeI.renderAlreadyPredicted = true;
		}
		if(executeI && executeI.type === DATA_TYPES.CONTROL && executeI.executeMe  && !executeI.renderAlreadyBranched)
		{
			SimplePipe.renderBranch(executeI);
			executeI.renderAlreadyBranched = true;
		}
		
//		console.log("flushControl: " + flushControl + " cycle: " + cycle + " stopFlushControl: " + stopFlushControl);
		//////branch & sequential pc control //////////////////////
		if(executeI && executeI.type === DATA_TYPES.CONTROL && executeI.executeMe/*(executeI.cycle === flushControl + 3 || flushControl === -5 || executeI.cycle === flushControl)*/ )
		{//execute tem uma instrucao de branch
//			console.log("1: was: " + executeI.params.branchResult + " predicted: " + executeI.btbResult);
			if(executeI.params.branchResult === executeI.btbResult)//eu acertei
            {
				if(predictionAddr)
				{// se houver um novo branch em "decode" ele devera ser executado e tento prevejo seu destino
					pc = predictionAddr;
				}
				else
				{//se nao houver especulacoes, procedo sequencialmente
					if (!stallDecode) pc++;
				}
			}
			else
			{//eu errei a previsao
				if(executeI.params.branchResult)//se eu errei pq houve pulo, previ q nao
				{//pula o pc para a instrucao alvo
					pc = executeI.getTargetAddr();
				}
				else
				{//senao pula o pc para + 1
					pc = executeI.address + 1;
				}
			}
		}
		else
		{
            if(executeI && executeI.type === DATA_TYPES.CONTROL)
			{
//				console.log("2: was: " + executeI.params.branchResult + " predicted: " + executeI.btbResult);	
			}
			if(predictionAddr)
            {
                pc = predictionAddr;
            }
            else
            {
                if (!stallDecode) pc++;
            }
		}
		//////end of branch & sequential pc control //////////////////////
		
//		if(!stallDecode)
			cycle++;
		
//		console.log("pc: " + pc);
		
		if (!(fetchI || executeI || loadI || decodeI || storeI))
		{
//			console.log("no u");
			clearInterval(loopControl);
		}	
	}
	
	
	
	
	
	
	////////////////end of class declaration ///////////////////////////////////////////////////////////////
    
    // Overwrite fetch render
    this.fetch.render = function() {
        		//var midCol = $("#pipelineDivGoesBeneath");
		//midCol.append(containerPipeline);
        //var pipeline = $('<div class="container pipeline">\n</div>');//$(".pipeline");	
        var instructionList = $("#instructions");
        instructionList.children('.active').removeClass('active');
        // if (pipeSim.fillNoop > 0) {
        //     var instructionElem = $("<div class='pipeline-item background-danger fetch'>NoOp</div>");
        //     setTimeout(function() {
        //         //elem.detach();
        //         pipeline.append(instructionElem);
        //     }, 100);
        //     return new Instruction("NoOp");
        // }
        // else 
        var instruction = this.getStepInstruction();
        //console.log(instruction);
        if (!instruction) { return; }
		var instructionOperands = getOperands(instruction);
		var instructionOperandsString = '(';
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
		instructionOperandsString = instruction.name + '<br>' +instructionOperandsString + ')';
        var instructionElem = $(`<div class='pipeline-item background-info fetch ${instruction.cycle}-${instruction.address}'>${instructionOperandsString}</div>`);
                                //<div class='formato cor posicao'></div>
        //var elem = instructionList.children(":eq(0)");
        //elem.addClass("out");
        var elem = instructionList.children(`:eq(${instruction.address})`);
        elem.addClass('active');
        $("#instructions").animate({
            scrollTop: 42*(instruction.address-1) - 4
        }, 200);
        setTimeout(function() {
            //elem.detach();
            //console.log(containerPipeline);
            containerPipeline.append(instructionElem);
        }, 60);//talvez nao precise de delay
    }

    // Override execute render - change color to success if executed
    this.execute.render = function(prevStep, containerPipeline) {
        var self = this;
        let instruction = this.getStepInstruction();
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
		elem.addClass(self.getStepName());//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
		if (!instruction.executeMe) {
			elem.removeClass('background-info');
			elem.addClass('background-disabled');
		}
		else if (elem.hasClass("background-info") /*&& !isFlushing*/) {//background info eh "azul"
			elem.removeClass("background-info");//retira o azul do bloquinho e coloca verde
			elem.addClass("background-success");//nota: essas cores estao no .css              
		}
    }

    // Remove First element on store step
    this.removeHTMLInstruction = function(instruction) {
		if (!instruction) { return; }
		var elem;
		if (instruction.name === "NoOp") {
			elem = containerPipeline.children(`.noop-${instruction.cycle}`);
		}
		else {
			elem = containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
		}

		if (!elem ) { return; }
		var instructionList = $("#finalList");
		var instructionElem = $("<li class='list-group-item'>" + elem.text() + "</li>");

		if (elem.hasClass("background-success")) {
			instructionElem.addClass("list-group-item-success");
		}
		if (elem.hasClass("background-danger")) {
			instructionElem.addClass("list-group-item-danger");
		}
		if (elem.hasClass("background-disabled")) {
			instructionElem.addClass("disabled");
		}

		elem.addClass("out");            
		setTimeout(function() {
			elem.detach();
			instructionList.append(instructionElem);
			instructionList.animate({
				scrollTop: instructionList[0].scrollHeight
			}, 200);
		}, 100);
    }

    this.insertNoOp = function(step) {
        let noop = $(`<div class='pipeline-item ${step} background-danger noop-${cycle}'>NoOp</div>`);
        containerPipeline.append(noop);
    }

    // this.disableInstruction = function(step) {
    //     let elem = containerPipeline.find(`.${step}`);
    //     elem.removeClass("background-info");
    //     elem.addClass("background-disabled");
    // }
}