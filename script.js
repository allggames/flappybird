const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES DEL JUEGO ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- SISTEMA DE CARGA DE IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image()
};

// Rutas de las imágenes (¡Deben coincidir con tus archivos!)
sprites.bird.src = "guerrera.png";
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";

// Contador para saber cuándo están listas todas las imágenes
let loadedImages = 0;
const totalImages = 3;

function checkLoad() {
    loadedImages++;
    if (loadedImages === totalImages) {
        console.log("¡Todo listo! Iniciando juego...");
        loop(); // Solo arranca cuando las 3 existen
    }
}

// Asignamos el evento de carga a cada imagen
sprites.bird.onload = checkLoad;
sprites.pipe.onload = checkLoad;
sprites.bg.onload = checkLoad;

// Aviso de error si alguna imagen no se encuentra
sprites.bird.onerror = () => alert("Error: No encuentro 'guerrera.png'");
sprites.pipe.onerror = () => alert("Error: No encuentro 'columna.png'");
sprites.bg.onerror = () => alert("Error: No encuentro 'fondo.png'");


// --- OBJETOS ---

const bg = {
    draw: function() {
        // Dibuja el fondo ajustándolo al tamaño del canvas
        ctx.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
    }
}

const bird = {
    x: 50,
    y: 150,
    w: 35, // TAMAÑO FIJO: Ancho del personaje en el juego
    h: 35, // TAMAÑO FIJO: Alto del personaje
    speed: 0,
    gravity: 0.25,
    jump: -4.6,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 5 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // Dibuja la imagen forzando el tamaño w y h definidos arriba
        // Esto evita que si tu imagen es gigante, tape toda la pantalla
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        
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
            
            // Suelo (ajustado a 50px del borde inferior)
            if(this.y + this.h/2 >= canvas.height - 50) {
                this.y = canvas.height - 50 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 50,  // Ancho de la columna en el juego
    h: 320, // Largo visual de la columna
    dx: 2,
    gap: 110, // Espacio para pasar
    
    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;
            
            // COLUMNA DE ARRIBA (Invertida)
            ctx.save();
            ctx.translate(p.x, topY + this.h);
            ctx.scale(1, -1); // Espejo vertical
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // COLUMNA DE ABAJO
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 120 == 0) {
            this.position.push({
                x: canvas.width,
                y: -150 * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Colisiones
            let bottomPipeYPos = p.y + this.h + this.gap;
            if(bird.x + bird.w/2 > p.x && bird.x - bird.w/2 < p.x + this.w) {
                if(bird.y - bird.h/2 < p.y + this.h || bird.y + bird.h/2 > bottomPipeYPos) {
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
            ctx.fillText("Click o Espacio", canvas.width/2 - 60, 240);
        }
    }
}

// --- CONTROL (Mouse, Touch y Teclado) ---
function action(evt) {
    // Evitamos que el doble tap haga zoom en móviles
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

// Event Listeners
window.addEventListener("keydown", (e) => { if(e.code === "Space") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- BUCLE PRINCIPAL ---
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
