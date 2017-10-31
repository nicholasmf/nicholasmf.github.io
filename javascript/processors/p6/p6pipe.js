function P6Pipe() {
	
    const SimplePipe = this;
    const reorderBuffer = new ReorderBuffer(256);

    function fetchExecution(instructions, pc, cycle) {
        let retArray = [];
        let missing = this.missingInstructions();
        for (let i = 0; i < missing; i++) {
            if(instructions[pc + i])
            {
                let newInst = instructions[pc + i].copy();
                newInst.entryOrder = this.count++;
                this.setStepInstruction(newInst);
                if(instructions[pc + i].type === DATA_TYPES.CONTROL)
                {
                    newInst.alreadyPredicted = false;//para verificar se ja previ o branch, e evita prever de novo se ocorrerem stalls
					newInst.renderAlreadyPredicted = false;
					newInst.renderAlreadyBranched = false;
                }
            }
            // else {
            //     this.setStepInstruction(undefined);
            // }
        }
        this.setStepInstructionsCycle(cycle);
    }
    
    function decodeExecution(branchPredictor, dh) {
        let retArr = [[], []];
        let instructions = this.getStepInstructions();
    
        instructions.map(instruction => {
            if (!instruction.executeMe) { retArr[0].push(undefined); retArr[1].push(true); return; }
            if (instruction && dh) {
                retArr[1].push(dh.insert(instruction));
            }
            else {
                retArr[1].push(true);
            }
            var btbResult;
            
            if(instruction && instruction.type === DATA_TYPES.CONTROL && !instruction.alreadyPredicted)//para verificar se ja previ o branch se ele ficar parado
            {//preciso executar se eu tiver um preditor ativo e se a instrucao for de branch
                branchPredictorResult = branchPredictor.predict(instruction.address);//branchPredictorResult recebe endereco de previsao se houver
        //		console.log("predictor result is: " + branchPredictorResult);
                instruction.btbResult = branchPredictorResult !== undefined;
                instruction.alreadyPredicted = true;
            }
            else
            {
        //		console.log("predictor result is: dont see branch");
                branchPredictorResult = undefined;
            }
            retArr[0].push(branchPredictorResult);
        });
        return retArr;
    }
    
    function loadExecution() {
    
    }
    
    function executeExecution(branchPredictor, dh) {
        
        let instructions = this.getStepInstructions();
        instructions.map(instruction => {
            if (!instruction.executeMe) { return; }
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

            dh.execute(instruction);
        });
    }
    
    function storeExecution(dataMemory, dh) {
        
        let instructions = this.getStepInstructions();
    
        instructions.map(instruction => {
            if (!instruction.executeMe) { return; }
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
                dh.wb(instruction);
            }
        });
    }

    function waitingExecution() {
        let instructions = this.getStepInstructions();
        let ordered = instructions.sort((a, b) => { return a.entryOrder - b.entryOrder });
        ordered = ordered.slice(0, ordered.length);
        let first3Buffer = reorderBuffer.getFirstN(3);
        let pass = [], i = 0;
        let min = Math.min(first3Buffer.length, ordered.length);

        while(i < min && (!ordered[i].executeMe || first3Buffer[i] === ordered[i])) {
            this.remove(ordered[i]);
            pass.push(ordered[i++]);
        }
        reorderBuffer.removeFirstN(i);
        
        return pass;
    }

	var containerPipeline = $('<div class="container pipeline p6"></div>');
	$("#pipelineDivGoesBeneath").append(containerPipeline);
	
	
	$('.p6').append('<div class="sixStepSeparator sixStepLeft"></div>');
	$('.p6').append('<div class="sixStepSeparator sixStepRight"></div>');
	$('.p6').append('<div class="sixStepSeparator sixStepMid"></div>');

	var stepNameArr = ['p6StepDecodeGhost', 'p6StepLoadGhost', 'p6StepExecuteGhost', 'p6StepStoreGhost', 'p6StepFetchGhost'];
	for(let i=0; i<3; i++)
	{
		for(let j=0; j<5; j++)
		{
			$('.p6').append('<div class="p6StepContainer ' + stepNameArr[j] + ' p6row' + i + 'Height"></div>');
		}
	}
	var p6StepName = ['Fetch', 'Decode', 'Issue', 'Execution', 'Buffer', 'Retire'];
	for(let j=0; j<6; j++)
	{
		$('.p6').append('<div class="p6StepName p6' + p6StepName[j] + '">' + p6StepName[j] + '</div>');
	}
	
	this.renderPrediction = function(predictionAddr, i, instruction)
	{
		if(predictionAddr[i] && !instruction.renderAlreadyPredicted)
		{//se houver um predictionAddr, houve uma previsao positiva
			$('.p6').append("<div class='p6decodePredict-" + i + "' positivePredict'>Jump to: " + predictionAddr[i] +  "</div>");
		}
		else if(instruction && !instruction.renderAlreadyPredicted)
		{//se for undefined, ou previ falso ou houve um miss da cache, de qlqr modo, o pipe acha q nao havera jump
			$('.p6').append('<div class="p6decodePredict-' + i + '">No jump</div>');
			//console.log(herro);
		}
		
		var fade_out = function() {
			$(".p6decodePredict-" + i).fadeOut().remove();
		}

		setTimeout(fade_out, 940);
	}
	
	this.renderBranch = function(instruction, i)
	{
		if(instruction && instruction.type === DATA_TYPES.CONTROL && instruction.executeMe && !instruction.renderAlreadyBranched)
		{
			if(instruction.btbResult === instruction.params.branchResult) ///acertei a predicao
			{
				$('.p6').append("<div class='rightBranch p6ExecuteBranch-" + i + "'>Correct</div>");
			}
			else
			{
				$('.p6').append("<div class='wrongBranch p6ExecuteBranch-" + i + "'>Misprediction</div>");
			}
			
			var fade_out = function() {
				$(".p6ExecuteBranch-" + i).fadeOut().remove();
			}
			setTimeout(fade_out, 950);
			
		}
	}
	
    const fetch = new P6PipelineStep("fetch", fetchExecution, { containerPipeline: containerPipeline });
	const decode = new P6PipelineStep("decode", decodeExecution, { containerPipeline: containerPipeline });
	const load = new P6PipelineStep("load", loadExecution, { containerPipeline: containerPipeline });
	const execute = new P6PipelineStep("execute", executeExecution, { containerPipeline: containerPipeline });
    const store = new P6PipelineStep("store", storeExecution, { containerPipeline: containerPipeline });
	const wbBuffer = new P6PipelineStep("waiting", waitingExecution, { containerPipeline: containerPipeline });
	
	var startedFlushingThisCycle;
	var pc = 0;
	var cycle = 0;
	var flushControl = -5;
	var stopFlushControl = -5;
	//var executionReturns = -1;
	var fetchI = [], decodeI = [], loadI = [], executeI = [], storeI = [];
    var dhResult = [];
    var pcOffset;
	
    this.name = "P6 Pipeline";
	
	this.init = function(dataMemory) {
		SimplePipe.dataMemory = dataMemory;
    }
	

	this.pipeLoop = function(instructions, loopControl, branchPredictor, dependencyHandler)
	{
//		console.log("/////////////////////////////////////////");
 
        let toRemove = store.getNInstructions(3);
        this.removeHTMLInstruction(toRemove);        
        wbBuffer.setStepInstruction( execute.getNInstructions() );
        store.setStepInstruction( wbBuffer.execution() );
        wbBuffer.render("execute", containerPipeline);
        
        execute.setStepInstruction( load.getNInstructions(execute.missingInstructions()) );
        let nextLoadIns = undefined;
        if (dependencyHandler) {
            let executables = dependencyHandler.getExecutables( load.missingInstructions() );

            if(executables.length === 1 && executables[0] === null) { 
                nextLoadIns = decode.getNInstructions( load.missingInstructions() );
            }
            else {
                nextLoadIns = executables;
                decode.getNInstructions(3, function(item) {
                    return executables.indexOf(item) > -1;
                });
            }
        }
        else {
            nextLoadIns = decode.getNInstructions( load.missingInstructions() );
        }
        load.setStepInstruction( nextLoadIns );
        decode.setStepInstruction( fetch.getNInstructions( decode.missingInstructions() ) );
        reorderBuffer.insertArray(decode.getStepInstructions());
		pcOffset = fetch.missingInstructions();
        /////////////////// execucao das etapas /////////////////////////////
        // var predictionAddr = fetch.execution(instructions, pc, cycle, branchPredictor);
        // fetch.render(pc);
        // cycle++;
        var predictionAddr = [];
        fetch.execution(instructions, pc, cycle)
        fetch.render();

		fetchI = fetch.getStepInstructions();
		decodeI = decode.getStepInstructions();
		loadI = load.getStepInstructions();
		executeI = execute.getStepInstructions();
		storeI = store.getStepInstructions();		

        //executo fetch, pois ele apenas pega a proxima instrucao da memoria
		if(!decode.isEmpty())
		{	
//                console.log("executing decode");
            [predictionAddr, dhResult] = decode.execution(branchPredictor, dependencyHandler);
		}
        decode.render("fetch", containerPipeline);
		
		if(!load.isEmpty())
		{
            load.execution(pc);
//				console.log("executing load");
			
        }
        load.render("decode", containerPipeline);
		
		if(!execute.isEmpty())
		{
            execute.execution(branchPredictor, dependencyHandler);
//				console.log("executing execute");
        }
        execute.render("load", containerPipeline);
				
		if(!store.isEmpty())
		{
            store.execution(SimplePipe.dataMemory, dependencyHandler);
//				console.log("executing store");
			// else
			// {
			// 	if (dependencyHandler) dependencyHandler.wb(storeI);
			// }
		}	
        store.render("waiting", containerPipeline);
				
		/////////////////// fim da execucao das etapas /////////////////////////////
		
		//  console.log(fetch.getStepInstruction());
		//  console.log(decode.getStepInstruction());
		//  console.log(load.getStepInstruction());
		//  console.log(execute.getStepInstruction());
		//  console.log(store.getStepInstruction());
		
		//debugger;
		
		//////pipeline flushing control //////////////////////
		if(!decode.isEmpty())
		{
            decode.getStepInstructions().map((instruction, i) => {
                if(instruction.type === DATA_TYPES.CONTROL && predictionAddr[i] && instruction.executeMe)
                {
                    fetch.disableInstructions(instruction.entryOrder);
                    decode.disableInstructions(instruction.entryOrder);
                    load.disableInstructions(instruction.entryOrder);
                    execute.disableInstructions(instruction.entryOrder);
                    wbBuffer.disableInstructions(instruction.entryOrder);
                    store.disableInstructions(instruction.entryOrder);
                    if (dependencyHandler) {
                        decode.removeFromDH(dependencyHandler);
                        load.removeFromDH(dependencyHandler);
                        execute.removeFromDH(dependencyHandler);
                        wbBuffer.removeFromDH(dependencyHandler);
                        store.removeFromDH(dependencyHandler);
                    }
                }
            });
		}
//		if(executeI && executeI.type === DATA_TYPES.CONTROL &&  executeI.executeMe/*!(executeI.cycle <= flushControl + 2)*/ )//deve existir uma instrucao em execute
        if (!execute.isEmpty())
        {//se houver um branch que errei a previsao, devo dar flush
            execute.getStepInstructions().map((instruction, i) => {
                if(instruction.type === DATA_TYPES.CONTROL && instruction.executeMe && instruction.params.branchResult !== instruction.btbResult)//e esses enderecos nao forem iguais, errei munha previsao
                {
                    //console.log("mistakes were made, flushing pipe");
//                    flushControl = executeI.cycle;//flush control recebe o ciclo da instrucao de branch q causou o flush
//                    stopFlushControl = cycle;//recebe o ciclo onde o flush foi iniciado
                    fetch.disableInstructions(instruction.entryOrder);
                    decode.disableInstructions(instruction.entryOrder);
                    load.disableInstructions(instruction.entryOrder);
                    execute.disableInstructions(instruction.entryOrder);
                    wbBuffer.disableInstructions(instruction.entryOrder);
                    store.disableInstructions(instruction.entryOrder);
                    if (dependencyHandler) {
                        decode.removeFromDH(dependencyHandler);
                        load.removeFromDH(dependencyHandler);
                        execute.removeFromDH(dependencyHandler);
                        wbBuffer.removeFromDH(dependencyHandler);
                        store.removeFromDH(dependencyHandler);
                    }
                }
            });
		}
		
		// if(cycle === stopFlushControl + 4)//passaram-se 4 ciclos desde o inicio do flush, posso parar
		// {
		// 	flushControl = -5;
		// 	stopFlushControl = -5;
		// }
		
		//////end of pipeline flushing control //////////////////////
		if (!execute.isEmpty())
		{
			execute.getStepInstructions().map((instruction, i) => {
				if(instruction.type === DATA_TYPES.CONTROL && instruction.executeMe)
				{
					
					SimplePipe.renderBranch(instruction, i);
					instruction.renderAlreadyBranched = true;
				}
			});
		}
		
		if (!decode.isEmpty())
		{
			decode.getStepInstructions().map((instruction, i) => {
				if(instruction.type === DATA_TYPES.CONTROL && instruction.executeMe)
				{
					SimplePipe.renderPrediction(predictionAddr, i, instruction);
					instruction.renderAlreadyPredicted = true;
				}
			});
		}
		
//		console.log("flushControl: " + flushControl + " cycle: " + cycle + " stopFlushControl: " + stopFlushControl);
        //////branch & sequential pc control //////////////////////
        (function() {
            var decodeInstructions = decode.getStepInstructions();
            var executeInstructions = execute.getStepInstructions();
            var firstPredict = predictionAddr.find((item, i) => { return item !== undefined && decodeInstructions[i].executeMe; });
            var firstMissBranch = executeInstructions.find(instruction => {
                return instruction.type === DATA_TYPES.CONTROL && 
                        instruction.params.branchResult !== instruction.btbResult && 
                        instruction.executeMe;
            });
            if (firstMissBranch) {
                if (firstMissBranch.params.branchResult) {
                    pc = firstMissBranch.getTargetAddr();
                }
                else {
                    pc = firstMissBranch.address + 1;
                }
            }
            else if (firstPredict) {
                pc = firstPredict;
            }
            else {
                pc = pc + pcOffset;
            }
        })();

// 		if(executeI && executeI.type === DATA_TYPES.CONTROL && executeI.executeMe/*(executeI.cycle === flushControl + 3 || flushControl === -5 || executeI.cycle === flushControl)*/ )
// 		{//execute tem uma instrucao de branch
// //			console.log("1: was: " + executeI.params.branchResult + " predicted: " + executeI.btbResult);
// 			if(executeI.params.branchResult === executeI.btbResult)//eu acertei
//             {
// 				if(predictionAddr)
// 				{// se houver um novo branch em "decode" ele devera ser executado e tento prevejo seu destino
// 					pc = predictionAddr;
// 				}
// 				else
// 				{//se nao houver especulacoes, procedo sequencialmente
// 					if (!stallDecode) pc++;
// 				}
// 			}
// 			else
// 			{//eu errei a previsao
// 				if(executeI.params.branchResult)//se eu errei pq houve pulo, previ q nao
// 				{//pula o pc para a instrucao alvo
// 					pc = executeI.getTargetAddr();
// 				}
// 				else
// 				{//senao pula o pc para + 1
// 					pc = executeI.address + 1;
// 				}
// 			}
// 		}
// 		else
// 		{
//             if(executeI && executeI.type === DATA_TYPES.CONTROL)
// 			{
// //				console.log("2: was: " + executeI.params.branchResult + " predicted: " + executeI.btbResult);	
// 			}
// 			if(predictionAddr)
//             {
//                 pc = predictionAddr;
//             }
//             else
//             {
//                 if (!stallDecode) pc++;
//             }
// 		}
		//////end of branch & sequential pc control //////////////////////
		
//		if(!stallDecode)
			cycle++;
		
//		console.log("pc: " + pc);
		
		if (fetch.isEmpty() && execute.isEmpty() && load.isEmpty() && decode.isEmpty() && store.isEmpty())
		{
//			console.log("no u");
			clearInterval(loopControl);
		}	
	}
	
	

	
	////////////////end of class declaration ///////////////////////////////////////////////////////////////
    
    // Overwrite fetch render
    fetch.render = function() {
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
        const pipeStep = this;
        var instructions = this.getStepInstructions();
        var scrollTo = (instructions[0] || {}).address;
        //console.log(instruction);
        instructions.map(instruction => {
            if (instruction.cycle !== cycle) { return; }
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
			instructionOperandsString = '<br>' +instructionOperandsString + ')';
            var instructionElem = $(`<div class='pipeline-item background-info fetch ${instruction.cycle}-${instruction.address}'>${instruction.name}${instructionOperandsString}</div>`);
            var elem = instructionList.children(`:eq(${instruction.address})`);
            elem.addClass('active');
            containerPipeline.append(instructionElem);
            pipeStep.offsetRender(containerPipeline);
        });
        if(scrollTo) {
            $("#instructions").animate({
                scrollTop: 42*scrollTo - 4
            }, 200);
        }
    }

    // Override execute render - change color to success if executed
    execute.render = function(prevStep, containerPipeline) {
        var self = this;
        let instructions = this.getStepInstructions();
        instructions.map(instruction => {
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
            self.offsetRender(containerPipeline);
        });
        //setTimeout(() => { self.offsetRender("decode", containerPipeline); }, 80);
    }

    // Remove First element on store step
    this.removeHTMLInstruction = function(instructions) {
        //let instructions = store.getStepInstructions();
        instructions.map(instruction => {
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
        });
        //setTimeout(() => { store.offsetRender("store", containerPipeline); }, 80);
    }

    this.insertNoOp = function(step) {
        let noop = $(`<div class='pipeline-item ${step} background-danger noop-${cycle}'>NoOp</div>`);
        containerPipeline.append(noop);
    }

    wbBuffer.offsetRender = function() {
        let instructions = this.getStepInstructions();
        instructions.map((instruction) => {
            var elem;
            if (instruction.name === "NoOp") {
                elem = containerPipeline.children(`.noop-${instruction.cycle}`);
            }
            else {
                elem = containerPipeline.children(`.${instruction.cycle}-${instruction.address}`);
            }
            elem.css("top", (80 + 'px'));
        });
    }

    // this.disableInstruction = function(step) {
    //     let elem = containerPipeline.find(`.${step}`);
    //     elem.removeClass("background-info");
    //     elem.addClass("background-disabled");
    // }
}