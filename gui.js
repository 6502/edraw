function popup(x, y, ...options) {
    show_popup(x, y, undefined, options);
}

function show_popup(x, y, parent, options) {
    let glass = document.createElement("div"),
        menu = glass.appendChild(document.createElement("div")),
        enter = false;
    glass.className = "glass";
    menu.className = "menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    options.forEach(o => {
        if (typeof o === "string") {
            let i = menu.appendChild(document.createElement("div"));
            i.className = "title";
            i.innerHTML = rtext(o);
        } else {
            let i = menu.appendChild(document.createElement("div"));
            i.className = "option";
            i.innerHTML = rtext(o.text);
            i.onmousedown = i.onmouseup = (event) => {
                event.preventDefault();
                event.stopPropagation();
                document.body.removeChild(glass);
                o.action();
            };
            i.onmouseenter = ()=>{ enter = true; };
        }
    });
    glass.onmouseup = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (enter) document.body.removeChild(glass);
    };
    glass.onmousedown = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        document.body.removeChild(glass);
    };
    document.body.appendChild(glass);
}

function addButton(text, action) {
    let d = document.createElement("button");
    d.className = "button";
    d.innerHTML = rtext(text);
    d.onclick = action;
    btnbar.appendChild(d);
}

function addSpace(text, action) {
    let d = document.createElement("div");
    d.className = "space";
    btnbar.appendChild(d);
}

function select(e) {
    editor = e;
    repaint();
}

function rtext(s) {
    return s.
        replace(/[\[]([^\]]*)[\]]/g, '<span class="key">$1</span>').
        replace(/{([^}]*)}/g, '<i class="material-icons" style="position:relative; top:6px">$1</i>');
}

function repaint() {
    let w = canvas.width = innerWidth;
    let h = canvas.height = innerHeight;
    if (grid) {
        ctx.beginPath();
        for (let y=Math.floor((0-zy)/sf/grid)*grid,yy; (yy=Math.floor((y*sf+zy)+0.5)+0.5)<h; y+=grid) {
            ctx.moveTo(0, yy); ctx.lineTo(w, yy);
        }
        for (let x=Math.floor((0-zx)/sf/grid)*grid,xx; (xx=Math.floor((x*sf+zx)+0.5)+0.5)<w; x+=grid) {
            ctx.moveTo(xx, 0); ctx.lineTo(xx, h);
        }
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    entities.forEach(e => e.draw(ctx));
    if (editor) {
        editor.draw(ctx);
        status.innerHTML = rtext(editor.text || "");
    } else {
        status.innerHTML = rtext("[left]:Select, [middle]:Pan, [wheel]:Zoom, [⇑][wheel]:Undo/Redo");
    }
}

function track(f) {
    function mm(event) {
        event.preventDefault();
        event.stopPropagation();
        f(event.clientX, event.clientY, event.button, 1);
    }
    function mu(event) {
        event.preventDefault();
        event.stopPropagation();
        f(event.clientX, event.clientY, event.button, 2);
        document.removeEventListener("mousemove", mm);
        document.removeEventListener("mouseup", mu);
    }
    document.addEventListener("mousemove", mm);
    document.addEventListener("mouseup", mu);
}

document.oncontextmenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

canvas.onmousedown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.button === 1) {
        let xx = event.clientX, yy = event.clientY;
        track((x, y) => {
            zx += x - xx; zy += y - yy;
            xx = x; yy = y;
            repaint();
        });
    } else {
        if (editor && editor.hit(event.x, event.y, event.button)) return;
        editor = undefined;
        invalidate();
        for (let i=entities.length-1; i>=0; i--) {
            if (entities[i].hit && entities[i].hit(event.x, event.y, event.button)) return;
        }
        if (event.button === 0) {
            let x0 = event.x, y0 = event.y, x1 = x0, y1 = y0;
            editor = {
                draw(ctx) {
                    ctx.beginPath();
                    ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1);
                    ctx.closePath();
                    ctx.strokeStyle = "#F00";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.fillStyle = "rgba(255, 0, 0, 0.125)";
                    ctx.fill();
                }
            };
            track((x, y, b, phase) => {
                x1 = x; y1 = y;
                if (phase === 2) {
                    editor = undefined;
                    let oe=entities, xe = [], ne = [], rr = undefined,
                        xa = (Math.min(x0, x1)-zx)/sf, xb = (Math.max(x0, x1)-zx)/sf,
                        ya = (Math.min(y0, y1)-zy)/sf, yb = (Math.max(y0, y1)-zy)/sf;
                    entities.forEach(e => {
                        let b = e.bbox();
                        if (b.x0 >= xa && b.y0 >= ya && b.x1 <= xb && b.y1 <= yb) {
                            if (rr === undefined) {
                                rr = b;
                            } else {
                                rr.x0 = Math.min(rr.x0, b.x0);
                                rr.y0 = Math.min(rr.y0, b.y0);
                                rr.x1 = Math.max(rr.x1, b.x1);
                                rr.y1 = Math.max(rr.y1, b.y1);
                            }
                            xe.push(e);
                        } else {
                            ne.push(e);
                        }
                    });
                    if (xe.length) {
                        ne.push(new Group(rr, xe));
                        ur_begin("Group creation");
                        ur_add({undo:()=>{ entities=oe; }, redo:()=>{ entities=ne; }});
                        ur_end();
                        editor = new GroupEditor(ne[ne.length-1]);
                    }
                }
                repaint();
            });
        } else if (event.button === 2) {
            popup(event.clientX, event.clientY,
                  "Draw",
                  {text: "circle", action: draw_circle},
                  {text: "curve", action: draw_curve},
                  {text: "polygon", action: draw_polygon},
                  {text: "text", action: draw_text},
                  "Grid",
                  {text: "10", action: ()=>{ grid=10; invalidate(); }},
                  {text: "20", action: ()=>{ grid=20; invalidate(); }},
                  {text: "50", action: ()=>{ grid=50; invalidate(); }},
                  {text: "off", action: ()=>{ grid=undefined; invalidate(); }}
                 );
        }
    }
};

function editPopup(e, x, y, ...extra) {
    select(e.editor());
    popup(x, y,
          "Edit",
          {text: "{delete} delete", action: ()=>{ delete_entity(e); }},
          {text: "{add_circle} clone", action: ()=>{ clone_entity(e); }},
          {text: "{arrow_upward} up", action: ()=>{ updown_entity(e, 1); }},
          {text: "{arrow_downward} down", action: ()=>{ updown_entity(e, -1); }},
          {text: "{vertical_align_top} top", action: ()=>{ updown_entity(e, Infinity); }},
          {text: "{vertical_align_bottom} bottom", action: ()=>{ updown_entity(e, -Infinity); }},
          ...extra);
}

canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
        let h = event.deltaY;
        if (h < 0) undo();
        if (h > 0) redo();
        editor = undefined;
    } else {
        let p = rmap(event.clientX, event.clientY);
        sf = Math.max(0.001, Math.min(1000, sf * Math.exp(-event.deltaY*[1, 10, 100][event.deltaMode]/300)));
        zx = event.clientX - p.x*sf;
        zy = event.clientY - p.y*sf;
        repaint();
    }
});

document.onkeydown = (event)=>{
    if (editor && editor.key) {
        editor.key(event.key);
        invalidate();
    }
    return true;
};

function drag(e) {
    let first = true, p;
    select(e.editor());
    track((x, y, b)=>{
        let np = rmap(x, y);
        if (first) {
            p = np;
        } else {
            undo();
        }
        ur_begin("Group translate");
        e.transform(pt=>({x:pt.x+np.x-p.x, y:pt.y+np.y-p.y}));
        ur_end();
        first = false;
    });
}

setInterval(()=>{
    let sz = innerWidth + "/" + innerHeight;
    if (sz !== csz) {
        csz = sz;
        repaint();
    }
}, 10);

function invalidate() {
    if (csz) {
        csz = undefined;
        setTimeout(()=>{
            csz = innerWidth + "/" + innerHeight;
            repaint();
        }, 0);
    }
}
