var TestInstructionSet = new InstructionSet();
TestInstructionSet.ADD = function (dest, source)
{
    return new Instruction("ADD", DATA_TYPES.ARITHMETIC, null, { dest: dest, source: source}, true, function() {
        var sourceVal = getValue (this.params.source);//chamar getvalue para fazer uma operacao aritmetica com 2 numeros
        var soma = this.params.dest.get() + sourceVal;// + nao pode dar pau plx (obj com numero nao eh bom nesse caso)
        return soma;//this.params.dest.set(soma);

    }); 
};
TestInstructionSet.LOAD = function (dest, address) 
{ 
    return new Instruction("LOAD", DATA_TYPES.DATA_TRANSFER, null, {address: address, dest : dest}, true, function(memory) 
    {
        let value = memory.get(address);
        this.params.dest.set(value);
    });
};
TestInstructionSet.LOADI = function(dest, value) 
{
    return new Instruction("LOADI", DATA_TYPES.DATA_TRANSFER, null, {dest: dest, value: value}, true, function() 
    {
        this.params.dest.set(value);
    });
}
TestInstructionSet.STORE = function(source, address)
{
    return new Instruction("SAVE", DATA_TYPES.DATA_TRANSFER, null, {address: address, source: source}, true, function(memory)
    {
        let value = getValue(this.params.source);
        memory.set(address, value);
    });
}
TestInstructionSet.BRANCH_TRUE = function (dest)
{
    return new Instruction("BRANCH (true)", DATA_TYPES.CONTROL, null, { branchResult: true, branchTo: dest }, true);
};
TestInstructionSet.BRANCH_FALSE = function () 
{
    return new Instruction("BRANCH (false)", DATA_TYPES.CONTROL, null, { branchResult: false });
};
TestInstructionSet.BRANCH_IF_ZERO = function (source, dest)
{
    return new Instruction("BRANCH IF ZERO", DATA_TYPES.CONTROL, null, { source: source, branchTo: dest }, true, function()
    {
        if(getValue(this.params.source) === 0 )
        { 
            this.params.branchResult = true;
        } 
        else {
            this.params.branchResult = false;
        }

        //console.log(this.params.source.get());
    } );
};
// TestInstructionSet.DIVIDE = function ()
// {
//     return new Instruction("DIVISIBLE", DATA_TYPES.DIVISIBLE, [new MicroInstruction("ADD", DATA_TYPES.ARITHMETIC), new MicroInstruction("ADD", DATA_TYPES.ARITHMETIC)]);
// }
// TestInstructionSet.SET =  function (register, value) { 
//     return new Instruction("SET", null, null, { source: value, dest: register }, true); 
// };
TestInstructionSet.DUMMY = function() {
    let ins = new Instruction("DUMMY");
    ins.executableInV = true;
    return ins;
}