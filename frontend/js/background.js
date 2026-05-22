const initBackground = () => {
    // Check if already initialized
    if (document.getElementById('iot-bg-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'iot-bg-canvas';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    
    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 2 + 1;
            this.color = Math.random() > 0.5 ? 'rgba(168, 85, 247, 0.6)' : 'rgba(6, 182, 212, 0.5)';
            this.shadowColor = this.color.replace('0.6', '0.4').replace('0.5', '0.3');
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.shadowColor;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    const particleCount = Math.floor((width * height) / 12000);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    let gridOffset = 0;

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Draw subtle moving grid
        gridOffset += 0.15;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.04)';
        ctx.lineWidth = 0.5;
        const gridSize = 80;
        
        for (let x = (gridOffset % gridSize) - gridSize; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = (gridOffset % gridSize) - gridSize; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Update and draw particles, and connect them
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    };
    
    animate();
};

document.addEventListener('DOMContentLoaded', initBackground);
