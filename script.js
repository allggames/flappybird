const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image()
};

sprites.bird.src = "guerrera.png";
sprites.pipe.src = "columna.png"; 
sprites.bg.src = "fondo.png";

// --- OBJETOS ---

const bg = {
    draw: function() {
        // LÓGICA DE FONDO: "COVER" (Sin deformar)
        // Calculamos la proporción para que cubra todo el alto
        const scale = canvas.height / sprites.bg.height;
        const scaledWidth = sprites.bg.width * scale;
        
        // Dibujamos centrado
        const xOffset = (canvas.width - scaledWidth) / 2;
        
        ctx.drawImage(sprites.bg, xOffset, 0, scaledWidth, canvas.height);
    }
}

const bird = {
    // Posición inicial
    x: 100, 
    y: 400,
    // TAMAÑO: Ahora más grande porque el lienzo es HD
    w: 80, 
    h: 80, 
    radius: 35, // Radio para colisiones más precisas
    speed: 0,
    gravity: 0.6, // Gravedad ajustada a la nueva escala
    jump: -10,    // Salto ajustado
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 2 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // Dibujamos la guerrera
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 400 - 10 * Math.cos(frames/20);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Suelo (ajustado para HD)
            if(this.y + this.h/2 >= canvas.height - 100) {
                this.y = canvas.height - 100 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 120,  // Columna más ancha
    h: 900,  // Columna más larga
    dx: 5,   // Velocidad ajustada
    gap: 300, // Hueco más grande para que sea jugable en HD
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // --- CORRECCIÓN DE LA IMAGEN DE COLUMNAS ---
            // Tu imagen tiene muchas columnas. Vamos a tomar solo la primera (aprox 1/8 del ancho)
            // Si ya recortaste la imagen a una sola, cambia 'srcWidth' a 'sprites.pipe.width'
            const srcWidth = sprites.pipe.width / 8; 
            
            // COLUMNA DE ARRIBA (Invertida)
            ctx.save();
            ctx.translate(p.x, topY + this.h);
            ctx.scale(1, -1); 
            // drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) -> Recorte inteligente
            ctx.drawImage(sprites.pipe, 0, 0, srcWidth, sprites.pipe.height, 0, 0, this.w, this.h);
            ctx.restore();
            
            // COLUMNA DE ABAJO
            ctx.drawImage(sprites.pipe, 0, 0, srcWidth, sprites.pipe.height, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 100 == 0) {
            this.position.push({
                x: canvas.width,
                y: -400 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // COLISIONES (Ajustadas un poco para ser más "justas")
            // Hacemos el hitbox un poco más pequeño que la imagen visual
            let hitX = p.x + 10;
            let hitW = this.w - 20;
            
            let bottomPipeYPos = p.y + this.h + this.gap;
            
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
                if(bird.y - bird.radius < p.y + this.h || bird.y + bird.radius > bottomPipeYPos) {
                    state.current = state.over;
                }
            }
            
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
        ctx.textAlign = "center"; // Centrar texto
        
        if(state.current == state.game) {
            ctx.lineWidth = 3;
            ctx.font = "80px Verdana"; // Texto más grande
            ctx.strokeText(this.value, canvas.width/2, 100);
            ctx.fillText(this.value, canvas.width/2, 100);
        } else if(state.current == state.over) {
            ctx.font = "50px Verdana";
            ctx.strokeText("Score: " + this.value, canvas.width/2, 300);
            ctx.fillText("Score: " + this.value, canvas.width/2, 300);
            
            ctx.strokeText("Best: " + this.best, canvas.width/2, 370);
            ctx.fillText("Best: " + this.best, canvas.width/2, 370);
            
            ctx.fillStyle = "#e74c3c";
            ctx.font = "80px Verdana";
            ctx.strokeText("GAME OVER", canvas.width/2, 200);
            ctx.fillText("GAME OVER", canvas.width/2, 200);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.lineWidth = 3;
            ctx.font = "70px Verdana";
            ctx.strokeText("SPARTAN JUMP", canvas.width/2, 250);
            ctx.fillText("SPARTAN JUMP", canvas.width/2, 250);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "35px Verdana";
            ctx.fillText("Click o Espacio para empezar", canvas.width/2, 350);
        }
    }
}

// --- CONTROL ---
function action(evt) {
    if(evt.type === 'touchstart') evt.preventDefault();
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

window.addEventListener("keydown", (e) => { if(e.code === "Space") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- CARGA Y BUCLE ---
let loaded = 0;
function init() {
    loaded++;
    if(loaded === 3) loop();
}
sprites.bird.onload = init;
sprites.pipe.onload = init;
sprites.bg.onload = init;

function loop() {
    bg.draw();
    pipes.update();
    pipes.draw();
    bird.update();
    bird.draw();
    score.draw();
    frames++;
    requestAnimationFrame(loop);
}
