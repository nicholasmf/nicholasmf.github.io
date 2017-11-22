# TCC 2017
# Autores:  Nicholas Makita Fujimoto
#           Guilherme Nishina Fortes
----------
**Adicionar um novo processador**
1. Adicionar uma pasta em /javascript/processors/{novo processador} e criar um arquivo pipeline.js.
	-As etapas do pipeline podem ser criadas individualmente usando o base.js, onde é definido uma classe base que pode ser usada como template para cada passo.
	-A função render de cada base pega a instrucao da etapa anterior e passa à própria etapa que ela representa.
	-Atenção especial deve ser tomada com os renders das etapas iniciais e finais de cada pipe, pois eles pegam e mandam para as listas.
	-Todas as interações das etapas devem ser programadas caso a caso para cada processador.
	-O pipe deve ter uma função pipeLoop(lista_de_intruções, intervalo_de_execução, preditor_de_desvio, gerenciador_de_dependências). Ver em simulator.js.
	-Em index.html, adicionar uma opção como <option value="seu_novo_pipe" selected>o_que_você_gostaria_que_aparecesse_no_botão</option> abaixo de <select class="form-control mr-sm-2" id="selectPipe">
1. Adicionar a tag `<script>` em /index.html para importar os arquivos desejados
1. Adicionar uma opção em /index.html no `<select>` de id "selectPipe" para o pipeline do novo processador e adicionar a opção na função "setPipe" em /javascript/index.js para a nova opção
1. Caso queira adicionar um novo preditor de desvio, adicionar um arquivo branch-prediction.js na pasta criada, adicionar a respectiva tag `<script>` e adicionar as opções no `<select>` de id "selectBP" e função "setBP"
   - O preditor de desvio deve possuir os seguintes métodos públicos: 
      - predict (instruction) - Deve receber a instrução de desvio a ser prevista - Deve retornar o endereço de desvio, caso resultado seja verdadeiro, undefined caso contrário
      - update (instruction, taken) - Deve receber a instrução de desvio e o resultado do branch - Deve atualizar sua cache
      - render (container) - Deve receber o elemento HTML onde o preditor será mostrado (case se deseje uma representação gráfica do mesmo) - Chama o render da cache
1. Caso queira adicionar um novo tratamento de dependências, adicionar um novo arquivo na pasta /javascript/dependency-handler, adicionar a respectiva tag `<script>` e adicionar uma nova opção no `<select>` de id "selectDH"
   - O tratamento de dependências deve possuir os seguintes métodos públicos:
      - insert (instruction) - Deve receber a instrução a ser decodificada - Deve retornar se foi possível realizar a inserção
      - wb (instruction) - Deve receber a instrução que está realizando a escrita nos registradores
      - getExecutables() - Deve retornar as instruções executáveis
1. Funções auxiliares estão definidas em /javascript/aux-functions
1. Códigos estão definidos em /javascript/index.js na função "setCode"
