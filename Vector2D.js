class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString(precision) {
        return "X: " + this.x.toFixed(precision) + "  " + "Y: " + this.y.toFixed(precision);
    }

    setPos(new_x, new_y) {
        this.x = new_x;
        this.y = new_y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    plus(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    minus(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    times(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    div(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    dividedBy(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    setMag(new_mag) {
        this.x = this.x * new_mag / this.mag();
        this.y = this.y * new_mag / this.mag();
        return this;
    }

    mag() {
        let square_sum = Math.pow(this.x, 2) + Math.pow(this.y, 2);
        return Math.sqrt(square_sum);
    }

    limit(constraint) {
        if(this.mag() > constraint) {
            this.setMag(constraint);
        }
        return this;
    }

    normalize() {
        this.x /= this.mag();
        this.y /= this.mag();
        return this;
    }

    equals(v) {
        return this.x == v.x && this.y == v.y;
    }

    rotate(theta) {
        let new_x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
        let new_y = this.x * Math.sin(theta) + this.y * Math.cos(theta);

        return new Vector2D(new_x, new_y);
    }

    static random2D() {
        let angle = Math.random() * 2 * Math.PI;
        let magnitude = Math.random() * 2 - 1;
        return new Vector2D(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }
}