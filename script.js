// script.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES DEL JUEGO ---
let frames = 0;
const degree = Math.PI / 180;

// Estado del juego
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

// CONTROL: Detectar clicks o tecla espacio
document.addEventListener("click", function(evt) {
    switch(state.current) {
        case state.getReady:
            state.current = state.game;
            break;
        case state.game:
            bird.flap();
            break;
        case state.over:
            // Reinicio simple al hacer click en Game Over
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

// OBJETOS DEL JUEGO

// Fondo (Nubes simples)
const bg = {
    draw : function() {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar algunas nubes simuladas
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(50, 400, 30, 0, Math.PI * 2);
        ctx.arc(100, 400, 40, 0, Math.PI * 2);
        ctx.arc(250, 420, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

// El Pájaro
const bird = {
    x : 50,
    y : 150,
    width : 34,
    height : 26,
    
    speed : 0,
    gravity : 0.25,
    jump : -4.6,
    
    draw : function() {
        ctx.fillStyle = "#FFD700"; // Color amarillo
        ctx.strokeStyle = "#000";
        
        if(state.current == state.getReady) {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.strokeRect(0, 0, this.width, this.height);
            // Ojo
            ctx.fillStyle = "#FFF";
            ctx.fillRect(20, 2, 10, 10); 
            ctx.restore();
        }
    },
    
    flap : function() {
        this.speed = this.jump;
    },
    
    update : function() {
        // Si estamos en 'Get Ready', el pájaro flota lento
        if(state.current == state.getReady) {
            this.y = 150 - 10 * Math.cos(frames/15); 
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Colisión con el suelo
            if(this.y + this.height/2 >= canvas.height - 50) { 
                this.y = canvas.height - 50 - this.height/2;
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

// Tuberías
const pipes = {
    position : [],
    w : 53,
    h : 400,
    dx : 2,
    gap : 100,
    
    draw : function() {
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            ctx.fillStyle = "#2ecc71"; // Verde
            ctx.strokeStyle = "#000"; // Borde negro
            
            // Tubería Norte
            ctx.fillRect(p.x, topY, this.w, this.h);
            ctx.strokeRect(p.x, topY, this.w, this.h);
            
            // Tubería Sur
            ctx.fillRect(p.x, bottomY, this.w, this.h);
            ctx.strokeRect(p.x, bottomY, this.w, this.h);
        }
    },
    
    update : function() {
        if(state.current !== state.game) return;
        
        // Agregar tuberías cada 100 frames
        if(frames % 120 == 0) {
            this.position.push({
                x : canvas.width,
                y : -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            p.x -= this.dx;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Lógica de colisión
            if(bird.x + bird.width > p.x && bird.x < p.x + this.w && 
               (bird.y < p.y + this.h || bird.y + bird.height > bottomPipeYPos)) {
                state.current = state.over;
            }
            
            // Eliminar y sumar puntos
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

// Puntuación
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
            ctx.font = "40px Impact";
            ctx.fillText("GAME OVER", canvas.width/2 - 90, 120);
            ctx.strokeText("GAME OVER", canvas.width/2 - 90, 120);

            ctx.fillStyle = "#FFF";
            ctx.font = "20px Arial";
            ctx.fillText("Click para reiniciar", 85, 300);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#FFF";
            ctx.font = "30px Impact";
            ctx.fillText("GET READY", canvas.width/2 - 70, 200);
            ctx.strokeText("GET READY", canvas.width/2 - 70, 200);
            ctx.font = "15px Arial";
            ctx.fillText("Presiona Espacio o Click", 80, 240);
        }
    }
}

// Suelo
const fg = {
    h: 50,
    draw: function() {
        ctx.fillStyle = "#ded895";
        ctx.fillRect(0, canvas.height - this.h, canvas.width, this.h);
        ctx.lineWidth = 2;
        ctx.strokeRect(0, canvas.height - this.h, canvas.width, this.h);
    }
}

// --- BUCLE PRINCIPAL ---
function loop() {
    bird.update();
    pipes.update();
    
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();
    score.draw();
    
    frames++;
    requestAnimationFrame(loop);
}

loop();
