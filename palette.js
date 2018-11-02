addButton("{cloud_download} Load", ()=>{ drawingDialog(false); });
addButton("{cloud_upload} Save", ()=>{ drawingDialog(true); });
addSpace();

addButton("{undo} Undo", ()=>{ editor=undefined; undo(); });
addButton("{redo} Redo", ()=>{ editor=undefined; redo(); });
addSpace();
addButton("Add Circle", draw_circle);
addButton("Add Curve", draw_curve);
addButton("Add Polygon", draw_polygon);

addSpace();

addButton("{arrow_upward} Up", ()=> editor && updown_entity(editor.e, 1));
addButton("{arrow_downward} Down", () => editor && updown_entity(editor.e, -1));
addButton("{vertical_align_top} Top", () => editor && updown_entity(editor.e, Infinity));
addButton("{vertical_align_bottom} Bottom", () => editor && updown_entity(editor.e, -Infinity));

addSpace();

addButton("{delete} Delete", ()=>{ editor && delete_entity(editor.e) });
addButton("{add_circle} Clone", ()=>{ editor && clone_entity(editor.e) });

addSpace();

let palette = document.createElement("div");
palette.style.width = "120px";
palette.style.textAlign = "center";
palette.style.margin = "10px";

btnbar.appendChild(palette);
for (let i=0; i<8; i++) {
    let colbtn = palette.appendChild(document.createElement("div")),
        col = "rgb(" + ((i>>2)&1)*255 + "," + ((i>>1)&1)*255 + "," + (i&1)*255 + ")";
    colbtn.style.backgroundColor = col;
    colbtn.className = "colbtn";
    colbtn.value = "";
    colbtn.onmousedown = (event)=>{
        event.preventDefault();
        event.stopPropagation();
        if (editor) {
            ur_begin("Color change");
            editor.e.setStyle(event.shiftKey ? "stroke" : "fill", col);
            ur_end();
        }
    };
}
