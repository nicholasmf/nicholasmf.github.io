function fetchExecution(instructions, pc, cycle) {
	if(instructions[pc])
	{
		this.setStepInstruction(instructions[pc].copy());
		this.setStepInstructionCycle(cycle);
		if(instructions[pc].type === DATA_TYPES.CONTROL)
			this.setBranchAlreadyPredicted(false);//para verificar se ja previ o branch, e evita prever de novo se ocorrerem stalls
	}
	else
		this.setStepInstruction(undefined);
}

////////////////// end of fetch functions //////////////////////

function decode1UExecution(dh, branchPredictor) {
    let instruction = this.getStepInstruction();
    if (instruction && dh) {
        dh.insert(instruction);
    }
	var btbResult;	
	
	if(instruction && instruction.type === DATA_TYPES.CONTROL && !instruction.alreadyPredicted)//para verificar se ja previ o branch se ele ficar parado
	{//preciso executar se eu tiver um preditor ativo e se a instrucao for de branch
		branchPredictorResult = branchPredictor.predict(instruction);//branchPredictorResult recebe endereco de previsao se houver
		console.log("predictor result is: " + branchPredictorResult);
        instruction.btbResult = branchPredictorResult !== undefined;
		this.setBranchAlreadyPredicted(true);
    }
	else
	{
		console.log("predictor result is: dont see branch");
		branchPredictorResult = undefined;
	}
	return branchPredictorResult;
}

function decode1VExecution(dh, branchPredictor) {
    let instruction = this.getStepInstruction();
    if (instruction && dh) {
        dh.insert(instruction);
    }
	var btbResult;	
	
	if(instruction && instruction.type === DATA_TYPES.CONTROL && !instruction.alreadyPredicted)//para verificar se ja previ o branch se ele ficar parado
	{//preciso executar se eu tiver um preditor ativo e se a instrucao for de branch
		branchPredictorResult = branchPredictor.predict(instruction);//branchPredictorResult recebe endereco de previsao se houver
		console.log("predictor result is: " + branchPredictorResult);
        instruction.btbResult = branchPredictorResult !== undefined;
		this.setBranchAlreadyPredicted(true);
    }
	else
	{
		console.log("predictor result is: dont see branch");
		branchPredictorResult = undefined;
	}
	return branchPredictorResult;
}

////////////////// end of decode 1 instructions //////////////////////

function decode2UExecution() {}
function decode2VExecution() {}

////////////////// end of decode 2 instructions //////////////////////

function executeUExecution() {}
function executeVExecution() {}

////////////////// end of execute instructions //////////////////////

function storeUExecution() {}
function storeVExecution() {}

////////////////// end of store instructions //////////////////////

function P5Pipe() {
	
	
	this.init = function(dataMemory) {
		//p5Pipe.dataMemory = dataMemory;
    }
	
	const p5Pipe = this;
	
	this.fetchA = [new PipelineStep("fetch1A", fetchExecution, {canFetch: true, canGive: false}), new PipelineStep("fetch2A", fetchExecution, {canFetch: true, canGive: false}) ];//buffer A comecará como o sequencial
	this.fetchB = [new PipelineStep("fetch1B", fetchExecution, {canFetch: false, canGive: false}), new PipelineStep("fetch2B", fetchExecution, {canFetch: false, canGive: false})];//buffer b comecará como o alternativo
	
	this.decode1U = new PipelineStep("decode1U", decode1UExecution, {canReceive: true});
	this.decode1V = new PipelineStep("decode1V", decode1VExecution, {canReceive: true});

	this.decode2U = new PipelineStep("decode2U", decode2UExecution);
	this.executeU = new PipelineStep("executeU", executeUExecution);
    this.storeU = new PipelineStep("storeU", storeUExecution);
	
	this.decode2V = new PipelineStep("decode2V", decode2VExecution, {hasGiven: false});
	this.executeV = new PipelineStep("executeV", executeVExecution);
    this.storeV = new PipelineStep("storeV", storeVExecution);
	
	
	var pc = 0;
	var cycle = 0;
	var inBuffer = 0;
	
	var fetchAI = [], decode1UI, decode2UI, executeUI, storeUI;
	var fetchBI = [],decode1VI, decode2VI, executeVI, storeVI;
	
	
	this.pipeLoop = function(instructions, loopControl, branchPredictor, dependencyHandler)
	{	
		
		//// passar todos para frente antes das execucoes ///
		this.storeU.setStepInstruction( this.executeU.getStepInstruction() );
		this.executeU.setStepInstruction( this.decode2U.getStepInstruction() );
		
		this.storeV.setStepInstruction( this.executeV.getStepInstruction() );
		this.decode2V.hasGiven = false;//reset flags
		this.executeV.setStepInstruction( this.decode2V.getStepInstruction() );
		this.decode2V.hasGiven = true;//se eu passar a instrucao em decode2v adiante no pipe, hasGiven recebe true
		if(this.decode2V.hasGiven)
		{//se decode deu sua intrucao, devo jogar undefined, pois se ele nao receber intrucao, a anterior ficara presa, duplicando ela
			this.decode2V.setStepInstruction(undefined);//se decode2V receber uma nova instrucao a seguir, undefined sera sobreescrito, nao causando problemas
		}
		/////////////// logica para decode2 receber instrucoes ////////////////////
		var pairInstructions;
		if( !this.decode1U.canReceive && !this.decode1V.canReceive)//tenho 2 instrucoes validas nos decodes1, mas nao sei se tenho objetos validos
		{
			if(this.decode1U.getStepInstruction() && this.decode1V.getStepInstruction())
			{//se tiverem objetos validos nos 2 decodes1, pegar o de menor endereço		
				if(this.decode1U.getStepInstruction().address < this.decode1V.getStepInstruction().address)
				{
					this.decode2U.setStepInstruction( this.decode1U.getStepInstruction() );
					this.decode1U.canReceive = true;
				}
				else
				{
					this.decode2U.setStepInstruction( this.decode1V.getStepInstruction() );
					this.decode1V.canReceive = true;
				}
				if(this.decode1U.getStepInstruction().address < this.decode1V.getStepInstruction().address)
				{
					pairInstructions = pairingCheck(this.decode1U.getStepInstruction(), this.decode1V.getStepInstruction(), 0);
				}
				else
				{
					pairInstructions = pairingCheck(this.decode1V.getStepInstruction(), this.decode1U.getStepInstruction(), 0);
				}
				if(pairInstructions)//para ir instrucoes em decode2V, deve ter uma em cada decode1
				{//se as instrucoes parearem, devo pegar a de maior indice
					if(this.decode1U.getStepInstruction().address > this.decode1V.getStepInstruction().address)
					{
						this.decode2V.setStepInstruction( this.decode1U.getStepInstruction() );
						this.decode1U.canReceive = true;
					}
					else
					{//o outro fetch q tem a instrucao de maior endereco
						this.decode2V.setStepInstruction( this.decode1V.getStepInstruction() );
						this.decode1V.canReceive = true;
					}		
				}				
			}
			else
			{//apenas um dos decodes1 tem uma instrução que é objeto, nao pareio e devo mandar para o decode2 do pipe U
				pairInstructions = false;//settar para false apenas para possiveis verificacoes futuras
				if(this.decode1U.getStepInstruction())
				{
					this.decode2U.setStepInstruction( this.decode1U.getStepInstruction() );
					this.decode1U.canReceive = true;
				}
				else
				{//eh o decode1V que tem o objeto instrucao
					this.decode2U.setStepInstruction( this.decode1V.getStepInstruction() );
					this.decode1V.canReceive = true;
				}
			}
		}
		else
		{//tem apenas uma instrucao valida nos decodes1 (nao mando nada para V pq undefined e uma instrucao qlqr nao deve parear)
			if(!this.decode1U.canReceive)
			{//apenas1U tem uma instrucao valida
				this.decode2U.setStepInstruction( this.decode1U.getStepInstruction() );
				this.decode1U.canReceive = true;
			}
			else
			{//apenas decode1V tem a instrucao valida
				this.decode2U.setStepInstruction( this.decode1V.getStepInstruction() );
				this.decode1V.canReceive = true;
			}
		}
		///////// fim da logica para decode2 receber instrucoes ////////////////////
		
		////// logica para decode1 receber instrucoes /////////////
		if(this.fetchA[inBuffer].canGive && !this.fetchB[inBuffer].canGive)
		{//se tiver apenas 1 instrucao no buffer A e nada no buffer B
			if(this.decode1U.canReceive)
			{
				this.decode1U.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
				this.fetchA[inBuffer].canGive = false;
				this.decode1U.canReceive = false;
			}
			else if(this.decode1V.canReceive)
			{
				this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
				this.fetchA[inBuffer].canGive = false;
				this.decode1V.canReceive = false;
			}
		}
		else if(!this.fetchA[inBuffer].canGive && this.fetchB[inBuffer].canGive)
		{//tenho apenas 1 instrucao no buffer B e nenhuma no buffer A
			if(this.decode1U.canReceive)
			{
				this.decode1U.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
				this.fetchB[inBuffer].canGive = false;
				this.decode1U.canReceive = false;
			}
			else if(this.decode1V.canReceive)
			{
				this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
				this.fetchB[inBuffer].canGive = false;
				this.decode1V.canReceive = false;
			}
		}
		//tenho 1 intrucao em cada buffer e devo primeiro mandar a de menor indice
		else if( this.fetchA[inBuffer].canGive && this.fetchB[inBuffer].canGive )
		{
			if( this.fetchA[inBuffer].getStepInstruction() && this.fetchB[inBuffer].getStepInstruction() )
			{//caso para q tenho 2 objetos de instrucao de fato, assim posso comparar os enderecos
				if(this.decode1U.canReceive)
				{
					if(this.fetchA[inBuffer].getStepInstruction().address < this.fetchB[inBuffer].getStepInstruction().address)
					{
						this.decode1U.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.fetchA[inBuffer].canGive = false;
						this.decode1U.canReceive = false;
					}
					else
					{
						this.decode1U.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.fetchB[inBuffer].canGive = false;
						this.decode1U.canReceive = false;
					}
				}
				if(this.decode1V.canReceive)
				{
					if( this.fetchA[inBuffer].canGive && !this.fetchB[inBuffer].canGive )
					{
						this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.fetchA[inBuffer].canGive = false;
						this.decode1V.canReceive = false;
					}
					else if( !this.fetchA[inBuffer].canGive && this.fetchB[inBuffer].canGive )
					{
						this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.fetchB[inBuffer].canGive = false;
						this.decode1V.canReceive = false;
					}
					if( this.fetchA[inBuffer].canGive && this.fetchB[inBuffer].canGive )
					{
						if(this.fetchA[inBuffer].getStepInstruction().address < this.fetchB[inBuffer].getStepInstruction().address)
						{
							this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
							this.fetchA[inBuffer].canGive = false;
							this.decode1V.canReceive = false;
						}
						else
						{
							this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
							this.fetchB[inBuffer].canGive = false;
							this.decode1V.canReceive = false;
						}
					}
				}
			}
			else if(this.fetchA[inBuffer].getStepInstruction() || this.fetchB[inBuffer].getStepInstruction())
			{//nao tenho 2 objetos em fetch, talvez esteja terminando o programa, mas ainda preciso mandar corretamente o objeto e o undefined
				if(this.fetchA[inBuffer].getStepInstruction())
				{//minha instrucao esta no buffer A, devo mandar ela primeiro
					if(this.decode1U.canReceive)
					{
						this.decode1U.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.decode1U.canReceive = false;
						this.fetchA[inBuffer].canGive = false;
					}
					else if(this.decode1V.canReceive)
					{
						this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.decode1V.canReceive = false;
						this.fetchA[inBuffer].canGive = false;
					}
					if(this.decode1U.canReceive)
					{//pergunto 2 vezes pq os dois buffers tem coisas para dar e acima, se o A deu, o B dará para o outro decode1 que nao recebeu
						this.decode1U.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.decode1U.canReceive = false;
						this.fetchB[inBuffer].canGive = false;
					}
					else if(this.decode1V.canReceive)
					{
						this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.decode1V.canReceive = false;
						this.fetchB[inBuffer].canGive = false;
					}
				}
				else
				{//minha instrucao esta no buffer B
					if(this.decode1U.canReceive)
					{//devo mandar o objeto válido antes do objeto undefined, pergunto para os decodes1 quem quer receber de B
						this.decode1U.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.decode1U.canReceive = false;
						this.fetchB[inBuffer].canGive = false;
					}
					else if(this.decode1V.canReceive)
					{
						this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
						this.decode1V.canReceive = false;
						this.fetchB[inBuffer].canGive = false;
					}
					if(this.decode1U.canReceive)
					{
						this.decode1U.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.decode1U.canReceive = false;
						this.fetchA[inBuffer].canGive = false;
					}
					else if(this.decode1V.canReceive)
					{
						this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
						this.decode1V.canReceive = false;
						this.fetchA[inBuffer].canGive = false;
					}
				}
			}
			else
			{//nao tenho nenhum objeto instrucao em fetch, apenas mando para quem quiser receber (serão undefined e o pipe esvaziará)
				if(this.decode1U.canReceive)
				{
					this.decode1U.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
					this.decode1U.canReceive = false;
					this.fetchA[inBuffer].canGive = false;
				}
				else if(this.decode1V.canReceive)
				{
					this.decode1V.setStepInstruction( this.fetchA[inBuffer].getStepInstruction() );
					this.decode1V.canReceive = false;
					this.fetchA[inBuffer].canGive = false;
				}
				if(this.decode1U.canReceive)
				{
					this.decode1U.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
					this.decode1U.canReceive = false;
					this.fetchB[inBuffer].canGive = false;
				}
				else if(this.decode1V.canReceive)
				{
					this.decode1V.setStepInstruction( this.fetchB[inBuffer].getStepInstruction() );
					this.decode1V.canReceive = false;
					this.fetchB[inBuffer].canGive = false;
				}
			}
		}
		////// fim da logica para decode1 receber instrucoes /////////////
		
		//////////////// FETCH ///////////////////
		if(!this.fetchA[inBuffer].canGive)
		{//Se eu nao posso dar instrucoes, significa q nao tenho uma ou que já passei pra decode; posso dar fetch
			this.fetchA[inBuffer].execution(instructions, pc, cycle);
			this.fetchA[inBuffer].canGive = true;
			pc++;
		}
		if(!this.fetchB[inBuffer].canGive)
		{
			this.fetchB[inBuffer].execution(instructions, pc, cycle);
			this.fetchB[inBuffer].canGive = true;
			pc++;
		}
		//////// end of fetch //////////////////////
		
		fetchAI[0] = this.fetchA[0].getStepInstruction();
		fetchAI[1] = this.fetchA[1].getStepInstruction();
		decode1UI = this.decode1U.getStepInstruction();
		decode2UI = this.decode2U.getStepInstruction();
		executeUI = this.executeU.getStepInstruction();
		storeUI = this.storeU.getStepInstruction();
		
		fetchBI[0] = this.fetchB[0].getStepInstruction();
		fetchBI[1] = this.fetchB[1].getStepInstruction();
		decode1VI = this.decode1V.getStepInstruction();
		decode2VI = this.decode2V.getStepInstruction();
		executeVI = this.executeV.getStepInstruction();
		storeVI = this.storeV.getStepInstruction();
		
		if(fetchAI[inBuffer])
			console.log("FU: " + fetchAI[inBuffer].name + " " + fetchAI[inBuffer].address + " canGive: " + this.fetchA[inBuffer].canGive);
		if(decode1UI)
			console.log("D1U: " + decode1UI.name + " " + decode1UI.address + " canReceive: " + this.decode1U.canReceive);
		if(decode2UI)
			console.log("D2U: " + decode2UI.name + " " + decode2UI.address);
		if(executeUI)
			console.log("EU: " + executeUI.name + " " + executeUI.address);
		if(storeUI)	
			console.log("SU: " + storeUI.name + " " + storeUI.address);
		if(fetchBI[inBuffer])
			console.log("FV: " + fetchBI[inBuffer].name + " " + fetchBI[inBuffer].address + " canGive: " + this.fetchB[inBuffer].canGive);
		if(decode1VI)	
			console.log("D1V: " + decode1VI.name + " " + decode1VI.address + " canReceive: " + this.decode1V.canReceive);
		if(decode2VI)	
			console.log("D2V: " + decode2VI.name + " " + decode2VI.address);
		if(executeVI)	
			console.log("EV: " + executeVI.name + " " + executeVI.address);
		if(storeVI)	
			console.log("SV: " + storeVI.name + " " + storeVI.address);
		console.log("////////////////////////////");
		
		cycle++;
		
		if ( !(fetchAI[inBuffer] || decode1UI || decode2UI || executeUI || storeUI || fetchBI[inBuffer] || decode1VI || decode2VI || executeVI || storeVI) )
		{
			console.log("no u");
			clearInterval(loopControl);
		}
	}
}