// global database variable for convenience access
const db = firebase.database();

function BingoList(user){
    this.letters = ["B","I","N","G","O"];
    this.elements = [];
    this.called = [];
    this.buttonRowTemplate = $('<div class="btn-toolbar px-3 justify-content-center" role="toolbar">');
    this.buttonRowTemplate.append($('<div class="btn-group mr-2" role="group">'));
    this.buttonTemplate = $('<button type="button" class="btn bingo-list-number">');
    this.container = $('#listContainer');
    let self = this;

    // firebase listener for the 'called' collection
    // this is called once on load, and any time a value is updated, from ANY source.
    db.ref('called/').on('value', function(snapshot){
        self.called = snapshot.val();
        self.unmarkAll();
        if (self.called) {
            self.called.forEach(function(item){
                self.markNumber(item);
            });
        } else {
            self.called = [];
        }
        if (self.called.length) {
            let number = self.called[self.called.length - 1];
            let letter = self.letters[Math.floor((number-1)/15)];
            $("#lastCalled").text(letter+"-"+number);
        } else {
            $("#lastCalled").text('');
        }
    });
    db.ref('winner/').on('value', function(snapshot){
        if (snapshot.val() && snapshot.val().name) {
            // print the winner
            $('#winner').text(snapshot.val().name);
        } else {
            // empty the winner
            $('#winner').text('');
        }
    });

    // listener for calling numbers
    $('body').on('click', '#callBtn', function() {
        self.callNewNumber();
    });
    // listener to clear numbers
    // TODO this should also clear out the winner
    $('body').on('click', '#clearBtn', function() {
        self.clearNumbers();
    });

}
BingoList.prototype.render = function() {
    for (let i = 0; i < 5; i++) {
        let myRow = this.buttonRowTemplate.clone();
        myRow.children().eq(0).append(this.buttonTemplate.clone().text(this.letters[i]).addClass('btn-dark'));
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
// UI updating
BingoList.prototype.markNumber = function(value) {
    if (value != 0) {
        let index = parseInt(value) - 1;
        this.elements[index].addClass('active');
    }
};
// UI updating
BingoList.prototype.unmarkAll = function(value) {
    this.elements.forEach(function(element){
        element.removeClass('active');
    });
};
// firebase updating
BingoList.prototype.clearNumbers = function() {
    db.ref('called/').set([]);
    db.ref('winner/').set({});

};
// firebase updating
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
};

// game logic for win condition.
// p.s. appologies for the silly and unreadable code
BingoList.prototype.checkCard = function(bingoCard) {
    // check each row+column to see if the whole thing is in the 'called' array.
    // remember, there is a free space.
    let card = bingoCard.card;
    // check columns
    let hasBingo = false;
    for (let i = 0; i < card.length; i++) {
        let matchedItems = 0;
        for (let j = 0; j < card[i].length; j++) {
            if (this.called.includes(card[i][j]) || card[i][j] === bingoCard.FREE_SPACE_MARKER) {
                // also check if the player has this daubed on the screen
                if (bingoCard.elements[i][j].attr('data-daubed') === "1") {
                    matchedItems++;
                }
            }
        }
        if (matchedItems === 5) {
            db.ref('/winner').set({name: user.email});
            return true;
        }
    }
    // check rows
    for (let i = 0; i < card.length; i++) {
        let matchedItems = 0;
        for (let j = 0; j < card.length; j++) {
            if (this.called.includes(card[j][i]) || card[j][i] === bingoCard.FREE_SPACE_MARKER) {
                // also check if the player has this daubed on the screen
                if (bingoCard.elements[j][i].attr('data-daubed') === "1") {
                    matchedItems++;
                }
            }
        }
        if (matchedItems === 5) {
            db.ref('/winner').set({name: user.email});
            return true;
        }
    }
    // left to right diagonal
    let matchedItems = 0;
    for (let i = 0; i < card.length; i++) {
        if (this.called.includes(card[i][i]) || card[i][i] === bingoCard.FREE_SPACE_MARKER) {
            // also check if the player has this daubed on the screen
            if (bingoCard.elements[i][i].attr('data-daubed') === "1") {
                matchedItems++;
            }
        }
        if (matchedItems === 5) {
            db.ref('winner/').set({name: user.email});
            return true;
        }
    }
    // right to left diagonal
    matchedItems = 0;
    for (let i = 0; i < card.length; i++) {
        let row = card.length - 1 - i;
        if (this.called.includes(card[row][i]) || card[row][i] === bingoCard.FREE_SPACE_MARKER) {
            // also check if the player has this daubed on the screen
            if (bingoCard.elements[row][i].attr('data-daubed') === "1") {
                matchedItems++;
            }
        }
        if (matchedItems === 5) {
            db.ref('/winner').set({name: user.email});
            return true;
        }
    }
    return false;
};

function BingoCard(user, list){
    let self = this;
    this.user = user;
    this.card = [];
    this.elements = [];
    this.FREE_SPACE_MARKER = 'Free Space';
    let size = 20;
    this.container = $('#cardContainer');
    this.gridColumnTemplate = $('<div class="col">').append($('<div class="row flex-column">'));
    this.gridItemTemplate = $('<div class="col border border-black bingo-cell">').attr('data-daubed', 0);

    // look for a card in firebase, or make a new one
    // this card doesn't recieve updates, since we daub only in browser memory.
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

    // daub a card.
    $('body').on('click', ".bingo-cell", function(){
        $(this).attr('data-daubed', $(this).attr('data-daubed') === "0" ? 1 : 0);
    });
    $('body').on('click', '#bingoBtn', function() {
        list.checkCard(self);
    });
}
BingoCard.prototype.render = function() {
    let self = this;
    this.card.forEach(function(column, columnIndex){
        const gridColumn = self.gridColumnTemplate.clone();
        self.elements.push([]);
        column.forEach(function(item){
            let gridItem = self.gridItemTemplate.clone();
            gridItem.text(item);
            gridColumn.children().eq(0).append(gridItem);
            self.elements[columnIndex].push(gridItem);
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
    this.card[2][2] = this.FREE_SPACE_MARKER;
}

// listen for auth state changes.  your 'main' code should go in here
// this is called once on load, and any time auth state changes
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // load stuff
        let numberList = new BingoList();
        numberList.render();
        myCard = new BingoCard(user, numberList);

        // render the card any time it is changed.
        db.ref('users/'+user.uid+'/card').on('value', function(snapshot){
            myCard.render();
        });

        // one time, after authentication is verified, conditionally print the call and clear buttons
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

