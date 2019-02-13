class Bez2 {
    constructor(a, b, c, style) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.style = style;
    }
    editor() {
        return new Bez2Editor(this);
    }
    clone() {
        return new Bez2(this.a, this.b, this.c, clone(this.style));
    }
    setStyle(f, val) {
        ur_set(this.style, f, val);
    }
    draw(ctx) {
        let b = bez2Interp(this.a, this.b, this.c);
        drawBez2(ctx, this.a, b, this.c,
                 this.style.stroke, this.style.width);
    }
    hit(x, y, b) {
        let p = rmap(x, y)
        for (let i=0; i<=100; i++) {
            let bp = bez2Interp(this.a, this.b, this.c);
            let xx = lerp2(this.a.x, bp.x, this.c.x, i/100),
                yy = lerp2(this.a.y, bp.y, this.c.y, i/100);
            if (dist({x:xx, y:yy}, p) < Math.max(this.style.width/2, 8/sf)) {
                if (b === 0) {
                    drag(this);
                } else {
                    editPopup(this, x, y);
                }
                return true;
            }
        }
    }
    bbox() {
        let b = bez2Interp(this.a, this.b, this.c);
        let x0=this.a.x, y0=this.a.y, x1=x0, y1=y0;
        for (let i=1; i<=10; i++) {
            let xx = lerp2(this.a.x, b.x, this.c.x, i/10),
                yy = lerp2(this.a.y, b.y, this.c.y, i/10);
            x0 = Math.min(xx, x0); x1 = Math.max(xx, x1);
            y0 = Math.min(yy, y0); y1 = Math.max(yy, y1);
        }
        return {x0, y0, x1, y1};
    }
    transform(m) {
        ur_set(this, "a", m(this.a));
        ur_set(this, "b", m(this.b));
        ur_set(this, "c", m(this.c));
    }
}

class Bez2Editor {
    constructor(e) {
        this.e = e;
        this.text = "Drag control points";
    }
    draw(ctx) {
        dot(ctx, this.e.a); dot(ctx, this.e.b); dot(ctx, this.e.c);
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        if (b === 0) {
            for (let dname of "abc") {
                if (dist(p, this.e[dname]) < 8/sf) {
                    let first = true;
                    track((x, y) => {
                        if (!first) undo();
                        ur_begin("Bez2 point drag");
                        ur_set(this.e, dname, rmap(x, y));
                        ur_end();
                        first = false;
                    });
                    return true;
                }
            }
        }
    }
}

function draw_curve() {
    editor = {
        text: "Draw Curve: [left] on start and drag",
        draw(ctx) {
        },
        hit(x, y, b) {
            let p = rmap(x, y);
            let c = new Bez2(p, p, p, {stroke:"#000", width:8});
            ur_begin("Curve draw");
            ur_add({undo(){ entities.pop(); }, redo(){ entities.push(c); }});
            ur_end();
            editor = new Bez2Editor(entities[entities.length-1]);
            repaint();
            let first = true;
            track((x, y) => {
                let p = rmap(x, y);
                if (!first) undo();
                ur_begin("Curve draw");
                ur_set(c, "c", p);
                ur_set(c, "b", {x:(c.a.x+c.c.x)/2, y:(c.a.y+c.c.y)/2});
                ur_end();
                first = false;
            });
            return true;
        }
    };
    repaint();
}
