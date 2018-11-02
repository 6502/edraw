function ur_begin(title) {
    if (++ur_level === 1) {
        redo_stack.splice(0, redo_stack.length);
        undo_stack.push([title]);
    }
}

function ur_end() {
    --ur_level;
}

function ur_add(step) {
    undo_stack[undo_stack.length-1].push(step);
    step.redo();
    invalidate();
}

function ur_set(obj, index, value) {
    let ov = obj[index];
    ur_add({undo:()=>{ obj[index] = ov; },
            redo:()=>{ obj[index] = value; }});
}

function ur_vset(sgf, value) {
    let ov = sgf();
    ur_add({undo:()=>{ sgf(ov); },
            redo:()=>{ sgf(value); }});
}

function undo() {
    if (undo_stack.length) {
        let op = undo_stack.pop();
        redo_stack.push(op);
        for (let i=op.length-1; i>0; i--) {
            op[i].undo();
        }
        invalidate();
    }
}

function redo() {
    if (redo_stack.length) {
        let op = redo_stack.pop();
        undo_stack.push(op);
        for (let i=1; i<op.length; i++) {
            op[i].redo();
        }
        invalidate();
    }
}
