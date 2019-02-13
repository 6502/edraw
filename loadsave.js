let EntityTypes = [Circle, Bez2, Polygon, Group, Text],
    EntityTypeNames = EntityTypes.map(t => t.name);

function save(entities) {
    let data = JSON.stringify(entities,
                              (key, e) => {
                                  if (e && EntityTypes.indexOf(e.constructor) >= 0) {
                                      let t = {type: e.constructor.name};
                                      for (let k of Object.keys(e)) {
                                          t[k] = e[k];
                                      }
                                      return t;
                                  } else {
                                      return e;
                                  }
                              });
    return data;
}

function load(s) {
    return JSON.parse(s,
                      (key, e) => {
                          let i = e && e.type ? EntityTypeNames.indexOf(e.type) : -1;
                          if (i >= 0) {
                              let ne = Object.create(EntityTypes[i].prototype);
                              for (let k of Object.keys(e)) {
                                  if (k !== 'type') {
                                      ne[k] = e[k];
                                  }
                              }
                              return ne;
                          }
                          return e;
                      });
}

function icon(entities) {
    let bb = undefined;
    entities.forEach(e => {
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
    let canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
    canvas.width = canvas.height = 64;
    if (bb !== undefined) {
        let osf = sf, ozx = zx; ozy = zy;
        sf = Math.min(64/(bb.x1 - bb.x0), 64/(bb.y1 - bb.y0));
        zx = 32 - sf*(bb.x0 + bb.x1)/2;
        zy = 32 - sf*(bb.y0 + bb.y1)/2;
        entities.forEach(e => e.draw(ctx));
        sf = osf; zx = ozx; zy = ozy;
    }
    return canvas;
}

function drawingDialog(saving) {
    let g = document.createElement("div"),
        d = g.appendChild(document.createElement("div")),
        t = d.appendChild(document.createElement("div")),
        c = d.appendChild(document.createElement("div")),
        x = d.appendChild(document.createElement("div"));
    g.className = "glass";
    d.className = "dialog";
    x.className = "closebox";
    x.textContent = "×";
    x.onmousedown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        document.body.removeChild(g);
    };
    t.className = "title";
    t.textContent = "Drawing archive";
    c.className = "client";
    let drawings = (localStorage.getItem("edraw_archive") || "").split("\n");
    if (drawings[drawings.length-1] === "") drawings.pop();
    for (let i=0; i<drawings.length+(saving ? 1 : 0); i++) {
        let e = c.appendChild(document.createElement("div")), ic;
        e.className = "entry";
        if (i == drawings.length) {
            ic = document.createElement("canvas");
            let ctx = ic.getContext("2d");
            ic.width = ic.height = 64;
            ctx.beginPath();
            ctx.arc(32, 32, 16, 0, 2*Math.PI, true);
            ctx.fillStyle = "#CCC";
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(24, 32); ctx.lineTo(40, 32);
            ctx.moveTo(32, 24); ctx.lineTo(32, 40);
            ctx.strokeStyle = "#FFF";
            ctx.lineWidth = 5;
            ctx.stroke();
        } else {
            let ee = load(drawings[i]);
            ic = icon(ee);
            if (!saving) {
                ic.onmousedown = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    entities = ee;
                    undo_stack = [];
                    redo_stack = [];
                    ur_level = 0;
                    editor = undefined;
                    sf = 1; zx = 0; zy = 0;
                    invalidate();
                    document.body.removeChild(g);
                };
            }
        }
        if (saving) {
            ic.onmousedown = (event) => {
                event.preventDefault();
                event.stopPropagation();
                drawings[i] = save(entities);
                localStorage.setItem("edraw_archive", drawings.join("\n"));
                document.body.removeChild(g);
            };
        }
        e.appendChild(ic);
    }
    document.body.appendChild(g);
}
