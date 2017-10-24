function P5Arq ()
{
	
	var uPipe = new P5Pipe('upipe');
	var vPipe = new P5Pipe('vpipe');
	
	const simArq = this;
    var execution;
	
    this.fillNoop = 0;
	
	var cycle = 0;
	this.pc = 2;
	var pcu = 0;
	var pcv = 1;
	var inBuffer = {number: 0, changedLastIter : false};
	this.vPipeDo = {fetch:true, decode:true, load:true, execute:true, store:true};//poderia ser var...
	this.uPipeDo = {fetch:true, decode:true, load:true, execute:true, store:true};
	
	var substituteInstructionU = {Instruction:null, Place:null};
	var substituteInstructionV = {Instruction:null, Place:null};
	
	
	this.BTB = new BTB();
	this.BTB.render($("#cacheContainer"));
	
	this.init = function(dataMemory) {
        simArq.dataMemory = dataMemory;
		uPipe.init(dataMemory);
		vPipe.init(dataMemory);
    }
	
	this.p5Arq = function(instructions, execution){
		console.log("////////////////////////////////////////////////////////////////////////////////////////////////////////////");
		console.log("ini pc: " + simArq.pc + " ini pcu: " + pcu + " ini pcv: " + pcv);
		
		var pairInstructions;
		
		
		//embora os pipes U e V so comecem de fato na terceira etapa, a logica do programa divide as duas primeiras em dois tb
		//O processador tem fetch e decode 1 em paralelo
		var uPipeCycle = uPipe.p5cycle(simArq.BTB, instructions, pcu, execution, simArq.fillNoop, substituteInstructionU, simArq.uPipeDo, inBuffer, cycle, "Upipe: ");
		var vPipeCycle = vPipe.p5cycle(simArq.BTB, instructions, pcv, execution, simArq.fillNoop, substituteInstructionV, simArq.vPipeDo, inBuffer, cycle, "Vpipe: ");
		substituteInstructionU.Instruction = null;
		substituteInstructionU.Place = null;
		substituteInstructionV.Instruction = null;
		substituteInstructionV.Place = null;
		console.log("mid pcu: " + pcu + " mid pcv: " + pcv);
		inBuffer.changedLastIter = false;
		
		var decodeI1 = uPipe.getDecodeInstruction();
		var decodeI2 = vPipe.getDecodeInstruction();
		
		var bufferAux;
		if (inBuffer.number === 0)
		{
			bufferAux = 1;
		}
		else
		{
			bufferAux = 0;
		}
		
		if(uPipeCycle[3] || vPipeCycle[3])
		{//um dos pipes previu corretamente um branch positivo
			console.log("someone is a psychic");
			if(uPipe.getFetchInstruction(bufferAux) === undefined)//esse if deveria ser sempre verdadeiro, mas esta aqui por motivos de seguranca
			{//se nao tiver nada em fetch no pipe u, ele ja foi invalidado e devo invalidar o buffer do outro pipe (lembrando q oficialmente ainda nao troquei o buffer)
				console.log("nothing in u pipe");
				if(inBuffer.number === 0)
					vPipe.setFetchInstruction(undefined, 1);
				else
					vPipe.setFetchInstruction(undefined, 0);
			}
			else if(vPipe.getFetchInstruction(bufferAux) === undefined)
			{
				console.log("nothing in v pipe");
				if(inBuffer.number === 0)
					uPipe.setFetchInstruction(undefined, 1);
				else
					uPipe.setFetchInstruction(undefined, 0);
			}
			
			if(uPipeCycle[3])
			{//devo invalidar a instrucao que peguei logo apos o branch se especulei verdadeiro e deu verdadeiro
				var uLoadI = uPipe.getLoadInstruction();
				var uExecI = uPipe.getExecuteInstruction();
				if(uLoadI && uExecI)
				{
					if(uLoadI.address != undefined && uLoadI.address != null && uExecI.address != undefined && uExecI.address != null)
					{//verificacao para saber se as instrucoes tem endereco valido (a q esta em exec deveria ter, ela eh um branch)
						if(uLoadI.address === uExecI.address + 1)
						{
							uPipe.setLoadInstruction(new Instruction("NoOp"));
						}
					}
				}
				
			}
		}
		
		//var updatePcInCheck = true;
		
		simArq.fillNoop = uPipeCycle[1] || vPipeCycle[1];
		
		//atribuicao de pc devido a branchs especulativos
		
		if (uPipeCycle[2])
		{
			console.log("btb has been updated from U");
			inBuffer.number === 0 ? inBuffer.number = 1 : inBuffer.number = 0;
			inBuffer.changedLastIter = true;//prevejo sim, sempre mudo buffer
			console.log("buffer is now: " + inBuffer.number);
			
			simArq.pc = uPipeCycle[2];
			
			/*attempts to create super buffer... still very dangerous
			if( !uPipe.getFetchInstruction(inBuffer.number) && !vPipe.getFetchInstruction(inBuffer.number) )
			{//se eu especular verdadeiro, devo me preparar para dar fetch nas instrucoes "longe", o buffer novo provavelmente estara vazio
				uPipe.setFetchInstruction(instructions[simArq.pc], inBuffer.number);
				pcu = simArq.pc++;
				vPipe.setFetchInstruction(instructions[simArq.pc], inBuffer.number);
				pcv = simArq.pc++;
				updatePcInCheck = false;
			}
			*/
			
        }
		else if (vPipeCycle[2])
		{
			console.log("btb has been updated from V");
			inBuffer.number === 0 ? inBuffer.number = 1 : inBuffer.number = 0;
			inBuffer.changedLastIter = true;
			console.log("buffer is now: " + inBuffer.number);

			simArq.pc = vPipeCycle[2];
			
			/*attempts to create supper buffer... still very dangerous
			if( !uPipe.getFetchInstruction(inBuffer.number) && !vPipe.getFetchInstruction(inBuffer.number) )
			{//se eu especular verdadeiro, devo me preparar para dar fetch nas instrucoes "longe", o buffer novo provavelmente estara vazio
				uPipe.setFetchInstruction(instructions[simArq.pc], inBuffer.number);
				pcu = simArq.pc++;
				vPipe.setFetchInstruction(instructions[simArq.pc], inBuffer.number);
				pcv = simArq.pc++;
				updatePcInCheck = false;
			}
			*/
		}
		
		//preciso pegar a posicao pc de cada instrucao
		if(decodeI1 && decodeI2) {//se tiver 2 instrucoes em decode, verifico pareamento
			console.log("decode1: " + decodeI1.address +  " decode2: " + decodeI2.address);
			if(decodeI1.address < decodeI2.address ) { //instrucoes estao em ordem no buffer i.e. [pc, pc+1]
				if(decodeI2.executableInV) {
					pairInstructions = pairingCheck(decodeI1, decodeI2, simArq.fillNoop-2);//se true, nao preciso alterar nada, so avancar com os pipes
					if(!pairInstructions)
					{//os decodes estao em ordem, mas nao irei parear
						//avanco o pipe u normalmente, e devo apenas avancar as 3 etapas finais de v, deixando fetch (v) e decode (v) parados
						simArq.vPipeDo.fetch = simArq.vPipeDo.decode = false;
						simArq.vPipeDo.load = simArq.vPipeDo.execute = simArq.vPipeDo.store = true;
						simArq.uPipeDo.fetch = simArq.uPipeDo.decode = simArq.uPipeDo.load = simArq.uPipeDo.execute = simArq.uPipeDo.store = true;
						
						if(simArq.pc !=-1)//evitar pau na condicao de parada
						{
							//if(updatePcInCheck)
								pcu = simArq.pc++;//sempre atualizo pcu nesse caso, mas devo verificar um caso especial para pcv
							if(!simArq.vPipeDo.fetch && inBuffer.changedLastIter && !vPipe.getFetchInstruction[inBuffer.number])
								pcv = simArq.pc++;//devo pegar a proxima instrucao em fetch especulado, se nao fizer isso pego sequencial
						}
						
						substituteInstructionV.Instruction = new Instruction("NoOp"); //a lacuna
						substituteInstructionV.Place = "load";//executo e coloco
						
					}
					else
					{//pareei
						simArq.uPipeDo.fetch = simArq.uPipeDo.decode = simArq.uPipeDo.load = simArq.uPipeDo.execute = simArq.uPipeDo.store = true;
						simArq.vPipeDo.fetch = simArq.vPipeDo.decode = simArq.vPipeDo.load = simArq.vPipeDo.execute = simArq.vPipeDo.store = true;
						if(simArq.pc !=-1)//evitar pau na condicao de parada
						{
							//if(updatePcInCheck)
							//{
								pcu = simArq.pc++;
								pcv = simArq.pc++;
							//}
						}

					}
				}
				else
				{//instrucao nao eh executavel em V
					pairInstructions = false;
				}
			}
			else if(decodeI1.address > decodeI2.address){//instrucoes estao em ordem reversa no buffer i.e. [pc, pc-1] (acontece se instrucoes nao sao pareadas e o pipe V fica vazio)
				if(decodeI1.executableInV) {
					//console.log("message should appear");
					pairInstructions = pairingCheck(decodeI2, decodeI1, simArq.fillNoop-2);
					if(pairInstructions)
					{//devo parear instrucoes, mas estao em decodes trocados
						//troco as instrucoes em decode de cada pipe com o outro e avanco as etapas (na proxima iteracao); posso avancar pc em 1
						substituteInstructionU.Instruction = vPipe.getDecodeInstruction();
						substituteInstructionV.Instruction = uPipe.getDecodeInstruction();
						substituteInstructionU.Place = "load";//apenas troco
						substituteInstructionV.Place = "load";
						
						simArq.uPipeDo.fetch = simArq.uPipeDo.decode = simArq.uPipeDo.load = simArq.uPipeDo.execute = simArq.uPipeDo.store = true;
						simArq.vPipeDo.fetch = simArq.vPipeDo.decode = simArq.vPipeDo.load = simArq.vPipeDo.execute = simArq.vPipeDo.store = true;
						
						if(simArq.pc !=-1)//evitar pau na condicao de parada
						{
							//if(updatePcInCheck)
							//{
								pcu = simArq.pc++;
								pcv = simArq.pc++;		
							//}
						}
					}
					else
					{//nao irei parear e as instrucoes em decode estao trocadas
						//avanco v pipe normalmente, mas a instrucao em decode deverá ir para LOAD de u, deixando uma lacuna em LOAD de v
						//devo tambem nao avancar fetch e decode de u
						simArq.vPipeDo.fetch = simArq.vPipeDo.decode = simArq.vPipeDo.load = simArq.vPipeDo.execute = simArq.vPipeDo.store = true;
						simArq.uPipeDo.fetch = simArq.uPipeDo.decode = false;
						simArq.uPipeDo.load = simArq.uPipeDo.execute = simArq.uPipeDo.store = true;
						
						substituteInstructionU.Instruction = vPipe.getDecodeInstruction();//executo as 3 etapas finais e troco
						substituteInstructionU.Place = "load";
						substituteInstructionV.Instruction = new Instruction("NoOp"); //a lacuna
						substituteInstructionV.Place = "load";
						
						if(simArq.pc !=-1)//evitar pau na condicao de parada
						{
							if(!simArq.uPipeDo.fetch && inBuffer.changedLastIter && !uPipe.getFetchInstruction[inBuffer.number])
								pcu = simArq.pc++;//devo pegar a proxima instrucao em fetch especulado, se nao fizer isso pego sequencial
							//if(updatePcInCheck)
								pcv = simArq.pc++;
						}

					}
				}
				else
				{
					pairInstructions = false;
				}
			}
			else
				pairInstructions = true;
		}
		else 
		{//nao tem 2 instrucoes em decode, nao ha o q parear
			console.log("nao tem 2 instrucoes em decode");
			pairInstructions = false;
			if(!decodeI1)
			{//nao tem nada no decode de U
				if(!decodeI2)
				{//nao tem nada no decode de V
					/*
					if(simArq.pc !=-1)//evitar pau na condicao de parada
					{	
						//if(updatePcInCheck)
						//{
							pcu = simArq.pc++;
							pcv = simArq.pc++;
						//}
					//acontece no inicio do programa, quando nao deu tempo de ter nada em decode; avanco os pipes normalmente
					}
					*/
				}
				else
				{//nao tem nada em decode U, mas tem em decode V (acontece no final do programa e em alguns casos especiais)
					substituteInstructionU.Instruction = vPipe.getDecodeInstruction();//devo mandar para o U pipe; avanco os dois normalmente
					substituteInstructionU.Place = "load";
					substituteInstructionV.Instruction = new Instruction("NoOp");
					substituteInstructionV.Place = "load";
				}
			}
			//se tiver em decode U, mas nao em decode V, nao preciso fazer nada, apenas avanco normalmente com os pipes
			//de qlqr modo, os pipes avancarao completamente
			simArq.uPipeDo.fetch = simArq.uPipeDo.decode = simArq.uPipeDo.load = simArq.uPipeDo.execute = simArq.uPipeDo.store = true;
			simArq.vPipeDo.fetch = simArq.vPipeDo.decode = simArq.vPipeDo.load = simArq.vPipeDo.execute = simArq.vPipeDo.store = true;
			pcu = simArq.pc++;
			pcv = simArq.pc++;
		}

		
		//atualizacoes de pc devido a branchs
		if (uPipeCycle[0].pc != null && uPipeCycle[0].pc != undefined)
		{
			simArq.pc = uPipeCycle[0].pc;
			if(simArq.pc !=-1)//evitar pau na condicao de parada
			{
				pcu = simArq.pc++;
				pcv = simArq.pc++;
			}
		}
		else if (vPipeCycle[0].pc != null && vPipeCycle[0].pc != undefined)
		{
			simArq.pc = vPipeCycle[0].pc;

			if(simArq.pc !=-1)//evitar pau na condicao de parada?
			{
				pcu = simArq.pc++;
				pcv = simArq.pc++;
			}
		}
		
		/*
		else if (simArq.pc >= instructions.length)
		{//assim da problema na hora de pegar as instrucoes do final
			simArq.pc = -1;
			pcu = -1;
			pcv = -1;
		}
		*/
		
		if(pcu >= instructions.length)
			pcu = -1;
		if(pcv >= instructions.length)
			pcv = -1;
		
		if (simArq.fillNoop > 0) 
		{
			if(simArq.fillNoop === 4)
			{//se eu errei a previsao e o branch foi tomado, devo dar flush no buffer atual sem mudar o buffer
			//mas se eu errei a previsao e o branch nao foi tomado, devo dar flush, trocando os buffers
				if(uPipeCycle[0] || vPipeCycle[0])
				{
					console.log("mistakes were made, just flushing my pipe");
				}
				else
				{
					inBuffer.number === 0 ? inBuffer.number = 1 : inBuffer.number = 0;
					inBuffer.changedLastIter = true;
					console.log("mistakes were made, buffer is now: " + inBuffer.number);
				}
			}
				
			simArq.fillNoop--;
		}
		
		console.log("pc: " + simArq.pc + " pcu: " + pcu + " pcv: " + pcv);
		if(decodeI1 && decodeI2)
			console.log("pair: " + decodeI1.name + "/" + decodeI2.name + ": " + pairInstructions);
		
		cycle++;
		
	}	
	
}