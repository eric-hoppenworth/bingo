function BingoList(){
    this.elements = [];

    this.buttonRowTemplate = $('<div class="btn-toolbar px-3 justify-content-center" role="toolbar">');
    this.buttonRowTemplate.append($('<div class="btn-group mr-2" role="group">'));
    this.buttonTemplate = $('<button type="button" class="btn bingo-list-number">');
    this.contianer = $('#listContainer');
}
BingoList.prototype.render = function() {
    const letters = ["B","I","N","G","O"];
    for (let i = 0; i < 5; i++) {
        let myRow = this.buttonRowTemplate.clone();
        myRow.children().eq(0).append(this.buttonTemplate.clone().text(letters[i]).addClass('btn-dark'));
        for (let j = 1; j <= 15; j++) {
            let number = i*15 + j;
            let button = this.buttonTemplate.clone().addClass(i%2 ? 'btn-light' : 'btn-secondary');
            button.text(number < 10 ? '0' + number : number);
            button.attr('data-number', number);
            myRow.children().eq(0).append(button);
            this.elements.push(button);
        }
        this.contianer.append(myRow);
    }
};
BingoList.prototype.markNumber = function(value) {
    let index = parseInt(value) - 1;
    this.elements[index].addClass('active');
}
BingoList.prototype.clearNumbers = function () {
    this.elements.forEach(function(elem){
        elem.removeClass('active');
    });
};

function BingoCard(){
    this.card = [];
    let size = 20;
    this.container = $('#cardContainer');
    this.gridColumnTemplate = $('<div class="col">').append($('<div class="row flex-column">'));
    this.gridItemTemplate = $('<div class="col border border-black" style="padding-top:'+(size*2)+'px; padding-bottom:'+(size*2)+'px; font-size:'+size+'px">');

    for (let i = 0; i < 5; i++) {
        let row = [];
        for (let j = 0; j < 5; j++) {
            // roll a number from 1 to 15
            let adjuster = i*15;
            let number = (Math.floor(Math.random()*15) + 1) + adjuster;
            while (row.includes(number)) {
                // re roll until it is unique
                number = (Math.floor(Math.random()*15) + 1) + adjuster;
            }
            row.push(number)

        }
        this.card.push(row);
    }
    // add the free space
    this.card[2][2] = 'Free Space';
    // send up to firebase?
}
BingoCard.prototype.render = function() {
    let self = this;
    this.card.forEach(function(column){
        const gridColumn = self.gridColumnTemplate.clone();
        column.forEach(function(item){
            let gridItem = self.gridItemTemplate.clone();
            gridItem.text(item);
            gridColumn.children().eq(0).append(gridItem);
        });
        self.container.append(gridColumn);
    });
}



const numberList = new BingoList();
numberList.render();

const myCard = new BingoCard();