/********************** Associative cache ***********************
 * Params:  - size: cache size
 *          - ways: cache ways
 * Methods: - insert
 *          - update
 *          - search
 *          - render
 ****************************************************************/
/*********************** Cache node *****************************/
function cacheNode(tag, value, history) {
    const node = this;
    this.tag = tag || 0;
    this.value = value || 0;
    this.history = history || 0;

    this.getHistory = function() {
        return node.history.get ? node.history.get() : node.history;
    }
}

/************************ Cache *********************************/
 function associativeCache(size, ways) {
    const cache = this;
    this.size = size;
    this.ways = ways;
    this.sets = this.size/this.ways;
    this.cacheArray = []; // Each address represents a block

    // Insert element on cache
    this.insert = function(address, value, counter) {
        let set = address % this.sets;
        let tag = Math.floor(address / this.sets);
        let block = this.cacheArray[set];
        let newNode = new cacheNode(tag, value, counter);
        
        if (!block) {
            this.cacheArray[set] = [newNode];
        }
        else if (block.length === this.ways) { 
            let rand = Math.floor(Math.random() * 4);
            block[rand] = newNode;
        }
        else {
            block.push(newNode);
        }

        cache.update(address);
    }

    // Updates element on address and renders new value
    this.update = function(address, value) {
        let node = cache.search(address);
        let set = address % this.sets;
        
        if (!node) { return undefined; }
        if (value) {
            for (var property in value) {
                node[property] = value[property];
            }
        }

        if (cache.container) {
            let blockElem = cache.container.children().eq(set);
            let block = cache.cacheArray[set];

            var index;
            block.map((item, i) => {
                if (item === node) { index = i; }
            });

            let children = blockElem.children();
            children.eq(index * 4 + 1).text(node.tag);
            children.eq(index * 4 + 2).text(node.value);
            children.eq(index * 4 + 3).text(node.getHistory());
            
            cache.container.animate({
                scrollTop: blockElem[0].offsetTop - 100
            }, 200);
            blockElem.addClass('background-info');
            setTimeout(() => {
                blockElem.removeClass('background-info');
            }, 800);
        }
    }

    // Return undefined if not found or the value
    this.search = function(address) {
        let set = address % this.sets;
        let tag = Math.floor(address / this.sets);

        let block = this.cacheArray[set];

        if (!block) { return undefined; };
        if (block.length === 0) { return undefined; }
        return block.find(node => {
            return node.tag === tag;
        });
    }

    // Expects a HTML element to render into
    this.render = function(container) {
        var row = $("<div class='row'></div>");
        var col = $("<div class='col-xs-3 no-padding'></div>");

        cache.container = container;
        container.empty();
        for (let i = 0; i < cache.sets; i++) {
            let block = cache.cacheArray[i];
            let newRow = row.clone();

            for (let j = 0; j < cache.ways; j++) {
                let node = block ? block[j] : undefined;
                newRow.append(col.clone().text(j === 0 ? i : ""));
                newRow.append(col.clone().text(node ? node.tag : "0"));
                newRow.append(col.clone().text(node ? node.value : "0"));
                newRow.append(col.clone().text(node ? node.getHistory() : "0"));
            }

            container.append(newRow);
        }
    }
}