function map({x, y}) {
    return {x: x*sf+zx, y: y*sf+zy};
}

function rmap(x, y) {
    return {x: (x-zx)/sf, y: (y-zy)/sf};
}

function dist(a, b) {
    return ((a.x - b.x)**2 + (a.y - b.y)**2) ** 0.5;
}

function lerp(a, b, t) {
    return a*(1-t) + b*t;
}

function lerp2(a, b, c, t) {
    return (a*(1-t)+b*t)*(1-t) + (b*(1-t)+c*t)*t;
}

function avg(a, b){
    return {x:(a.x+b.x)/2, y:(a.y+b.y)/2};
}

function inside(p, pts) {
    let r = false;
    for (let i=0,n=pts.length,j=n-1; i<n; j=i++) {
        let a = pts[j], b = pts[i];
        if ((p.y >= b.y && p.y < a.y) || (p.y >= a.y && p.y < b.y)) {
            if (a.x + (p.y - a.y)*(b.x - a.x)/(b.y - a.y) < p.x) r = !r;
        }
    }
    return r;
}

function dot(ctx, p, color="#F00", r=-4){
    ctx.beginPath();
    ctx.arc(p.x*sf+zx, p.y*sf+zy, r<0 ? -r : r*sf, 0, 2*Math.PI, true);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawLine(ctx, a, b, color="#F00", width=-1) {
    ctx.beginPath();
    ctx.moveTo(a.x*sf+zx, a.y*sf+zy);
    ctx.lineTo(b.x*sf+zx, b.y*sf+zy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width<0 ? -width : width*sf;
    ctx.stroke();
}

function drawBez2(ctx, a, b, c, color="#F00", width=-1) {
    ctx.beginPath();
    ctx.moveTo(a.x*sf+zx, a.y*sf+zy);
    ctx.quadraticCurveTo(b.x*sf+zx, b.y*sf+zy, c.x*sf+zx, c.y*sf+zy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width<0 ? -width : width*sf;
    ctx.stroke();
}

function drawCircle(ctx, p, r, color="#F00", width=-1) {
    ctx.beginPath();
    ctx.arc(p.x*sf+zx, p.y*sf+zy, r*sf, 0, 2*Math.PI, true);
    ctx.strokeStyle = color;
    ctx.lineWidth = width<0 ? -width : width*sf;
    ctx.stroke();
}

function fillCircle(ctx, p, r, color) {
    ctx.beginPath();
    ctx.arc(p.x*sf+zx, p.y*sf+zy, r*sf, 0, 2*Math.PI, true);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawPolygon(ctx, pts, color="#F00", width=-1) {
    ctx.beginPath();
    pts.forEach((p, i) => {
        if (i) {
            ctx.lineTo(p.x*sf+zx, p.y*sf+zy);
        } else {
            ctx.moveTo(p.x*sf+zx, p.y*sf+zy);
        }
    });
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width<0 ? -width : width*sf;
    ctx.stroke();
}

function fillPolygon(ctx, pts, color="#F00") {
    ctx.beginPath();
    pts.forEach((p, i) => {
        if (i) {
            ctx.lineTo(p.x*sf+zx, p.y*sf+zy);
        } else {
            ctx.moveTo(p.x*sf+zx, p.y*sf+zy);
        }
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
