function BingoList(){
    this.elements = [];
    this.called = [];
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
};
BingoList.prototype.clearNumbers = function () {
    this.elements.forEach(function(elem){
        elem.removeClass('active');
    });
};
BingoList.prototype.callNewNumber = function() {
    if (this.called.length === 75) {
        // all numbers have been called
        return false;
    }
    let number = Math.floor(Math.random()*75 + 1);
    while (this.called.includes(number)) {
        number = Math.floor(Math.random()*75 + 1);
    }
    this.called.push(number);
    db.ref('called/').set(this.called);
}

function BingoCard(user){
    let self = this;
    this.card = [];
    let size = 20;
    this.container = $('#cardContainer');
    this.gridColumnTemplate = $('<div class="col">').append($('<div class="row flex-column">'));
    this.gridItemTemplate = $('<div class="col border border-black" style="padding-top:'+(size*2)+'px; padding-bottom:'+(size*2)+'px; font-size:'+size+'px">');

    // look for a card in firebase, or make a new one
    db.ref('users/'+user.uid).once('value').then(function(snapshot){
        if (!snapshot.val()) {
            self.generateNewCard();
            db.ref('users/'+user.uid).set({
                card: self.card
            });
        } else {
            if (!snapshot.val().card) {
                self.generateNewCard();
                db.ref('users/'+user.uid).set({
                    card: self.card
                });
            } else {
                self.card = snapshot.val().card;
                self.render();
            }
        }
    });
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
BingoCard.prototype.generateNewCard = function () {
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
}

let numberList = new BingoList();
let myCard;
const db = firebase.database();


firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // load stuff
        numberList.render();
        myCard = new BingoCard(user);
        db.ref('users/'+user.uid+'/card').on('value', function(snapshot){
            myCard.render();
        });
    } else {
        window.location = "./signin.html";
    }
});

// listener for newly called items
db.ref('called/').on('value', function(snapshot){
    numberList.called = snapshot.val();
    numberList.called.forEach(function(item){
        numberList.markNumber(item);
    })
})


// need to be able to daub a card.
// need to be able to call bingo.
// need to be able to call a number