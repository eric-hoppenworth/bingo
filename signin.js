$('#signUp').on('click',function(event){
    event.preventDefault();
    const form = this.form;
    firebase.auth().createUserWithEmailAndPassword(form.email.value, form.password.value)
        .then(function(res){
            window.location = "./index.html";
        })
        .catch(function(error) {
            $(".errorDump").text(error.message);
        });
});
$('#signInForm').on('submit',function(event){
    event.preventDefault();
    const form = this;
    firebase.auth().signInWithEmailAndPassword(form.email.value, form.password.value)
        .then(function(res){
            window.location = "./index.html";
        })
        .catch(function(error) {
            $(".errorDump").text(error.message);
        });
});
