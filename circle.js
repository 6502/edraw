class Circle {
    constructor(center, radius, style) {
        this.center = center;
        this.radius = radius;
        this.style = style;
    }
    editor() {
        return new CircleEditor(this);
    }
    clone() {
        return new Circle(this.center, this.radius, clone(this.style));
    }
    setStyle(f, val) {
        ur_set(this.style, f, val);
    }
    draw(ctx) {
        if (this.style.fill) {
            fillCircle(ctx, this.center, this.radius, this.style.fill);
        }
        if (this.style.stroke) {
            drawCircle(ctx, this.center, this.radius, this.style.stroke, this.style.width);
        }
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        if (dist(p, this.center) < Math.max(this.radius, 8/sf)) {
            if (b === 0) {
                drag(this);
            } else if (b === 2) {
                editPopup(this, x, y);
            }
            return true;
        }
    }
    bbox() {
        return {x0:this.center.x - this.radius,
                y0:this.center.y - this.radius,
                x1:this.center.x + this.radius,
                y1:this.center.y + this.radius};
    }
    transform(m) {
        ur_set(this, "center", m(this.center));
    }
};

class CircleEditor {
    constructor(e) {
        this.e = e;
        this.text = "Drag circle center or change circle radius";
    }
    draw(ctx) {
        let p = {x: this.e.center.x + this.e.radius, y:this.e.center.y};
        drawLine(ctx, this.e.center, p);
        dot(ctx, this.e.center);
        dot(ctx, p);
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        if (dist(p, {x:this.e.center.x+this.e.radius, y:this.e.center.y}) < 8/sf) {
            let first = true;
            track((x, y) => {
                if (!first) undo();
                ur_begin("Circle radius drag");
                ur_set(this.e, "radius", dist(rmap(x, y), this.e.center));
                ur_end();
                first = false;
            });
            return true;
        }
        if (dist(p, this.e.center) < 8/sf) {
            let first = true;
            track((x, y) => {
                let q = rmap(x, y);
                let np = {x: this.e.center.x + q.x - p.x,
                          y: this.e.center.y + q.y - p.y};
                p = q;
                if (!first) undo();
                ur_begin("Circle center drag");
                ur_set(this.e, "center", np);
                ur_end();
                first = false;
            });
            return true;
        }
    }
}

function draw_circle() {
    editor = {
        text: "Draw circle: [left] on center and drag for radius",
        draw(ctx) {
        },
        hit(x, y, b) {
            let c = new Circle(rmap(x, y), 0, {fill:"#ABC"});
            ur_begin("Circle draw");
            ur_add({undo(){ entities.pop(); }, redo(){ entities.push(c); }});
            ur_end();
            editor = new CircleEditor(entities[entities.length-1]);
            repaint();
            let first = true;
            track((x, y) => {
                if (!first) undo();
                ur_begin("Circle radius drag");
                ur_set(c, "radius", dist(rmap(x, y), c.center));
                ur_end();
                first = false;
            });
            return true;
        }
    };
    repaint();
}
