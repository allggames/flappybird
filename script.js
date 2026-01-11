const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN ---
let frames = 0;
const RAD = Math.PI / 180;

const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- CARGA DE IMÁGENES ---
const birdImg = new Image();
birdImg.src = "guerrera.png"; 

const pipeImg = new Image();
pipeImg.src = "columna.png"; 

const bgImg = new Image();
bgImg.src = "fondo.png";

// --- OBJETOS ---

const bg = {
    draw: function() {
        // FONDO FIJO: Se dibuja una sola vez ocupando todo el lienzo
        // Esto evita los cortes feos si la imagen no es "seamless"
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    },
    update: function() {
        // No hacemos nada aquí para que el fondo no se mueva
    }
}

const bird = {
    x: 50,
    y: 150,
    w: 34,
    h: 34,
    speed: 0,
    gravity: 0.25,
    jump: -4.6,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotación al caer/subir
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        ctx.drawImage(birdImg, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 150 - 5 * Math.cos(frames/15);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Colisión con el suelo (ajusta el 50 según tu imagen de fondo)
            if(this.y + this.h/2 >= canvas.height - 50) {
                this.y = canvas.height - 50 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 52,   // Ancho de la columna (ajusta según tu imagen)
    h: 400,  // Altura máxima de la imagen de la columna
    dx: 2,   // Velocidad de las columnas hacia la izquierda
    gap: 120, // TAMAÑO DEL HUECO para pasar
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            let topY = p.y; 
            let bottomY = p.y + this.h + this.gap;
            
            // --- COLUMNA DE ARRIBA (INVERTIDA) ---
            ctx.save();
            // Nos movemos a la posición donde termina la columna de arriba (el techo del hueco)
            ctx.translate(p.x, p.y + this.h);
            // Esto invierte la imagen verticalmente (espejo)
            // Así el "capitel" (la parte linda de arriba) queda mirando hacia el hueco
            ctx.scale(1, -1); 
            ctx.drawImage(pipeImg, 0, 0, this.w, this.h);
            ctx.restore();
            
            // --- COLUMNA DE ABAJO (NORMAL) ---
            // Se dibuja desde el suelo del hueco hacia abajo
            ctx.drawImage(pipeImg, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Agregar nueva columna cada 120 cuadros (frames)
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                // Calculamos la altura aleatoria del hueco
                y: -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Coordenada Y donde empieza la columna de abajo
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            // DETECCIÓN DE COLISIONES
            // 1. ¿El pájaro está horizontalmente dentro de la columna?
            if(bird.x + bird.w/2 > p.x && bird.x - bird.w/2 < p.x + this.w) {
                // 2. ¿El pájaro está tocando la columna de arriba O la de abajo?
                if(bird.y - bird.h/2 < p.y + this.h || bird.y + bird.h/2 > bottomPipeYPos) {
                    state.current = state.over;
                }
            }
            
            // Eliminar columna si sale de la pantalla y sumar punto
            if(p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    },
    reset: function() {
        this.position = [];
    }
}

const score = {
    best: localStorage.getItem("best") || 0,
    value: 0,
    draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";
        
        if(state.current == state.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Verdana";
            ctx.fillText(this.value, canvas.width/2 - 10, 50);
            ctx.strokeText(this.value, canvas.width/2 - 10, 50);
        } else if(state.current == state.over) {
            ctx.font = "25px Verdana";
            ctx.fillText("Score: " + this.value, canvas.width/2 - 50, 180);
            ctx.fillText("Best: " + this.best, canvas.width/2 - 50, 220);
            
            ctx.fillStyle = "#e74c3c";
            ctx.font = "40px Verdana";
            ctx.fillText("GAME OVER", canvas.width/2 - 115, 120);
            ctx.strokeText("GAME OVER", canvas.width/2 - 115, 120);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "30px Verdana";
            ctx.fillText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.strokeText("SPARTAN JUMP", canvas.width/2 - 115, 200);
            ctx.fillStyle = "#FFF";
            ctx.font = "15px Verdana";
            ctx.fillText("Click o Espacio para empezar", canvas.width/2 - 100, 240);
        }
    }
}

// --- CONTROL ---
function action() {
    switch(state.current) {
        case state.getReady: state.current = state.game; break;
        case state.game: bird.flap(); break;
        case state.over: 
            bird.speed = 0;
            pipes.reset();
            score.value = 0;
            state.current = state.getReady;
            break;
    }
}
document.addEventListener("click", action);
document.addEventListener("keydown", (e) => { if(e.code === "Space") action(); });

// --- BUCLE PRINCIPAL ---
function loop() {
    bg.draw();    // 1. Dibujar fondo fijo
    pipes.update();
    pipes.draw(); // 2. Dibujar columnas
    bird.update();
    bird.draw();  // 3. Dibujar personaje
    score.draw(); // 4. Dibujar puntaje
    
    frames++;
    requestAnimationFrame(loop);
}

// Iniciar
loop();
