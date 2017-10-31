function P5Pipe(htmlClass) {
    
	const pipeSim = this;
	this.fillNoop = 0;
	
	this.name = "P5";
	
	var instruction = new Array(2);//simula meu buffer de 2 posicoes
	var result = {}, lastResult = {};
    var decodeI, loadI, executeI, storeI; //var guarda a instrucao I na etapa n (nI)
	
	
	var containerPipeline = $('<div id="'+ htmlClass + 'Id" class="container pipeline ' + htmlClass + '"></div>');
	$("#pipelineDivGoesBeneath").append(containerPipeline);
	
	var querySelectorString = "#" + htmlClass + "Id";
	for(let i=0; i<2; i++)
	{//renderiza os lugares tracejados onde as instrucoes param
		$("#" + htmlClass + "Id").append('<div class="p5Buffer-' + i + ' fiveStepFetchGhost fiveStepContainer"></div>');
	}
	var stepNameArr = ['fiveStepDecodeGhost', 'fiveStepLoadGhost', 'fiveStepExecuteGhost', 'fiveStepStoreGhost', 'fiveStepFetchGhost'];
	for(let j=0; j<4; j++)
	{
		$(querySelectorString).append('<div class="fiveStepContainer ' + stepNameArr[j] + ' ' + htmlClass + 'Height"></div>');
	}
	
	
	$(querySelectorString).append('<div class="fiveStepSeparator fiveStepLeft"></div>');
	$(querySelectorString).append('<div class="fiveStepSeparator fiveStepRight"></div>');
	
    this.init = function(dataMemory) {
        pipeSim.dataMemory = dataMemory;
    }

	var correctlyPredictedYes;//retorna se o branch especulativo foi correto para o caso positivo
	
	//this.lastDecodeI;
	
	this.getExecuteInstruction = function()
	{
		return executeI;
	}
	
	this.getLoadInstruction = function()
	{
		return loadI;
	}
	
	this.setLoadInstruction = function(newInstruction)
	{//yep, dangerous
		loadI = newInstruction;
	}
	
	this.getDecodeInstruction = function()
	{
		//return pipeSim.lastDecodeI;
		return decodeI;
	}
	
	this.getFetchInstruction = function(bufferNum)
	{
		return instruction[bufferNum];
	}
	
	this.setFetchInstruction = function(newInstruction, bufferNum)
	{//this is very dangerous!
		instruction[bufferNum] = newInstruction;
	}
	
	/*
	this.setDecodeInstruction = function(newInstruction)
	{
		decodeI = newInstruction;
	}
	*/
	
	//pipeName eh so para funs de debug
	this.p5cycle = function(BTB, instructions, pc, execution, fillNoop, substituteInstruction, pipeDo, inBuffer, cycle, pipeName) {	

		pipeSim.fillNoop = fillNoop;
		correctlyPredictedYes = false;
				
		if(pipeDo.store)
			lastResult = result;
		
		if(pipeDo.execute)
			storeI = executeI;
		if(pipeDo.load)
			executeI = loadI;
		
		if(pipeDo.decode)
			loadI = decodeI;
		
		if(!pipeDo.fetch && inBuffer.changedLastIter && !instruction[inBuffer.number])
		{//se o fetch estiver travado, mas eu mudei meu buffer e o fetch nao tem nada, devo executar mesmo assim
			instruction[inBuffer.number] = pipeSim.fetchStep(pc, instructions);
			if(instruction[inBuffer.number])
			{
				$('#entry-'+instruction[inBuffer.number].inOrder).addClass("buffer-"+inBuffer.number);
			}
			
		}
		
		if(pipeDo.fetch)
		{
			if(inBuffer.changedLastIter && fillNoop > 0)//so dou flush se errei a previsao
			{//se o buffer mudou na ultima iteracao, devo avancar com o flush das instrucoes do buffer errado (o anterior)
				if(inBuffer.number === 0)
				{
					decodeI = instruction[1];//falo para avancar com o buffer errado
					instruction[1] = undefined;//e esvazio ele
				}
				else
				{
					decodeI = instruction[0];
					instruction[0] = undefined;
				}
			}
			else//se o buffer nao mudou, proceder normalmente
				decodeI = instruction[inBuffer.number];		
		}
			
		
		//console.log("aD: " + decodeI + " aL: " + loadI + " aE: " + executeI + " aS: " + storeI);
	
	//instruction = sim.fetchStep((BTB.predict(pc) ? BTB.predict(pc) : pc < instructions.length ? pc : -1), instructions);//pega 1 unica instrucao por vez da minha lista de instrucoes		
		//var btbResult = (decodeI && pipeDo.decode) ? BTB.predict(decodeI.address) : undefined;
		var btbResult;
		if(decodeI && pipeDo.decode)
		{
			btbResult = BTB.predict(decodeI.address);//btbResult recebe o endereco da instrucao q irei pular para (especulativamente)
		}
		else
			btbResult = undefined;
		
		console.log("btbR: " + btbResult);
		
		if(pipeDo.fetch)
		{
			console.log("executing " + pipeName + "fetch");
			if(btbResult != undefined && decodeI.type === DATA_TYPES.CONTROL)
			{
				//obs deu branch especulativo, devo mudar o buffer e dar fetch nele se nao tiver nada la (o buffer sera mudado em architecture)
				
				/*
				var aux;//auxiliar para nao perder valor de inBuffer
				if(inBuffer.number === 0)
				{
					aux = 1;
				}
				else
					aux = 0;
				if(!instruction[aux])
				{//se nao tiver nada no buffer q irei para, devo dar fetch
					instruction[aux] = pipeSim.fetchStep(btbResult, instructions);
				}
				*/

				//instruction[inBuffer.number] = pipeSim.fetchStep(btbResult, instructions)
				decodeI.btbResult = true;
				//pc = btbResult;
				//console.log("btbResult:" + btbResult);
			}
			if(pc < instructions.length)
			{
				instruction[inBuffer.number] = pipeSim.fetchStep(pc, instructions);
				if(instruction[inBuffer.number])
				{
					
					instruction[inBuffer.number].cycle = cycle;
					//console.log(entryString, inBufferString);
					$('#entry-'+instruction[inBuffer.number].inOrder).addClass("buffer-"+inBuffer.number);
				}
			}
			else
			{
				instruction[inBuffer.number] = pipeSim.fetchStep(-1, instructions);
			}
			if(!btbResult && instruction[inBuffer.number] && decodeI)
			{
				decodeI.btbResult = false;
			}
		}
		//console.log("T0: " + T0.get() + " T1:" + T1.get());
		
		//var substitution = {load:false, decode:false};
		
		
		if(substituteInstruction.Place === 'load')
		{
			if(loadI)
			{
				console.log("substituting in load step " + loadI.name + " in " + pipeName + "for " + substituteInstruction.Instruction.name);
			}
				loadI = substituteInstruction.Instruction;
				//substitution.load = true;
		}
		

		if(pipeDo.decode)
		{
			console.log("executing " + pipeName + "decode");
			pipeSim.decode(substituteInstruction, decodeI);
		}
			
		if(pipeDo.load)
		{
			console.log("executing " + pipeName + "load");
			pipeSim.load(substituteInstruction, loadI);
		}
			
		if(pipeDo.store)
		{
			console.log("executing " + pipeName + "store");
			pipeSim.store(storeI, lastResult);
		}
			
		if(pipeDo.execute)
		{
			console.log("executing " + pipeName + "execute");
			result = pipeSim.execute(executeI);//result eh da instrucao que esta no execute e lastResult eh da instrucao q ta no store
			if(correctlyPredictedYes)
			{
				if(inBuffer.number === 0)
				{
					console.log("destroying instruction in buffer 1"); 
					instruction[1] = undefined;//invalido a instrucao em fetch do outro buffer
				}
				else
				{
					console.log("destroying instruction in buffer 0"); 
					instruction[0] = undefined;
				}
			}
		}
			
		pipeSim.end(execution, pc);
		
		if( !instruction[inBuffer.number] && !decodeI && !loadI && !executeI && !storeI )//se meu pipe estiver vazio depois de uma execucao, encerro
			clearInterval(execution);
		//console.log(executeI, result, pipeSim.fillNoop);

		if(executeI && executeI.type === DATA_TYPES.CONTROL){
			BTB.update(executeI.address, executeI.params.branchTo, executeI.params.branchResult);
			//console.log(executeI.address);
		}
		
		if(instruction[0])
			console.log(pipeName + "F0: " + instruction[0].name + " addr: " + instruction[0].address);
		if(instruction[1])
			console.log(pipeName + "F1: " + instruction[1].name + " addr: " + instruction[1].address);
		if(decodeI)
			console.log(pipeName + "D: " + decodeI.name + " addr: " + decodeI.address);
		if(loadI)
			console.log(pipeName + "L: " + loadI.name + " addr: " + loadI.address);
		if(executeI)
			console.log(pipeName + "E: " + executeI.name + " addr: " + executeI.address);
		if(storeI)
			console.log(pipeName + "S: " + storeI.name + " addr: " + storeI.address);
		
		var lastResultReturn = lastResult;
		
		return [result, pipeSim.fillNoop, btbResult, correctlyPredictedYes];
	}
	
	/*************** Fetch *********************/
    this.fetchStep = function(pc, instructions) {//funcao q desenha as caixinhas a cada iteracao (1s)
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
        if (pc > -1) {
            var instruction = instructions[pc].copy();
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
			instructionOperandsString = instructionOperandsString + ')';
            var instructionElem = $("<div id='entry-" + globalPipeInOrderEntry + "' class='pipeline-item background-info fetch'>" + instruction.name + "<br>" + instructionOperandsString + "</div>");
                                    //<div class='formato cor posicao'></div>
            //var elem = instructionList.children(":eq(0)");
            //elem.addClass("out");
            var elem = instructionList.children(`:eq(${pc})`);
            elem.addClass('active');
            $("#instructions").animate({
                scrollTop: 42*(pc-1) - 4
            }, 200);
            //setTimeout(function() {
                //elem.detach();
                containerPipeline.append(instructionElem);

            //}, 60);//talvez nao precise de delay
			instruction.inOrder = globalPipeInOrderEntry++;
            return instruction;//retorna a instrucao na posicao pc
        }
        else { 
            return null;
        }
    }

    /***************** Decode *********************/
    this.decode = function(substituteInstruction, instruction) {//so parte grafica, por enquanto?
        if (instruction) {
			var auxSubstI = {Place: substituteInstruction.Place, Instruction: substituteInstruction.Instruction };
            setTimeout(function() {
				if(auxSubstI.Place === 'decode')
				{
					var elem = $('#entry-' + auxSubstI.Instruction.inOrder);
					elem.detach();
					containerPipeline.append(elem);
					// elem.detach();
					// containerPipeline.append("<div class='pipeline-item background-info decode'>" + auxSubstI.Instruction.name + "</div>")
				}
				else 
				{
					var elem = $('#entry-' + instruction.inOrder);
				}
				elem.removeClass("fetch");//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
				elem.addClass("decode");//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
		}, 80)
        }
				
    }

    this.load = function(substituteInstruction, instruction) {
		//var elem = containerPipeline.children(".decode:eq(0)");
        if (instruction) {
			var auxSubstI = {Place: substituteInstruction.Place, Instruction: substituteInstruction.Instruction };
            setTimeout(function() {
				if(auxSubstI.Place == 'load')
				{
					// if(auxSubstI.Instruction.name == 'NoOp')
					// {
						// 	elem.detach();
						// 	containerPipeline.append("<div class='pipeline-item background-danger load'>" + auxSubstI.Instruction.name + "</div>");
						// }
						// else

					var elem = $('#entry-' + auxSubstI.Instruction.inOrder);
					elem.detach();
					containerPipeline.append(elem);
							// elem.detach();
							// containerPipeline.append("<div class='pipeline-item background-info decode'>" + auxSubstI.Instruction.name + "</div>")
				}
				else 
				{
					var elem = $('#entry-' + instruction.inOrder);
				}

				//containerPipeline.append("<div class='pipeline-item background-info load'>" + auxSubstI.Instruction.name + "</div>");
                elem.removeClass("decode");//muda as caracteristicas do html pra passar cada bloquinho para a proxima etapa(idem ao anterior)
                elem.addClass("load");
            }, 100);
        }
    }

    this.execute = function(instruction) {
        var result = {};

        var count = containerPipeline.children(".load").length;
        var elem = containerPipeline.children(".load:eq(0)");
        var isFlushing = pipeSim.fillNoop === 0;
        if (count) {
			setTimeout(function() {
                elem.removeClass("load");
                elem.addClass("execute");

                if (elem.hasClass("background-info") && isFlushing) {//background info eh "azul"
                    elem.removeClass("background-info");//retira o azul do bloquinho e coloca verde
                    elem.addClass("background-success");//nota: essas cores estao no .css              
                }
            }, 120);
        }
		if(isFlushing)
		{		
			if(instruction && instruction.type === DATA_TYPES.ARITHMETIC)
			{
				result.ula = instruction.executethis();
			}
			if (instruction && instruction.type === DATA_TYPES.CONTROL) {
				if (instruction.name === "BRANCH IF ZERO") {
					instruction.executethis();
				}
				console.log(instruction.params.branchResult, instruction.btbResult);
				if (instruction.params.branchResult !== instruction.btbResult)
				{
					this.flush(3);//comeco a dar flush se a previsao foi errada
					//console.log("gone flushing");
					if(instruction.params.branchResult)
					{//pula o pc para a instrucao alvo
						result.pc = instruction.getTargetAddr();
					}
					else
					{//senao pula o pc para + 1
						result.pc = instruction.address + 1;
					}
				}
				else if(instruction.params.branchResult && instruction.btbResult)
				{//previ certo (branch: verdadeiro e especulacao: verdadeiro)
				//devo invalidar o buffer q nao estou mais usando
					correctlyPredictedYes = true;
				}
			}	
		}

        return result;
    }

    this.store = function(instruction, result) {
        var count =  containerPipeline.children(".execute").length;
        var elem = containerPipeline.children(".execute:eq(0)");
        if (count) {
            setTimeout(function() {
                elem.removeClass("execute");
                elem.addClass("store");
            }, 140);
        }
        console.log("fillNoop", pipeSim.fillNoOp);
        if (pipeSim.fillNoop === 0) {
            if(result.ula != undefined && instruction && instruction.type === DATA_TYPES.ARITHMETIC)
            {
                instruction.params.dest.set(result.ula);
            }
			// Load and Store
			console.log("instruction && instruction.type === DATA_TYPES.DATA_TRANSFER", instruction)
            if(instruction && instruction.type === DATA_TYPES.DATA_TRANSFER) 
            {
                instruction.executethis(pipeSim.dataMemory);
            }
        }
    }

    this.end = function(interval, pc) {
        var count =  containerPipeline.children(".store").length;
        var instruction = containerPipeline.children(".store:eq(0)");
        var pipeline = $(".pipeline");
        var instructionList = $("#finalList");
        var instructionElem = $("<li class='list-group-item'>" + instruction.text() + "</li>");

        if (instruction.hasClass("background-success")) {
            instructionElem.addClass("list-group-item-success");
        }
        if (instruction.hasClass("background-danger")) {
            instructionElem.addClass("list-group-item-danger");
        }

        if (count) {
            instruction.addClass("out");
            setTimeout(function() {
                instruction.detach();
                instructionList.append(instructionElem);
                instructionList.animate({
                    scrollTop: instructionList[0].scrollHeight
                }, 200);
            }, 160);
        }
    }	
	
	this.flush = function(cicles) {
		pipeSim.fillNoop = cicles + 1;
		$(".fetch,.decode,.load").not(".background-danger").removeClass("background-info");
		//console.log("pipeSim.fillNoop: " + pipeSim.fillNoop);
		
		
		/*
		let elems = $(".fetch,.decode,.load").not(".background-danger");
		elems.removeClass('background-info');
		elems.addClass('background-danger');
		elems.text('NoOp');
		*/
		
		//console.log("psfn: " + pipeSim.fillNoop);
    }
}