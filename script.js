const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- VARIABLES ---
let frames = 0;
const RAD = Math.PI / 180;
const state = { current: 0, getReady: 0, game: 1, over: 2 };

// --- CARGA DE IMÁGENES ---
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    bg: new Image()
};

// POR FAVOR: Usa la versión PNG transparente de la guerrera aquí
sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
// Usa tu fondo complejo aquí (el del templo)
sprites.bg.src = "fondo.png"; 

// --- OBJETOS ---

const bg = {
    draw: function() {
        if (!sprites.bg.complete) {
             ctx.fillStyle = "#333"; ctx.fillRect(0,0,canvas.width, canvas.height); return;
        }
        
        // Técnica para dibujar el fondo tipo "COVER" (sin deformar)
        // Calcula la escala necesaria para llenar el alto del canvas
        const scale = canvas.height / sprites.bg.height;
        const scaledWidth = sprites.bg.width * scale;
        // Centra la imagen horizontalmente
        const xOffset = (canvas.width - scaledWidth) / 2;
        
        ctx.drawImage(sprites.bg, xOffset, 0, scaledWidth, canvas.height);
    }
}

const bird = {
    x: canvas.width / 3, // Posición horizontal
    y: canvas.height / 2,
    // --- TAMAÑO ÉPICO ---
    // Hacemos al personaje MUY grande para que se vea como en la foto
    w: 180, 
    h: 180, 
    // Hitbox (radio de colisión) más pequeño que la imagen para ser justo
    radius: 60, 
    speed: 0,
    // Físicas ajustadas para este tamaño grande y resolución HD
    gravity: 0.8,
    jump: -15, 
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotación más sutil y realista
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 8, this.rotation + 1 * RAD);
        } else {
            this.rotation = -15 * RAD;
        }
        ctx.rotate(this.rotation);
        
        // Dibujar la guerrera
        // Si usas el PNG transparente, ¡aquí es donde se verá increíble!
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = canvas.height / 2 - 20 * Math.cos(frames/30);
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Límite inferior (suelo)
            if(this.y + this.h/2 >= canvas.height - 50) {
                this.y = canvas.height - 50 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
            // Límite superior (techo)
            if(this.y - this.h/2 <= 0) {
                this.y = this.h/2;
                this.speed = 0;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 160,   // Columnas muy gruesas e imponentes
    h: 1000,  // Altura visual de la columna
    dx: 7,    // Velocidad rápida
    gap: 380, // Hueco muy grande para que pase el personaje gigante
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // Columna de Arriba (Espejo vertical)
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Columna de Abajo (Normal)
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        // Generar columnas cada 110 frames
        if(frames % 110 == 0) {
            this.position.push({
                x: canvas.width,
                // Rango de altura aleatoria para el hueco
                y: Math.random() * (canvas.height - 700) + 200
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // --- COLISIONES ---
            // Hitbox horizontal un poco más permisivo
            let hitX = p.x + 20;
            let hitW = this.w - 40;
            let bottomPipeYPos = p.y + this.gap;
            
            // Comprobación circular vs rectangular (más precisa para este tamaño)
            // Simplificación: si el centro del pájaro entra en la zona X de la tubería
            if(bird.x > hitX && bird.x < hitX + hitW) {
                // Y si el borde superior o inferior del pájaro toca las tuberías
                if(bird.y - bird.radius < p.y || bird.y + bird.radius > bottomPipeYPos) {
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
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        
        if(state.current == state.game) {
            ctx.font = "100px Georgia, serif"; // Fuente más clásica
            ctx.strokeText(this.value, canvas.width/2, 150);
            ctx.fillText(this.value, canvas.width/2, 150);
        } else if(state.current == state.over) {
            ctx.fillStyle = "#e74c3c";
            ctx.font = "80px Georgia, serif";
            ctx.strokeText("GAME OVER", canvas.width/2, canvas.height/2 - 100);
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 100);

            ctx.fillStyle = "#FFF";
            ctx.font = "50px Georgia, serif";
            ctx.strokeText("Score: " + this.value, canvas.width/2, canvas.height/2 + 20);
            ctx.fillText("Score: " + this.value, canvas.width/2, canvas.height/2 + 20);
            
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to restart", canvas.width/2, canvas.height/2 + 150);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f"; // Dorado
            ctx.font = "90px Georgia, serif";
            ctx.strokeText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            ctx.fillText("SPARTAN", canvas.width/2, canvas.height/2 - 100);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Verdana";
            ctx.fillText("Tap to start", canvas.width/2, canvas.height/2 + 50);
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

window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") action(e); });
window.addEventListener("mousedown", action);
window.addEventListener("touchstart", action, {passive: false});

// --- INICIO ROBUSTO ---
// Esperamos a que carguen las imágenes esenciales antes de arrancar el bucle
let assetsLoaded = 0;
function checkAssets() {
    assetsLoaded++;
    if(assetsLoaded === 3) {
        console.log("Assets loaded. Starting game.");
        loop();
    }
}

sprites.bird.onload = checkAssets;
sprites.pipe.onload = checkAssets;
sprites.bg.onload = checkAssets;

// Fallback de seguridad: si algo falla al cargar, inicia igual después de 2 segundos
setTimeout(() => {
    if (assetsLoaded < 3) {
        console.warn("Some assets failed to load. Starting anyway.");
        loop();
    }
}, 2000);

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
