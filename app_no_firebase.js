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

    // FIREBASE TODO: update the top 'buttons' when `called` collection is updated
    // also, update 'last called' section with the last number called

    // FIREBASE TODO: update the winner screen when the winner changes

    // listener for calling numbers
    $('body').on('click', '#callBtn', function() {
        self.callNewNumber();
    });
    // listener to clear numbers
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
    // FIREBASE TODO: clear called numbers and clear the winner
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
    // FIREBASE TODO: update the called list
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
            // FIREBASE TODO: update the winner with the user's email address
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
            // FIREBASE TODO: update the winner with the user's email address
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
            // FIREBASE TODO: update the winner with the user's email address
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
            // FIREBASE TODO: update the winner with the user's email address
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

    // FIREBASE TODO: check firebase for a card, if there is none, create a new one

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
    let adminButtons = `
        <div class="row justify-content-center">
            <div class="col-3">
                <button class="btn btn-primary btn-block" id="callBtn">Call</button>
            </div>
            <div class="col-3">
                <button class="btn btn-danger btn-block" id="clearBtn">Clear All</button>
            </div>
        </div>
    `;
    if (user) {
        // load stuff
        let numberList = new BingoList();
        numberList.render();
        myCard = new BingoCard(user, numberList);

        // FIREBASE TODO: render the user's bingo card anytime it changes

        // FIREBASE TODO: check the logged in user for 'admin' property and conditionally render the buttons

    } else {
        window.location = "./signin.html";
    }
});

