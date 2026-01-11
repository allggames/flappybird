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

// ==========================================
sprites.bird.src = "guerrera.png"; 
sprites.pipe.src = "columna.png";
sprites.bg.src = "fondo.png";

// --- OBJETOS ---

const bg = {
    draw: function() {
        if (!sprites.bg.complete) return;
        
        // Dibuja el fondo centrado (recortando los lados si sobra)
        // para que no se deforme el templo
        const scale = canvas.height / sprites.bg.height; 
        const w = sprites.bg.width * scale;
        const x = (canvas.width - w) / 2;
        
        ctx.drawImage(sprites.bg, x, 0, w, canvas.height);
    }
}

const bird = {
    x: 50, 
    y: 200,
    // TAMAÑO GRANDE: 45x45 en esta resolución se ve MUCHO más grande
    w: 45, 
    h: 45, 
    radius: 18, 
    speed: 0,
    // Físicas ajustadas para resolución 360x640
    gravity: 0.25,
    jump: -5.5, 
    rotation: 0,
    
    draw: function() {
        if (!sprites.bird.complete) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.speed >= this.jump) {
            this.rotation = Math.min(Math.PI / 4, this.rotation + 3 * RAD);
        } else {
            this.rotation = -25 * RAD;
        }
        ctx.rotate(this.rotation);
        
        ctx.drawImage(sprites.bird, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
    },
    
    flap: function() {
        this.speed = this.jump;
    },
    
    update: function() {
        if(state.current == state.getReady) {
            this.y = 200 - 5 * Math.cos(frames/15); // Flotar suave
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            if(this.y + this.h/2 >= canvas.height - 40) {
                this.y = canvas.height - 40 - this.h/2;
                if(state.current == state.game) state.current = state.over;
            }
        }
    }
}

const pipes = {
    position: [],
    w: 65,  // Columnas más anchas y visibles
    h: 400, 
    dx: 3,  // Velocidad normal
    gap: 140, // Espacio justo para pasar
    
    draw: function() {
        if (!sprites.pipe.complete) return;
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y; 
            let bottomY = p.y + this.gap;
            
            // Columna Arriba (Invertida)
            ctx.save();
            ctx.translate(p.x, topY);
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, 0, 0, this.w, this.h);
            ctx.restore();
            
            // Columna Abajo
            ctx.drawImage(sprites.pipe, p.x, bottomY, this.w, this.h);
        }
    },
    
    update: function() {
        if(state.current !== state.game) return;
        
        if(frames % 100 == 0) {
            this.position.push({
                x: canvas.width,
                // Altura aleatoria del hueco
                y: Math.random() * (canvas.height - 300) + 100
            });
        }
        
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;
            
            // Colisiones
            let hitX = p.x + 5;
            let hitW = this.w - 10;
            let bottomPipeYPos = p.y + this.gap;
            
            if(bird.x + bird.radius > hitX && bird.x - bird.radius < hitX + hitW) {
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
        ctx.lineWidth = 2;
        
        if(state.current == state.game) {
            ctx.font = "50px Verdana";
            ctx.strokeText(this.value, canvas.width/2, 80);
            ctx.fillText(this.value, canvas.width/2, 80);
        } else if(state.current == state.over) {
            ctx.font = "30px Verdana";
            ctx.strokeText("Score: " + this.value, canvas.width/2, 180);
            ctx.fillText("Score: " + this.value, canvas.width/2, 180);
            
            ctx.strokeText("Best: " + this.best, canvas.width/2, 230);
            ctx.fillText("Best: " + this.best, canvas.width/2, 230);
            
            ctx.fillStyle = "#e74c3c";
            ctx.font = "50px Verdana";
            ctx.strokeText("GAME OVER", canvas.width/2, 120);
            ctx.fillText("GAME OVER", canvas.width/2, 120);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "20px Verdana";
            ctx.fillText("Click para reiniciar", canvas.width/2, 300);
        } else if(state.current == state.getReady) {
            ctx.fillStyle = "#f1c40f";
            ctx.font = "40px Verdana";
            ctx.strokeText("SPARTAN", canvas.width/2, 150);
            ctx.fillText("SPARTAN", canvas.width/2, 150);
            
            ctx.fillStyle = "#FFF";
            ctx.font = "20px Verdana";
            ctx.fillText("Click o Espacio", canvas.width/2, 200);
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

// --- INICIO ---
function loop() {
    // Fondo de seguridad por si no carga la imagen
    ctx.fillStyle = "#70c5ce"; 
    ctx.fillRect(0,0,canvas.width, canvas.height);

    bg.draw();
    pipes.update();
    pipes.draw();
    bird.update();
    bird.draw();
    score.draw();
    frames++;
    requestAnimationFrame(loop);
}

loop();
