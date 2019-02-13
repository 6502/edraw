class Text {
    constructor(p0, p1, h, text, style) {
        this.p0 = p0;
        this.p1 = p1;
        this.h = h;
        this.text = text;
        this.style = style;
    }
    editor() {
        return new TextEditor(this);
    }
    clone() {
        return new Text(this.p0, this.p1, this.h, this.text, clone(this.style));
    }
    setStyle(f, val) {
        ur_set(this.style, f, val);
    }
    draw(ctx) {
        drawText(ctx, this.p0, this.p1, this.h, this.text||"<text>", this.style.fill);
    }
    hp() {
        let ox = -(this.p1.y - this.p0.y), oy = this.p1.x - this.p0.x,
            L = (ox**2 + oy**2)**0.5,
            nx = -ox/L, ny = -oy/L;
        return {x:this.p0.x+nx*this.h, y:this.p0.y+ny*this.h};
    }
    hit(x, y, b) {
        let p = rmap(x, y);
        let hp = this.hp(), dx = hp.x-this.p0.x, dy = hp.y-this.p0.y;
        if (inside(p, [this.p0, this.p1, {x:this.p1.x+dx, y:this.p1.y+dy}, {x:this.p0.x+dx, y:this.p0.y+dy}])) {
            if (b === 0) {
                drag(this);
            } else if (b === 2) {
                editPopup(this, x, y);
            }
            return true;
        }
    }
    bbox() {
        let hp = this.hp(), dx = hp.x-this.p0.x, dy = hp.y-this.p0.y;
        let c = {x0:Math.min(this.p0.x, this.p0.x+dx, this.p1.x, this.p1.x+dx),
                 y0:Math.min(this.p0.y, this.p0.y+dy, this.p1.y, this.p1.y+dy),
                 x1:Math.max(this.p0.x, this.p0.x+dx, this.p1.x, this.p1.x+dx),
                 y1:Math.max(this.p0.y, this.p0.y+dy, this.p1.y, this.p1.y+dy)};
        return c;
    }
    transform(m) {
        let mp0 = m(this.p0), mp1 = m(this.p1);
        ur_set(this, "p0", mp0);
        ur_set(this, "p1", mp1);
        ur_set(this, "h", this.h * dist(mp0, mp1) / dist(this.p0, this.p1));
    }
};

class TextEditor {
    constructor(e) {
        this.e = e;
        this.text = "Move text base point or change text angle or size";
    }
    draw(ctx) {
        let hp = this.e.hp();
        drawLine(ctx, this.e.p0, this.e.p1);
        drawLine(ctx, this.e.p0, hp);
        dot(ctx, this.e.p0);
        dot(ctx, this.e.p1);
        dot(ctx, hp);
    }
    hit(x, y, b) {
        let p = rmap(x, y), hp = this.e.hp();
        if (dist(p, hp) < 8/sf) {
            let first = true;
            track((x, y) => {
                if (!first) undo();
                ur_begin("Text size drag");
                ur_set(this.e, "h", dist(rmap(x, y), this.e.p0));
                ur_end();
                first = false;
            });
            return true;
        }
        if (dist(p, this.e.p0) < 8/sf || dist(p, this.e.p1) < 8/sf) {
            let first = true,
                w = dist(p, this.e.p0) < dist(p, this.e.p1) ? "p0" : "p1";
            track((x, y) => {
                let q = rmap(x, y);
                let np0 = {x: this.e.p0.x + q.x - p.x,
                           y: this.e.p0.y + q.y - p.y},
                    np1 = {x: this.e.p1.x + q.x - p.x,
                           y: this.e.p1.y + q.y - p.y};
                p = q;
                if (!first) undo();
                ur_begin("Text point drag");
                if (w === "p0") ur_set(this.e, "p0", np0);
                ur_set(this.e, "p1", np1);
                ur_end();
                first = false;
            });
            return true;
        }
    }
    key(k) {
        if (k === "Backspace") {
            if (this.e.text.length) {
                ur_begin("Text edit");
                ur_set(this.e, "text", this.e.text.slice(0, -1));
                ur_end();
            }
        } else if (k.length === 1) {
            ur_begin("Text edit");
            ur_set(this.e, "text", this.e.text + k);
            ur_end();
        }
    }
}

function draw_text() {
    editor = {
        text: "Draw text: [left] on base point and drag for angle",
        draw(ctx) {
        },
        hit(x, y, b) {
            let c = new Text(rmap(x, y), rmap(x+1, y), 50, "", {fill:"#ABC"});
            ur_begin("Text draw");
            ur_add({undo(){ entities.pop(); }, redo(){ entities.push(c); }});
            ur_end();
            editor = new TextEditor(entities[entities.length-1]);
            repaint();
            let first = true;
            track((x, y) => {
                if (!first) undo();
                ur_begin("Text line drag");
                ur_set(c, "p1", {x, y});
                ur_end();
                first = false;
            });
            return true;
        }
    };
    repaint();
}
