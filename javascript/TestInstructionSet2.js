var Test2InstructionSet = new InstructionSet();

Test2InstructionSet.ADD = function (dest, source1, source2)
{
    return new Instruction("ADD", DATA_TYPES.ARITHMETIC, null, { dest: dest, source1: source1, source2: source2}, true, function() {
        var source1Val = getValue(this.params.source1);//chamar getvalue para fazer uma operacao aritmetica com 2 numeros
        var source2Val = getValue(this.params.source2);
        var soma = source1Val + source2Val;// + nao pode dar pau plx (obj com numero nao eh bom nesse caso)
        return soma;//this.params.dest.set(soma);

    }); 
};
Test2InstructionSet.LOAD = function (dest, address) 
{ 
    return new Instruction("LOAD", DATA_TYPES.DATA_TRANSFER, null, {address: address, dest : dest}, true, function(memory) 
    {
        let value = memory.get(address);
        this.params.dest.set(value);
    });
};
Test2InstructionSet.LOADI = function(dest, value) 
{
    return new Instruction("LOADI", DATA_TYPES.DATA_TRANSFER, null, {dest: dest, value: value}, true, function() 
    {
        this.params.dest.set(value);
    });
}
Test2InstructionSet.STORE = function(source, address)
{
    return new Instruction("SAVE", DATA_TYPES.DATA_TRANSFER, null, {address: address, source: source}, true, function(memory)
    {
        let value = getValue(this.params.source);
        memory.set(address, value);
    });
}
Test2InstructionSet.BRANCH_TRUE = function (dest)
{
    return new Instruction("BRANCH (true)", DATA_TYPES.CONTROL, null, { branchResult: true, branchTo: dest }, true);
};
Test2InstructionSet.BRANCH_FALSE = function () 
{
    return new Instruction("BRANCH (false)", DATA_TYPES.CONTROL, null, { branchResult: false });
};
Test2InstructionSet.BRANCH_IF_ZERO = function (source, dest)
{
    return new Instruction("BRANCH IF ZERO", DATA_TYPES.CONTROL, null, { source: source, branchTo: dest }, true, function()
    {
        if(this.params.source.get() === 0 )
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
Test2InstructionSet.DUMMY = function() {
    return new Instruction("DUMMY");
}