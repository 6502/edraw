class Group {
    constructor(r, entities) {
        this.r = r;
        this.entities = entities;
        this.crot = {x:(r.x0+r.x1)/2, y:(r.y0+r.y1)/2};
    }
    editor() {
        return new GroupEditor(this);
    }
    clone() {
        let g = new Group(clone(this.r), this.entities.map(e=>e.clone()));
        g.crot = this.crot;
        return g;
    }
    setStyle(f, val) {
        this.entities.forEach(e => e.setStyle(f, val));
    }
    draw(ctx) {
        this.entities.forEach(e => e.draw(ctx));
    }
    hit(x, y, b) {
        let pt = rmap(x, y);
        if (pt.x >= this.r.x0 && pt.y >= this.r.y0 && pt.x <= this.r.x1 && pt.y <= this.r.y1) {
            if (b === 0) {
                drag(this);
            } else {
                editPopup(this, x, y,
                          "Group",
                          {text:"◌ Explode", action:()=>{this.editor().explode()}});
            }
            return true;
        }
    }
    bbox() {
        return this.r;
    }
    transform(m) {
        let bb = undefined;
        this.entities.forEach(e => {
            e.transform(m);
            let b = e.bbox();
            if (bb === undefined) {
                bb = b;
            } else {
                bb.x0 = Math.min(bb.x0, b.x0);
                bb.y0 = Math.min(bb.y0, b.y0);
                bb.x1 = Math.max(bb.x1, b.x1);
                bb.y1 = Math.max(bb.y1, b.y1);
            }
        });
        ur_set(this, "crot", m(this.crot));
        ur_set(this, "r", bb);
    }
}

class GroupEditor {
    constructor(e) {
        this.e = e;
    }
    draw(ctx) {
        let a = {x:this.e.r.x0, y:this.e.r.y0},
            b = {x:this.e.r.x1, y:this.e.r.y0},
            c = {x:this.e.r.x1, y:this.e.r.y1},
            d = {x:this.e.r.x0, y:this.e.r.y1};
        dot(ctx, a); dot(ctx, b); dot(ctx, c); dot(ctx, d);
        dot(ctx, this.e.crot, "#0F0");
        drawLine(ctx, a, b);
        drawLine(ctx, b, c);
        drawLine(ctx, c, d);
        drawLine(ctx, d, a);
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        if (b === 0) {
            if (dist(p, this.e.crot) < 8/sf) {
                let first = true;
                track((x, y, b) => {
                    if (!first) undo();
                    ur_begin("Rotation center drag");
                    ur_set(this.e, "crot", rmap(x, y));
                    ur_end();
                    first = false;
                });
                return true;
            } else {
                let a = {x:this.e.r.x0, y:this.e.r.y0},
                    b = {x:this.e.r.x1, y:this.e.r.y0},
                    c = {x:this.e.r.x1, y:this.e.r.y1},
                    d = {x:this.e.r.x0, y:this.e.r.y1};
                if (Math.min(dist(a, p), dist(b, p), dist(c, p), dist(d, p)) < 8/sf) {
                    let first = true, a0 = Math.atan2(p.y-this.e.crot.y, p.x-this.e.crot.x),
                        cx = this.e.crot.x, cy =this.e.crot.y;
                    track((x, y, b) => {
                        let p = rmap(x, y);
                        if (!first) undo();
                        ur_begin("Group rotate");
                        let aa = Math.atan2(p.y-this.e.crot.y, p.x-this.e.crot.x) - a0,
                            cs = Math.cos(aa), sn = Math.sin(aa);
                        function r(p) {
                            let dx = p.x - cx, dy = p.y - cy;
                            return {x: cx + dx*cs - dy*sn,
                                    y: cy + dy*cs + dx*sn};
                        }
                        let bb = undefined;
                        this.e.entities.forEach(e => {
                            e.transform(r);
                            let b = e.bbox();
                            if (bb === undefined) {
                                bb = b;
                            } else {
                                bb.x0 = Math.min(bb.x0, b.x0);
                                bb.y0 = Math.min(bb.y0, b.y0);
                                bb.x1 = Math.max(bb.x1, b.x1);
                                bb.y1 = Math.max(bb.y1, b.y1);
                            }
                        });
                        ur_set(this.e, "r", bb);
                        ur_end();
                        first = false;
                    });
                    return true;
                } else if (p.x >= this.e.r.x0 && p.y >= this.e.r.y0 && p.x <= this.e.r.x1 && p.y <= this.e.r.y1) {
                    drag(this.e);
                    return true;
                }
            }
        }
    }
    explode() {
        let i = entities.indexOf(this.e);
        if (i >= 0) {
            let ne = entities.slice(0, i).concat(this.e.entities).concat(entities.slice(i+1)), oe = entities;
            ur_begin("Group explode");
            ur_add({undo: ()=>{ entities=oe; }, redo: ()=>{ entities=ne; }});
            ur_end();
            editor = undefined;
            invalidate();
        }
    }
}
