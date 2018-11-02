class Polygon {
    constructor(pts, style) {
        this.pts = pts;
        this.style = style;
        this.smooth = false;
    }
    editor() {
        return new PolygonEditor(this);
    }
    clone() {
        return new Polygon(this.pts.slice(), clone(this.style));
    }
    setStyle(f, val) {
        ur_set(this.style, f, val);
    }
    draw(ctx) {
        if (this.style.stroke) drawPolygon(ctx, this.pts, this.style.stroke, this.style.width);
        if (this.style.fill) fillPolygon(ctx, this.pts, this.style.fill);
    }
    hit(x, y, b) {
        let p = rmap(x, y)
        if (inside(p, this.pts)) {
            if (b === 0) {
                drag(this);
            } else {
                editPopup(this, x, y);
            }
            return true;
        }
    }
    bbox() {
        let X = this.pts.map(p=>p.x), Y = this.pts.map(p=>p.y);
        return {x0: Math.min(...X),
                y0: Math.min(...Y),
                x1: Math.max(...X),
                y1: Math.max(...Y)};
    }
    transform(m) {
        for (let i=0; i<this.pts.length; i++) {
            ur_set(this.pts, i, m(this.pts[i]));
        }
    }
}

class PolygonEditor {
    constructor(e) {
        this.e = e;
        this.text = "Drag control points";
    }
    draw(ctx) {
        for (let i=0,n=this.e.pts.length,j=n-1; i<n; j=i++) {
            drawLine(ctx, this.e.pts[j], this.e.pts[i]);
            dot(ctx, this.e.pts[i]);
            dot(ctx, avg(this.e.pts[j], this.e.pts[i]), "#0F0", -2);
        }
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        for (let i=0,n=this.e.pts.length; i<n; i++) {
            if (dist(p, this.e.pts[i]) < 8/sf) {
                if (b === 0) {
                    let first = true;
                    track((x, y) => {
                        if (!first) undo();
                        ur_begin("Polygon point drag");
                        ur_set(this.e.pts, i, rmap(x, y));
                        ur_end();
                        first = false;
                    });
                    return true;
                } else {
                    ur_begin("Polygon point delete");
                    ur_set(this.e, "pts", this.e.pts.slice(0, i).concat(this.e.pts.slice(i+1)));
                    ur_end();
                    return true;
                }
            }
        }
        for (let i=0,n=this.e.pts.length,j=n-1; i<n; j=i++) {
            let m = avg(this.e.pts[i], this.e.pts[j]);
            if (dist(p, m) < 8/sf) {
                ur_begin("Polygon point insert");
                ur_set(this.e, "pts", this.e.pts.slice(0, i).concat([p]).concat(this.e.pts.slice(i)));
                ur_end();
                let first = true;
                track((x, y) => {
                    if (!first) undo();
                    ur_begin("Polygon point drag");
                    ur_set(this.e.pts, i, rmap(x, y));
                    ur_end();
                    first = false;
                });
                return true;
            }
        }
    }
}

function draw_polygon() {
    editor = {
        text: "Add Polygon: [left] on start and drag",
        draw(ctx) {
        },
        hit(x, y, b) {
            let p = rmap(x, y);
            let c = new Polygon([p, p, p, p], {fill:"#008"});
            ur_begin("Polygon draw");
            ur_add({undo(){ entities.pop(); }, redo(){ entities.push(c); }});
            ur_end();
            editor = new PolygonEditor(entities[entities.length-1]);
            repaint();
            let first = true;
            track((x, y) => {
                let p = rmap(x, y);
                if (!first) undo();
                ur_begin("Polygon draw");
                ur_set(c.pts, 2, p);
                ur_set(c.pts, 1, {x:p.x, y:c.pts[0].y});
                ur_set(c.pts, 3, {x:c.pts[0].x, y:p.y});
                ur_end();
                first = false;
            });
            return true;
        }
    };
    repaint();
}
