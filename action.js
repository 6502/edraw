
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

function updown_entity(e, delta) {
    let i = entities.indexOf(e);
    if (i >= 0) {
        let oe = entities, ne = oe.slice(0, i).concat(oe.slice(i+1)),
            j = Math.max(0, Math.min(ne.length, i+delta));
        if (j !== i) {
            ne.splice(j, 0, e);
            ur_begin("Change entity depth");
            ur_add({undo: ()=>{ entities=oe; }, redo: ()=>{ entities=ne; }});
            ur_end();
        }
    }
}

function delete_entity(e) {
    let i = entities.indexOf(e);
    if (i >= 0) {
        let ne = entities.slice(0, i).concat(entities.slice(i+1)), oe = entities;
        ur_begin("Entity delete");
        ur_add({undo:()=>{ entities=oe; }, redo:()=>{ entities=ne; }});
        ur_end();
        editor = undefined;
    }
}

function clone_entity(e) {
    let x = e.clone();
    ur_begin("Duplicate object");
    x.transform(p => ({x:p.x+16/sf, y:p.y+16/sf}));
    let ne = entities.concat([x]), oe = entities;
    ur_add({undo:()=>{ entities=oe; }, redo:()=>{ entities=ne; }});
    ur_end();
    editor = x.editor();
}
