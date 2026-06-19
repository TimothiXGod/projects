console.log("Welcome to Tic Tac Toe")
const music = new Audio("music.mp3")
const audioTurn = new Audio("ting.mp3")
const gameover = new Audio("gameover.mp3")
let turn = "X"
let isgameover=false;

//To change the turn
const changeTurn=()=>{
    return turn === "X"?"O":"X"
}

//TO check for a win
const checkWin=()=>{
    let boxtext= document.getElementsByClassName('boxtext');
    let wins = [
        [0, 1, 2, 5, 5, 0],
        [3, 4, 5, 5, 15, 0],
        [6, 7, 8, 5, 25, 0],
        [0, 3, 6, -5, 15, 90],
        [1, 4, 7, 5, 15, 90],
        [2, 5, 8, 15, 15, 90],
        [0, 4, 8, 5, 15, 45],
        [2, 4, 6, 5, 15, 135],
    ]
    wins.forEach(e =>{
        if((boxtext[e[0]].innerText===boxtext[e[1]].innerText) && (boxtext[e[2]].innerText===boxtext[e[1]].innerText)&& (boxtext[e[0]].innerText !== "") ){
            document.querySelector('.info').innerText = boxtext[e[0]].innerText + " Won"
            gameover.play();
            isgameover=true;
            document.querySelector('.imgbox').getElementsByTagName('img')[0].style.width ="200px";
            boxtext[e[0]].parentElement.style.backgroundColor = "#79cd8c";
            boxtext[e[1]].parentElement.style.backgroundColor = "#79cd8c";
            boxtext[e[2]].parentElement.style.backgroundColor = "#79cd8c";
            return;
        }
    })
}

//TO check Draw
const checkDraw=()=>{
    let boxtexts=document.querySelectorAll('.boxtext');
    let draw=true;
    boxtexts.forEach(box =>{
        if(box.innerText ===''){
            draw=false;
        }
    });

    if(draw  && !isgameover){
        gameover.play();
        document.querySelector('.info').innerText="It's a Draw!";
        isgameover=true;
    }
}

//Game logic
let boxes = document.getElementsByClassName("box");
Array.from(boxes).forEach(element =>{
    let boxtext = element.querySelector('.boxtext');
    element.addEventListener('click',()=>{
        if(boxtext.innerText === '' && !isgameover){
            boxtext.innerText = turn;
            audioTurn.play();
            checkWin();
            checkDraw();
            if(!isgameover){
                turn = changeTurn();
                document.getElementsByClassName("info")[0].innerText ="Turn for " + turn;
            }
        }
    })
})

// on click for reset button
reset.addEventListener('click',()=>{
    let boxtexts = document.querySelectorAll('.boxtext');
    Array.from(boxtexts).forEach(element =>{
        element.innerText=""
    })
    Array.from(boxes).forEach(box =>{
        box.style.backgroundColor='';
    })
    turn ="X";
    isgameover=false
    document.getElementsByClassName("info")[0].innerText="Turn for " + turn;
    document.querySelector('.imgbox').getElementsByTagName('img')[0].style.width ="0px"
})