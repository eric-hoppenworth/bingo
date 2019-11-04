function BingoList(){
    this.elements = [];
    this.called = [0];
    this.buttonRowTemplate = $('<div class="btn-toolbar px-3 justify-content-center" role="toolbar">');
    this.buttonRowTemplate.append($('<div class="btn-group mr-2" role="group">'));
    this.buttonTemplate = $('<button type="button" class="btn bingo-list-number">');
    this.container = $('#listContainer');
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
        this.container.append(myRow);
    }
};
BingoList.prototype.markNumber = function(value) {
    if (value != 0) {
        let index = parseInt(value) - 1;
        this.elements[index].addClass('active');
    }
};
BingoList.prototype.unmarkAll = function(value) {
    this.elements.forEach(function(element){
        element.removeClass('active');
    });
};
BingoList.prototype.clearNumbers = function() {
    db.ref('called/').set([]);
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
    this.user = user;
    this.card = [];
    let size = 20;
    this.container = $('#cardContainer');
    this.gridColumnTemplate = $('<div class="col">').append($('<div class="row flex-column">'));
    this.gridItemTemplate = $('<div class="col border border-black bingo-cell">').attr('data-daubed', 0);

    // look for a card in firebase, or make a new one
    db.ref('users/'+user.uid).once('value').then(function(snapshot){
        if (!snapshot.val() || !snapshot.val().card) {
            self.generateNewCard();
            db.ref('users/'+user.uid).set({
                card: self.card
            });
        } else {
            self.card = snapshot.val().card;
            self.render();
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

// listen for auth state changes.  your 'main' code should go in here
// this is called once on load, and any time auth state changes
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // load stuff
        numberList.render();
        myCard = new BingoCard(user);
        db.ref('users/'+user.uid+'/card').on('value', function(snapshot){
            myCard.render();
        });
        db.ref('users/'+user.uid).once('value').then(function(snapshot){
            if (snapshot.val() && snapshot.val().admin) {
                numberList.container.append(`
                    <div class="row justify-content-center">
                        <div class="col-3">
                            <button class="btn btn-primary btn-block" id="callBtn">Call</button>
                        </div>
                        <div class="col-3">
                            <button class="btn btn-danger btn-block" id="clearBtn">Clear All</button>
                        </div>
                    </div>
                `)
            }
        });

    } else {
        window.location = "./signin.html";
    }
});

// this is called once on load, and any time a value is updated, from ANY source.
db.ref('called/').on('value', function(snapshot){
    numberList.called = snapshot.val();
    numberList.unmarkAll();
    if (numberList.called) {
        numberList.called.forEach(function(item){
            numberList.markNumber(item);
        })
    } else {
        numberList.called = [];
    }

})


// need to be able to daub a card.
$('body').on('click', ".bingo-cell", function(){
    $(this).attr('data-daubed', $(this).attr('data-daubed') === "0" ? 1 : 0);
});
// need to be able to call bingo.

// need to be able to call a number
$('body').on('click', '#callBtn', function() {
    numberList.callNewNumber();
});
$('body').on('click', '#clearBtn', function() {
    numberList.clearNumbers();
});