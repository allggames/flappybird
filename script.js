// script.js - VERSIÓN CORREGIDA

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CARGAR IMÁGENES (Enlaces seguros de GitHub) ---
const birdImg = new Image();
birdImg.src = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/yellowbird-midflap.png";

const bgImg = new Image();
bgImg.src = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/background-day.png";

const pipeNorthImg = new Image();
pipeNorthImg.src = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/pipe-green.png";

const pipeSouthImg = new Image();
pipeSouthImg.src = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/pipe-green.png"; 
// (Nota: rotaremos la tubería sur con código más abajo)

const fgImg = new Image();
fgImg.src = "https://raw.githubusercontent.com/samuelcust/flappy-bird-assets/master/sprites/base.png";


// --- VARIABLES DEL JUEGO ---
let frames = 0;

const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

// CONTROL
document.addEventListener("click", function(evt) {
    switch(state.current) {
        case state.getReady:
            state.current = state.game;
            break;
        case state.game:
            bird.flap();
            break;
        case state.over:
            bird.speedReset();
            pipes.reset();
            score.value = 0;
            state.current = state.getReady;
            break;
    }
});

document.addEventListener("keydown", function(e) {
    if (e.code === "Space") {
        if(state.current === state.getReady) state.current = state.game;
        else if(state.current === state.game) bird.flap();
        else if(state.current === state.over) {
            bird.speedReset();
            pipes.reset();
            score.value = 0;
            state.current = state.getReady;
        }
    }
});

// OBJETOS

const bg = {
    draw : function() {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Dibujamos el fondo real
        ctx.drawImage(bgImg, 0, canvas.height - 512); // Ajuste de altura
        ctx.drawImage(bgImg, bgImg.width, canvas.height - 512);
    }
}

const bird = {
    x : 50,
    y : 150,
    width : 34,
    height : 24,
    speed : 0,
    gravity : 0.25,
    jump : -4.6,
    
    draw : function() {
        // Dibujamos la imagen del pájaro
        ctx.drawImage(birdImg, this.x, this.y, this.width, this.height);
    },
    
    flap : function() {
        this.speed = this.jump;
    },
    
    update : function() {
        if(state.current == state.getReady) {
            this.y = 150 - 10 * Math.cos(frames/15); 
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.height/2 >= canvas.height - 112) { 
                this.y = canvas.height - 112 - this.height/2;
                if(state.current == state.game) {
                    state.current = state.over;
                }
            }
        }
    },
    speedReset : function() {
        this.speed = 0;
    }
}

const pipes = {
    position : [],
    w : 52,
    h : 400, // Altura base de la imagen de tubería
    dx : 2,
    gap : 100,
    
    draw : function() {
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // Tubería de arriba (Norte) - La invertimos visualmente
            ctx.save();
            ctx.translate(p.x + this.w, topY + this.h); 
            ctx.scale(-1, -1); // Voltear 180 grados
            ctx.drawImage(pipeNorthImg, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Tubería de abajo (Sur)
            ctx.drawImage(pipeSouthImg, p.x, bottomY, this.w, this.h);
        }
    },
    
    update : function() {
        if(state.current !== state.game) return;
        
        if(frames % 100 == 0) {
            this.position.push({
                x : canvas.width,
                y : -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            p.x -= this.dx;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Colisiones ajustadas
            if(bird.x + bird.width > p.x && bird.x < p.x + this.w && 
               (bird.y < p.y + this.h || bird.y + bird.height > bottomPipeYPos)) {
                state.current = state.over;
            }
            
            if(p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },
    
    reset : function() {
        this.position = [];
    }
}

const score = {
    best : localStorage.getItem("best") || 0,
    value : 0,
    
    draw : function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Impact";
            ctx.fillText(this.value, canvas.width/2, 50);
            ctx.strokeText(this.value, canvas.width/2, 50);
        } else if(state.current == state.over) {
            ctx.font = "25px Impact";
            ctx.fillText("Score: " + this.value, canvas.width/2 - 40, 180);
            ctx.fillText("Best: " + this.best, canvas.width/2 - 40, 220);
            ctx.fillStyle = "red";
            ctx.fillText("GAME OVER", canvas.width/2 - 60, 120);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#FFF";
            ctx.font = "30px Impact";
            ctx.fillText("GET READY", canvas.width/2 - 70, 200);
            ctx.strokeText("GET READY", canvas.width/2 - 70, 200);
        }
    }
}

// Suelo
const fg = {
    h: 112, // Altura de la imagen del suelo
    draw: function() {
        // Dibujar el suelo
        ctx.drawImage(fgImg, 0, canvas.height - this.h, canvas.width, this.h);
    }
}

function loop() {
    bird.update();
    pipes.update();
    
    bg.draw();
    pipes.draw();
    fg.draw(); // Dibujar suelo ENCIMA de tuberias
    bird.draw();
    score.draw();
    
    frames++;
    requestAnimationFrame(loop);
}

loop();
