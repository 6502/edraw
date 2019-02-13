class Image {
    constructor(p0, p1, image, style) {
        this.p0 = p0;
        this.p1 = p1;
        this.image = image;
    }
    editor() {
        return new ImageEditor(this);
    }
    clone() {
        return new Image(this.p0, this.p1, this.image);
    }
    setStyle(f, val) {
    }
    draw(ctx) {
        drawImage(ctx, this.p0, this.p1, this.image);
    }
    hp() {
        let ox = -(this.p1.y - this.p0.y), oy = this.p1.x - this.p0.x,
            L = (ox**2 + oy**2)**0.5,
            nx = -ox/L, ny = -oy/L,
            r = dist(this.p0, this.p1) * this.image.height / this.image.width;
        return {x:this.p0.x+nx*r, y:this.p0.y+ny*r};
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
    }
};

class ImageEditor {
    constructor(e) {
        this.e = e;
        this.text = "Move image base point or change angle or size";
    }
    draw(ctx) {
        let hp0 = this.e.hp(),
            dx = hp0.x - this.e.p0.x, dy = hp0.y - this.e.p0.y,
            hp1 = {x:this.e.p1.x+dx, y:this.e.p1.y+dy};
        drawLine(ctx, this.e.p0, this.e.p1);
        drawLine(ctx, this.e.p1, hp1);
        drawLine(ctx, hp1, hp0);
        drawLine(ctx, hp0, this.e.p0);
        dot(ctx, this.e.p0);
        dot(ctx, this.e.p1);
    }
    hit(x, y, b) {
        let p = rmap(x, y);
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
                ur_begin("Image point drag");
                if (w === "p0") ur_set(this.e, "p0", np0);
                ur_set(this.e, "p1", np1);
                ur_end();
                first = false;
            });
            return true;
        }
    }
}
