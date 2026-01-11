// script.js - VERSIÓN GRIEGA

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CARGAR IMÁGENES (Estilo Griego) ---
const birdImg = new Image();
// Un espartano pixelado
birdImg.src = "https://raw.githubusercontent.com/JavierVzqz/flappy-spartan-assets/main/spartan.png";

const bgImg = new Image();
// Fondo con templo y nubes
bgImg.src = "https://raw.githubusercontent.com/JavierVzqz/flappy-spartan-assets/main/greek-bg.png";

const pipeImg = new Image();
// Columna griega (se usará para arriba y abajo)
pipeImg.src = "https://raw.githubusercontent.com/JavierVzqz/flappy-spartan-assets/main/column.png";

const fgImg = new Image();
// Suelo de tierra/arena
fgImg.src = "https://raw.githubusercontent.com/JavierVzqz/flappy-spartan-assets/main/ground.png";

const owlImg = new Image();
// El búho decorativo
owlImg.src = "https://raw.githubusercontent.com/JavierVzqz/flappy-spartan-assets/main/owl.png";


// --- VARIABLES DEL JUEGO ---
let frames = 0;
const RAD = Math.PI / 180;

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
    // La imagen de fondo es más ancha para poder moverla (efecto parallax)
    x1: 0,
    x2: canvas.width,
    y: 0,
    dx: 0.5, // Velocidad del fondo (más lento que las tuberías)
    draw : function() {
        ctx.drawImage(bgImg, this.x1, this.y, canvas.width, canvas.height);
        ctx.drawImage(bgImg, this.x2, this.y, canvas.width, canvas.height);
    },
    update: function() {
        if(state.current === state.game) {
            this.x1 = (this.x1 - this.dx) % (canvas.width);
            this.x2 = (this.x2 - this.dx) % (canvas.width);
            // Truco para que se repita infinitamente sin saltos
            if (this.x1 <= -canvas.width) this.x1 = canvas.width + (this.x1 % canvas.width);
            if (this.x2 <= -canvas.width) this.x2 = canvas.width + (this.x2 % canvas.width);
        }
    }
}

const bird = {
    x : 50,
    y : 150,
    width : 40, // Ajustado al tamaño del sprite del espartano
    height : 40,
    speed : 0,
    gravity : 0.25,
    jump : -4.6,
    rotation : 0,
    
    draw : function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotación según la velocidad (cae de cabeza, sube mirando arriba)
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        // Dibujamos la imagen del espartano centrada
        ctx.drawImage(birdImg, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    },
    
    flap : function() {
        this.speed = this.jump;
    },
    
    update : function() {
        if(state.current == state.getReady) {
            this.y = 150 - 10 * Math.cos(frames/15);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // El suelo mide 112px de alto
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
    w : 60, // Ancho de la columna
    h : 400, // Altura de la imagen de la columna
    dx : 2,
    gap : 130, // Espacio entre columnas
    
    draw : function() {
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // Columna de arriba (invertida)
            ctx.save();
            ctx.translate(p.x + this.w, topY + this.h); 
            ctx.scale(-1, -1); 
            ctx.drawImage(pipeImg, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Columna de abajo
            ctx.drawImage(pipeImg, p.x, bottomY, this.w, this.h);

            // Dibujar el búho (solo en algunas columnas de abajo)
            if (p.hasOwl) {
                ctx.drawImage(owlImg, p.x + 15, bottomY - 30, 30, 30);
            }
        }
    },
    
    update : function() {
        if(state.current !== state.game) return;
        
        if(frames % 120 == 0) {
            this.position.push({
                x : canvas.width,
                y : -150 * (Math.random() + 1),
                // 30% de probabilidad de que aparezca un búho
                hasOwl: Math.random() < 0.3 
            });
        }
        
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            p.x -= this.dx;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // Colisiones (ajustadas al nuevo tamaño del pájaro y columnas)
            // Usamos un margen de 5px para que no sea tan frustrante
            if(bird.x + bird.width/2 - 5 > p.x && bird.x - bird.width/2 + 5 < p.x + this.w && 
               (bird.y - bird.height/2 + 5 < p.y + this.h || bird.y + bird.height/2 - 5 > bottomPipeYPos)) {
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
            ctx.font = "50px Impact";
            ctx.fillText(this.value, canvas.width/2, 80);
            ctx.strokeText(this.value, canvas.width/2, 80);
        } else if(state.current == state.over) {
            ctx.font = "25px Impact";
            ctx.fillText("Score: " + this.value, canvas.width/2 - 40, 180);
            ctx.fillText("Best: " + this.best, canvas.width/2 - 40, 220);
            ctx.fillStyle = "#e74c3c"; // Rojo sangre para Game Over
            ctx.fillText("GAME OVER", canvas.width/2 - 60, 120);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f"; // Color dorado
            ctx.font = "40px Impact";
            ctx.fillText("SPARTAN JUMP", canvas.width/2 - 110, 200);
            ctx.strokeText("SPARTAN JUMP", canvas.width/2 - 110, 200);
        }
    }
}

// Suelo
const fg = {
    h: 112, 
    x1: 0,
    x2: canvas.width,
    dx: 2, // Misma velocidad que las tuberías
    draw: function() {
        ctx.drawImage(fgImg, this.x1, canvas.height - this.h, canvas.width, this.h);
        ctx.drawImage(fgImg, this.x2, canvas.height - this.h, canvas.width, this.h);
    },
    update: function() {
        if(state.current === state.game) {
            this.x1 = (this.x1 - this.dx) % (canvas.width);
            this.x2 = (this.x2 - this.dx) % (canvas.width);
            if (this.x1 <= -canvas.width) this.x1 = canvas.width + (this.x1 % canvas.width);
            if (this.x2 <= -canvas.width) this.x2 = canvas.width + (this.x2 % canvas.width);
        }
    }
}

function loop() {
    bird.update();
    pipes.update();
    fg.update(); // El suelo ahora se mueve
    bg.update(); // El fondo ahora se mueve
    
    bg.draw();
    pipes.draw();
    fg.draw(); 
    bird.draw();
    score.draw();
    
    frames++;
    requestAnimationFrame(loop);
}

loop();
