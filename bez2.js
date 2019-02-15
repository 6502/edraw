class Bez2 {
    constructor(a, b, c, flags, style) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.flags = flags;
        this.style = style;
    }
    editor() {
        return new Bez2Editor(this);
    }
    clone() {
        return new Bez2(this.a, this.b, this.c, this.flags, clone(this.style));
    }
    setStyle(f, val) {
        ur_set(this.style, f, val);
    }
    draw(ctx) {
        let b = bez2Interp(this.a, this.b, this.c);
        drawBez2(ctx, this.a, b, this.c,
                 this.style.stroke, this.style.width);
        let arrow = (a, b)=>{
            let dx = b.x - a.x, dy = b.y - a.y,
                L = (dx*dx + dy*dy)**0.5,
                wx = dx/L*50, wy = dy/L*50;
            fillPolygon(ctx, [{x:b.x+wx/4, y:b.y+wy/4},
                              {x:b.x-wx+wy/3, y:b.y-wy-wx/3},
                              {x:b.x-wx-wy/3, y:b.y-wy+wx/3}],
                       this.style.stroke);
        };
        if (this.flags & 1) arrow(b, this.a);
        if (this.flags & 2) arrow(b, this.c);
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
                    editPopup(this, x, y,
                              "Curve",
                              {text:"{arrow_forward} Toggle end arrow", action:()=>{this.editor().arrow(1)}},
                              {text:"{arrow_back} Toggle start arrow", action:()=>{this.editor().arrow(-1)}},
                             );

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
    arrow(d) {
        if (d === -1) {
            ur_begin("Bez2 curve start arrow toggle");
            ur_set(this.e, "flags", this.e.flags ^ 1);
            ur_end();
        } else if (d === 1) {
            ur_begin("Bez2 curve end arrow toggle");
            ur_set(this.e, "flags", this.e.flags ^ 2);
            ur_end();
        }
        invalidate();
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
            let c = new Bez2(p, p, p, 0, {stroke:"#000", width:8});
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
