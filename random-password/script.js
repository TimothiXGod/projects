const passwordBox= document.getElementById("password");
const lenght =12;

const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lowerCase = "abcdefghijklmnopqrstuvwxyz";
const number = "0123456789";
const symbol = "!@#$%^&*()_-+={[}]|<,>.?/";

const allChars= upperCase + lowerCase + number + symbol;

const slider= document.getElementById("length-slider");
const lengthValue = document.getElementById("length-value");

function createPassword(){

    const length = document.getElementById("length-slider").value;
    const useUpper = document.getElementById("uppercase").checked;
    const useLower = document.getElementById("lowercase").checked;
    const useNumbers = document.getElementById("numbers").checked;
    const useSymbols = document.getElementById("symbols").checked;
    let chars = "";

    if(useUpper) chars += upperCase;
    if(useLower) chars += lowerCase;
    if(useNumbers) chars += number;
    if(useSymbols) chars += symbol;

    if(chars === ""){
        alert("Please select at least one option!");
        return;
    }

    let password ="";

    while(password.length < length){
        password +=chars[Math.floor(Math.random()* chars.length)];
    }

    passwordBox.value = password;
}

function copyPassword(){

    if(passwordBox.value === ""){
        return;
    }

    navigator.clipboard.writeText(passwordBox.value);

    const message = document.getElementById("copy-message");

    message.style.display = "block";

    setTimeout(() => {
        message.style.display = "none";
    }, 2000);
}

lengthValue.textContent= slider.value;
slider.addEventListener("input", () =>{
    lengthValue.textContent= slider.value;
});