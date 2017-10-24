//function PipelineIssuing {

	//essa funcao devera so ser invocada se instruction1.UPipe = true e instruction2.VPipe = true
	/*this.*/function pairingCheck(instruction1, instruction2, fillNoop) {
		
		//const pairableBoth = ["MOV", "PUSH", "POP", "LEA", "NOP", "INC", "DEC", "ADD", "SUB", "CMP", "CMP", "AND", "OR", "XOR"];
		//const pairableU = ["ADC", "SBB", "SHR", "SAR", "SHL", "SAL", "ROR", "ROL", "RCR", "RCL"];
		//const pairableV = ["NC", "SJ", "NJ", ]
		//colocar ou uma lista aqui com as instrucoes pareaveis ou colocar uma tag em cada instrucao
		
		
		
		if(instruction1.params.dest)
			console.log(instruction1.params.dest);
		if(instruction1.params.source)
			console.log(instruction1.params.source);
		if(instruction2.params.dest)
			console.log(instruction2.params.dest);
		if(instruction2.params.source)
			console.log(instruction2.params.source);
		console.log("fnop: " + fillNoop);
		
		
		if(fillNoop > 0)
			return true;
		
		//console.log(instruction1.name, instruction1.type);
		//para parear instrucao1 nao pode ser um jump
		if(instruction1.type === DATA_TYPES.CONTROL)
		{
			console.log("instruction1 is jump, no pair!");
			return false;
		}
		
		//verificar condicoes de disputa (rule 2)
		if(instruction1.params.dest !== undefined && typeof instruction1.params.dest === 'object')//se nao for objeto, nao eh registrador
		{
			if(instruction2.params.dest !== undefined && typeof instruction2.params.dest === 'object')//se nao for objeto, nao eh registrador
			{
				if(instruction1.params.dest === instruction2.params.dest)//se o destino de 1 for igual ao destino de 2 ja nao pode parear
				{
					//se fizer registradores parciais, colocar ifs aqui
					console.log("destino de 1 igual ao destino de 2");
					return false;
				}
				else//eh um registrador, mas os destinos sao diferentes
					return true;
			}
			else if(instruction2.params.source !== undefined && typeof instruction2.params.source === 'object')
			{
				if(instruction1.params.dest === instruction2.params.source)//se o destino de 1 for igual a fonte de 2 ja nao pode parear
				{
					//se fizer registradores parciais, colocar ifs aqui
					console.log("destino de 1 igual a fonte de 2");
					return false;
				}
				else//destino de 1 eh diferente da fonte de 2
					return true;
			}
			else
			{
				return true;
			}
		}
		else
			return true;//else, a instrucao 1 nao tem destino
	}
//}