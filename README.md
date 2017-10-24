# TCC
# Authors:  Nicholas Makita Fujimoto
#           Guilherme
----------
**Adicionar um novo processador
1. Adicionar uma pasta em /javascript/processors/{novo processor} e criar um arquivo pipeline.js, caso a arquitetura utilize mais de um pipeline, adicionar um arquivo architecture.js para fazer a junção dos pipelines envolvidos
2. Adicionar a tag <script> em /index.html para importar os arquivos desejados
3. Adicionar uma opção em /index.html no "select" de id "selectPipe" para o pipeline do novo processador e adicionar a opção na função "setPipe" em /javascript/index.js para a nova opção
4. Caso queira adicionar um novo preditor de desvio, adicionar um arquivo branch-prediction.js na pasta criada, adicionar a respectiva tag <script> e adicionar as opções no <select> de id "selectBP" e função "setBP"
4.1. O preditor de desvio deve possuir os seguintes métodos públicos: 
 - predict (instruction) - Deve receber a instrução de desvio a ser prevista - Deve retornar o endereço de desvio, caso resultado seja verdadeiro, undefined caso contrário
 - update (instruction, taken) - Deve receber a instrução de desvio e o resultado do branch - Deve atualizar sua cache
 - render (container) - Deve receber o elemento HTML onde o preditor será mostrado (case se deseje uma representação gráfica do mesmo) - Chama o render da cache
5. Caso queira adicionar um novo tratamento de dependências, adicionar um novo arquivo na pasta /javascript/dependency-handler, adicionar a respectiva tag <script> e adicionar uma nova opção no <select> de id "
5.1. O tratamento de dependências deve possuir os seguintes métodos públicos:

6. Funções auxiliares estão definidas em /javascript/aux-functions
7. Códigos estão definidos em /javascript/index.js na função "setCode"