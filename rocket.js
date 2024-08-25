const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;
// Resize canvas at window resize
window.addEventListener(('resize'), function() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
});
const coordinates = document.getElementById('coordinates');
const menu = document.getElementById('menu');
let menu_active = true;

const settings = {
    body_height: 30,
    body_width: 30,
    thruster_height: 10,
    thruster_width: 10,
    mass: 2,
    left_thruster_strength: 1,
    right_thruster_strength: 1,
    rotation_dampener: 1,
    gravity_strength: 0.07
};

// Add event listeners for the menu sliders
const inputs = document.querySelectorAll('input[type=range]');
const input_value_labels = document.getElementsByClassName('value-label');

for(let i = 0; i < inputs.length; i++) {
    let input = inputs[i];

    input.addEventListener(('input'), function(event) {
        let name = event.target.name.replace(/-/g, '_');
        settings[name] = parseFloat(event.target.value);
        input_value_labels[i].innerHTML = settings[name];
    });

    input_value_labels[i].innerHTML = settings[input.getAttribute("name").replace(/-/g, '_')];
};

// Listener to reinitialize gravity vector
document.getElementById("gravity-strength").addEventListener(('input'), function() {
    gravity.y = settings.gravity_strength
});


// Determine key pressed to activate thrusters
let d_key_down = false;
let a_key_down = false;
window.addEventListener(('keydown'), function(event) {
    if(event.key == 'a') {
        a_key_down = true;
    }
    if(event.key == 'd') {
        d_key_down = true;
    }
    if(event.key == 'm') {
        toggleMenu();
    }

    // Reset rocket position
    if(event.key == 'r') {
        rocket.vel.setPos(0, 0);
        rocket.pos.y = canvas.height - settings.body_height;
        rocket.pos.x = 500;
        rocket.angular_vel = 0;
        rocket.angle = 0;
    }
});
window.addEventListener(('keyup'), function(event) {
    if(event.key == 'a') {
        a_key_down = false;
    }
    if(event.key == 'd') {
        d_key_down = false;
    }
});


// Particles of smoke given off by the rocket
class Smoke {
    constructor(ctx, pos, vel, radius) {
        this.ctx = ctx;
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.acc = new Vector2D(-0.1, -0.1);
        this.lifespan = smoke_lifespan;
    }

    draw() {
        this.ctx.fillStyle = "gray";
        this.ctx.globalAlpha = this.lifespan / 35;
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    update() {
        this.pos.add(this.vel);
        this.vel.add(this.acc);

        // Constrain smoke velocity so the negative acceleration won't make the smoke go up
        if(this.vel.x < 0) this.vel.x = 0;
        if(this.vel.y < 0) this.vel.y = 0;

        this.lifespan--;
    }

}


class Rocket {
    constructor(ctx, x, y) {
        this.ctx = ctx;
        this.pos = new Vector2D(x, y);
        this.vel = new Vector2D(0, 0);
        this.acc = new Vector2D(0, 0);
        this.angle = 0;
        this.angular_vel = 0;
        this.angular_acc = 0;

        this.left_thruster_force = new Vector2D(0, 0);
        this.right_thruster_force = new Vector2D(0, 0);
    }

    draw() {
        // Save the current state of the context
        this.ctx.save();
    
        // Move the context to the rocket's center
        this.ctx.translate(this.pos.x + settings.body_width / 2, this.pos.y + settings.body_height / 2);
    
        // Apply rotation to rocket
        this.ctx.rotate(this.angle);

        // Draw rocket head 
        ctx.fillStyle = "black";
        ctx.beginPath();
        this.ctx.arc(0, -settings.body_height / 2, settings.body_width / 2, 0, 2 * Math.PI);
        ctx.fill();

        // Draw rocket body
        this.ctx.fillRect(-settings.body_width / 2, -settings.body_height / 2, settings.body_width, settings.body_height);
    
        // Draw thrusters
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(-settings.body_width / 2 - settings.thruster_width / 2, settings.body_height / 2 - settings.thruster_height, settings.thruster_width, settings.thruster_height);
        this.ctx.fillRect(settings.body_width / 2 - settings.thruster_width / 2, settings.body_height / 2 - settings.thruster_height, settings.thruster_width, settings.thruster_height);
    
        // Restore the context to its original state
        this.ctx.restore();
    }

    update() {
        this.rocket_bottom = this.pos.y + settings.body_height;
    
        // Collision detection
        if (this.rocket_bottom > canvas.height) {
            // Reset rocket if collision
            this.vel.setPos(0, 0);
            this.pos.y = canvas.height - settings.body_height;
            this.angular_vel = 0;
            this.angle = 0;
        }

        // Wrap around screen
        if(this.pos.x > canvas.width) this.pos.x = 0;
        if(this.pos.x < 0) this.pos.x = canvas.width;

        if(a_key_down) {
            this.right_thruster_force.add(thrust_force.times(settings.right_thruster_strength));

            this.createSmoke(this.pos.x + settings.body_width, this.pos.y + settings.body_height);
        }

        if(d_key_down) {
            this.left_thruster_force.add(thrust_force.times(settings.left_thruster_strength));

            this.createSmoke(this.pos.x, this.pos.y + settings.body_height);
        }
    
        // Calculate torque for each thruster
        let torque_left = this.left_thruster_force.mag() / settings.rotation_dampener;
        let torque_right = this.right_thruster_force.mag() / settings.rotation_dampener;
        let net_torque = torque_left - torque_right;

        // Calculate inertia for a rectangle
        let inertia = (1 / 15) * settings.mass * (settings.body_height * settings.body_height + settings.body_width * settings.body_width);
    
        // Update angular acceleration
        this.angular_acc = net_torque / inertia;
    
        // Update angular velocity and angle
        this.angular_vel += this.angular_acc;
        this.angle += this.angular_vel;

        // Apply linear forces
        let rotated_thrust_left = this.left_thruster_force.rotate(this.angle);
        let rotated_thrust_right = this.right_thruster_force.rotate(this.angle);
        this.acc.add(rotated_thrust_left.dividedBy(settings.mass));
        this.acc.add(rotated_thrust_right.dividedBy(settings.mass));
        this.acc.add(gravity.dividedBy(settings.mass));
    
        // Update position and velocity
        this.pos.add(this.vel);
        this.vel.add(this.acc);

        // Limit angular velocity and velocity
        this.angular_vel = Math.min(this.angular_vel, 0.2);
        this.vel.limit(10);

        // Reset forces
        this.left_thruster_force.setPos(0, 0);
        this.right_thruster_force.setPos(0, 0);
        this.acc.setPos(0, 0);
        this.angular_acc = 0;
    }

    createSmoke(x, y) {
        // Calculate the offset from the rocket's center
        let smoke_pos = new Vector2D(x - (this.pos.x + settings.body_width / 2), y - (this.pos.y + settings.body_height / 2));

        // Rotate the position offset relative to the rocket's angle
        smoke_pos = smoke_pos.rotate(this.angle);

        // Translate the rotated position back to the rocket's position
        smoke_pos.add(new Vector2D(this.pos.x + settings.body_width / 2, this.pos.y + settings.body_height / 2));

        
        let smoke_vel = new Vector2D(0, 1).rotate(this.angle);

        // Create the smoke particle
        let smoke = new Smoke(this.ctx, smoke_pos, smoke_vel, settings.thruster_width / 3);
        smokes.push(smoke);
    }
    
};


function toggleMenu() {
    if(menu_active) {
        menu_active = false;
        menu.style.visibility = 'hidden';
    }
    else {
        menu_active = true;
        menu.style.visibility = 'visible';
    }
}


let thrust_force = new Vector2D(0, -0.08);
let gravity = new Vector2D(0, settings.gravity_strength);

let smokes = [];
let smoke_lifespan = 20;
let rocket = new Rocket(ctx, 500, 500);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rocket.update();
    rocket.draw();

    // Update coordinate text with current position
    // Convert the y position so y=0 is the bottom of the screen and the x position to the center of the rocket
    // Update only when moving (ie when not on the ground)
    if(rocket.rocket_bottom < canvas.height) {
        let x = Math.round(rocket.pos.x + settings.body_width / 2);
        let y = Math.round(canvas.height - rocket.pos.y - settings.body_height);

        y = y < 0 ? 0 : y;  // Account for case when visual Y coordinate is incorrectly a negative number

        coordinates.innerHTML = "X:  " + x + "&nbsp;&nbsp;&nbsp; Y: " + y;
    }

    for(let smoke of smokes) {
        smoke.draw();
        smoke.update();

        if(smoke.lifespan <= 0) {
            smokes.shift();
        }
    }

    requestAnimationFrame(animate);
}


animate();
