function P5Pipe(htmlClass) {
    
	const pipeSim = this;
	this.fillNoop = 0;
	
	this.name = "P5";
	
	var instruction = new Array(2);//simula meu buffer de 2 posicoes
	var result = {}, lastResult = {};
    var decodeI, loadI, executeI, storeI; //var guarda a instrucao I na etapa n (nI)
	var lastStoreI;
	var lastInBuffer = 0;
	var pipeEnd = false;
	
	
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
	
	$(querySelectorString).append('<div class="activeBuffer p5Buffer-0 fiveStepFetchGhost"></div>');//o buffer ativo comeca com 0
	
    this.init = function(dataMemory) {
        pipeSim.dataMemory = dataMemory;
    }

	var correctlyPredictedYes;//retorna se o branch especulativo foi correto para o caso positivo
	
	//this.lastDecodeI;
	this.getPipeEnd = function ()
	{
		return pipeEnd;
	}
	
	this.getStoreInstruction = function()
	{
		return storeI;
	}
	
	this.getExecuteInstruction = function()
	{
		return executeI;
	}
	
	this.getLoadInstruction = function()
	{//load step is decode2
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
	this.p5cycle = function(BTB, instructions, pc, execution, fillNoop, substituteInstruction, pipeDo, inBuffer, cycle, pipeName, dh) {
	
		pipeSim.fillNoop = fillNoop;
		console.log("fillNoopstart", pipeSim.fillNoop);
		correctlyPredictedYes = false;
				
		if(pipeDo.store)
			lastResult = result;
		
		lastStoreI = storeI;//guarda a instrução em store da ultima iteracao
		if(pipeDo.execute)
			storeI = executeI;

		if(pipeDo.load)
			executeI = loadI;
		else
		{
			executeI = undefined;
		}
		
		if(pipeDo.decode)
			loadI = decodeI;
		
		//if(!pipeDo.fetch && inBuffer.changedLastIter && !instruction[inBuffer.number])
		//{//se o fetch estiver travado, mas eu mudei meu buffer e o fetch nao tem nada, devo executar mesmo assim
			//instruction[inBuffer.number] = pipeSim.fetchStep(pc, instructions, instruction[inBuffer.number]);
			//if(instruction[inBuffer.number])
			//{//adiciono a classe depois do fetch pq a funcao nao recebe o numero do buffer e apenas retorna a instrucao
				//$('#entry-'+instruction[inBuffer.number].inOrder).addClass("buffer-"+inBuffer.number);
			//}	
		//}
		
		if(pipeDo.fetch)
		{
			if(inBuffer.changedLastIter && fillNoop > 0)//so dou flush se errei a previsao
			{//se o buffer mudou na ultima iteracao, devo avancar com o flush das instrucoes do buffer errado (o anterior)
				if(inBuffer.number === 0)
				{
					decodeI = instruction[1];//falo para avancar com o buffer errado
					if(instruction[1])
					{
						var elem = $('#entry-' + instruction[1].inOrder);
						elem.detach();
					}
					console.log("wrong prediction: destroying instruction in buffer 1");
					instruction[1] = undefined;//e esvazio ele
				}
				else
				{
					decodeI = instruction[0];
					if(instruction[0])
					{
						var elem = $('#entry-' + instruction[0].inOrder);
						elem.detach();
					}
					console.log("wrong prediction: destroying instruction in buffer 0");
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
		if(decodeI && pipeDo.decode && pipeSim.fillNoop === 0 && decodeI.type === DATA_TYPES.CONTROL && !decodeI.branchAlreadyPredicted)
		{
			btbResult = BTB.predict(decodeI.address);//btbResult recebe o endereco da instrucao q irei pular para (especulativamente)
			decodeI.branchAlreadyPredicted = true;
		}
		else
			btbResult = undefined;
		
		if(btbResult != undefined && !decodeI.renderAlreadyPredicted)
		{
			$('.container.pipeline.'+ htmlClass).append("<div class='positivePredict p5DecodePredict In" + htmlClass +"'>Jump</div>");
			var fade_out = function() {
				$(".p5DecodePredict").fadeOut().remove();
			}

			setTimeout(fade_out, 840);
			decodeI.renderAlreadyPredicted = true;
		}
		else if (decodeI && decodeI.type === DATA_TYPES.CONTROL && !decodeI.renderAlreadyPredicted)
		{
			$('.container.pipeline.'+ htmlClass).append("<div class='p5DecodePredict In" + htmlClass + "'>No Jump</div>");
			var fade_out = function() {
				$(".p5DecodePredict").fadeOut().remove();
			}

			setTimeout(fade_out, 840);
			decodeI.renderAlreadyPredicted = true;
		}
		
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
				instruction[inBuffer.number] = pipeSim.fetchStep(pc, instructions, decodeI);
				if(instruction[inBuffer.number])
				{
					
					instruction[inBuffer.number].cycle = cycle;
					//console.log(entryString, inBufferString);
					$('#entry-'+instruction[inBuffer.number].inOrder).addClass("buffer-"+inBuffer.number);
				}
			}
			else
			{
				instruction[inBuffer.number] = pipeSim.fetchStep(-1, instructions, decodeI);
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
			loadI = substituteInstruction.Instruction;
			if(loadI)
			{
				//console.log("substituting in load step " + loadI.name + " in " + pipeName + "for " + substituteInstruction.Instruction.name);
				var elem = $('#entry-' + loadI.inOrder);
				elem.detach();
				containerPipeline.append(elem);
				elem.removeClass("decode");//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
				elem.addClass("load");//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
			}
				
		}
		

		if(pipeDo.decode)
		{
			console.log("executing " + pipeName + "decode");
			pipeSim.decode(substituteInstruction, loadI);
		}
			
		if(pipeDo.load)
		{
			console.log("executing " + pipeName + "load");
			pipeSim.load(substituteInstruction, loadI, dh, executeI);
		}
			
		if(pipeDo.execute)
		{
			console.log("executing " + pipeName + "execute");
			//console.log("INSTRUCTIONS: ",executeI, storeI);
			result = pipeSim.execute(executeI, storeI);//result eh da instrucao que esta no execute e lastResult eh da instrucao q ta no store
			console.log("result:", result);
			if(correctlyPredictedYes)
			{
				if(inBuffer.number === 0)
				{
					console.log("destroying instruction in buffer 1"); 
					if(instruction[1])
					{
						var elem = $('#entry-' + instruction[1].inOrder);
						elem.detach();
					}
					instruction[1] = undefined;//invalido a instrucao em fetch do outro buffer
					
				}
				else
				{
					console.log("destroying instruction in buffer 0"); 
					if(instruction[0])
					{
						var elem = $('#entry-' + instruction[0].inOrder);
						elem.detach();
					}
					instruction[0] = undefined;
				}
			}
		}
		
		if(pipeDo.store)
		{
			console.log("executing " + pipeName + "store");
			pipeSim.store(storeI, lastResult, dh, execution, pc, lastStoreI);
		}
		
		//pipeSim.end(execution, pc);
		
		if( !instruction[inBuffer.number] && !decodeI && !loadI && !executeI && !storeI )//se meu pipe estiver vazio depois de uma execucao, encerro
			pipeEnd = true;
			//clearInterval(execution);
		//console.log(executeI, result, pipeSim.fillNoop);

		if(executeI && executeI.type === DATA_TYPES.CONTROL && pipeSim.fillNoop%4 === 0 ){
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
		console.log("fillNoopend", pipeSim.fillNoop);
		return [result, pipeSim.fillNoop, btbResult, correctlyPredictedYes];
	}
	
	/*************** Fetch *********************/
    this.fetchStep = function(pc, instructions, decodeI) {//funcao q desenha as caixinhas a cada iteracao (1s)
		//var midCol = $("#pipelineDivGoesBeneath");
		//midCol.append(containerPipeline);
        //var pipeline = $('<div class="container pipeline">\n</div>');//$(".pipeline");	
        var instructionList = $("#instructions");
        //instructionList.children('.active').removeClass('active');
        // if (pipeSim.fillNoop > 0) {
        //     var instructionElem = $("<div class='pipeline-item background-danger fetch'>NoOp</div>");
        //     setTimeout(function() {
        //         //elem.detach();
        //         pipeline.append(instructionElem);
        //     }, 100);
        //     return new Instruction("NoOp");
        // }
        // else 
			
		
		
		 
		if(decodeI)
		{
			var elem = $('#entry-' + decodeI.inOrder);
			elem.removeClass("fetch");//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
			elem.addClass("decode");//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"	
		}
		
		
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
			instruction.executeMe = true;
			instruction.branchAlreadyPredicted = false;
			instruction.renderAlreadyPredicted = false;
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
            //setTimeout(function() {
				/*if(auxSubstI.Place === 'decode')
				{
					var elem = $('#entry-' + auxSubstI.Instruction.inOrder);
					elem.detach();
					containerPipeline.append(elem);
					// elem.detach();
					// containerPipeline.append("<div class='pipeline-item background-info decode'>" + auxSubstI.Instruction.name + "</div>")
				}*/
				//else 
				//{
					var elem = $('#entry-' + instruction.inOrder);
				//}
				elem.removeClass("decode");//muda as caracteristicas do html (abaixo) pra passar cada bloquinho para a proxima etapa
				elem.addClass("load");//"<div class='pipeline-item background-info fetch'>" + instruction.name + "</div>"
		//}, 80)
        }
				
    }

    this.load = function(substituteInstruction, instruction, dh, executeI) {
		//var elem = containerPipeline.children(".decode:eq(0)");
		
		if(executeI)
		{
			var elem = $('#entry-' + executeI.inOrder);
			elem.removeClass("load");
			elem.addClass("execute");
		}
		
        
		if (instruction) {
			var auxSubstI = {Place: substituteInstruction.Place, Instruction: substituteInstruction.Instruction };
            /*setTimeout(function() {
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
				{*/
					//var elem = $('#entry-' + executeI.inOrder);
				//}

				//containerPipeline.append("<div class='pipeline-item background-info load'>" + auxSubstI.Instruction.name + "</div>");
                //elem.removeClass("load");
                //elem.addClass("execute");
            //}, 100);
			
			if(auxSubstI.Place == 'load')
			{
				dh.insert(substituteInstruction.Instruction);
			}
			else
			{
				dh.insert(instruction);
			}
        }
    }

    this.execute = function(instruction, storeI) {
        var result = {};
		var isFlushing = pipeSim.fillNoop === 0;
		if(storeI)
		{
			var elem = $('#entry-' + storeI.inOrder);
			//if (elem) {
				//setTimeout(function() {
					elem.removeClass("execute");
					elem.addClass("store");

					if (elem.hasClass("background-info") && isFlushing) {//background info eh "azul"
						elem.removeClass("background-info");//retira o azul do bloquinho e coloca verde
						elem.addClass("background-success");//nota: essas cores estao no .css              
					}
				//}, 120);
			//}
		
		}
		console.log("isFlushing:", isFlushing);
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
					$('.container.pipeline.' + htmlClass).append("<div class='wrongBranch p5ExecuteBranch In" + htmlClass + "'>Misprediction</div>");
					var fade_out = function() {
						$(".p5ExecuteBranch").fadeOut().remove();
					}
					setTimeout(fade_out, 850);
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
					$('.container.pipeline.' + htmlClass).append("<div class='rightBranch p5ExecuteBranch In" + htmlClass + "'>Correct</div>");
					var fade_out = function() {
						$(".p5ExecuteBranch").fadeOut().remove();
					}
					setTimeout(fade_out, 850);
				}
				else
				{
					$('.container.pipeline.' + htmlClass).append("<div class='rightBranch p5ExecuteBranch In" + htmlClass + "'>Correct</div>");
					var fade_out = function() {
						$(".p5ExecuteBranch").fadeOut().remove();
					}
					setTimeout(fade_out, 850);
				}
			}
			//console.log("Execute instr:", instruction);
			if(instruction && instruction.type === DATA_TYPES.DATA_TRANSFER) 
			{//accesses memory
				instruction.storeData = instruction.executethis(pipeSim.dataMemory);
			}			
		}

        return result;
    }

    this.store = function(instruction, result, dh, interval, pc, lastStoreI) {
		//console.log("STORE:", instruction);
        //var elem = $('#entry-' + instruction.inOrder);
        //if (count) {
        //    setTimeout(function() {
                //elem.removeClass("execute");
               // elem.addClass("store");
        //    }, 140);
        //}
		pipeSim.end(interval, pc, lastStoreI);
        console.log("fillNoop", pipeSim.fillNoop);
        if (pipeSim.fillNoop === 0) {
            if(result.ula != undefined && instruction && instruction.type === DATA_TYPES.ARITHMETIC)
            {
                instruction.params.dest.set(result.ula);
            }
			// Load and Store
			//console.log("instruction && instruction.type === DATA_TYPES.DATA_TRANSFER", instruction)
            //if(instruction && instruction.type === DATA_TYPES.DATA_TRANSFER) 
            //{
            //   instruction.executethis(pipeSim.dataMemory);
            //}
			// Load and Store
			//console.log("store Instruction:", instruction);
			if(instruction && instruction.type === DATA_TYPES.DATA_TRANSFER && isNumber(instruction.storeData))
			{
				//console.log("hello!!1");
				instruction.params.dest.set(instruction.storeData);
			}
        }
		
		dh.remove(instruction);
    }

    this.end = function(interval, pc, instruction) {
		if(instruction)
		{
			var elem = $('#entry-' + instruction.inOrder);
			var pipeline = $(".pipeline");
			var instructionList = $("#finalList");
			var instructionElem = $("<li class='list-group-item'>" + elem.text() + "</li>");

			if (elem.hasClass("background-success")) {
				instructionElem.addClass("list-group-item-success");
			}
			if (elem.hasClass("background-danger")) {
				instructionElem.addClass("list-group-item-danger");
			}

			if (elem) {
				elem.addClass("out");
				setTimeout(function() {
					elem.detach();
					instructionList.append(instructionElem);
					instructionList.animate({
						scrollTop: instructionList[0].scrollHeight
					}, 200);
				}, 160);
			}
		}

    }	
	
	this.flush = function(cicles) {
		pipeSim.fillNoop = cicles + 1;
		//$(".fetch,.decode,.load").not(".background-danger").removeClass("background-info");
		//$(".fetch,.decode,.load").not(".background-danger").addClass("background-disabled");
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