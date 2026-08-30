// Chara Reimbursement Form — page 1 coordinate map.
// Shared by the browser and the Node calibration harness.
// All values measured from the PDF's own vector grid (612x792, origin bottom-left).
export const MAX_ROWS = 4;

export const L = {
  deptCell:   { x0: 132.1, x1: 202.1, y0: 638.3, y1: 690.3 },
  cols: {
    desc: { x0: 59.2,  x1: 231.2 },
    acct: { x0: 231.2, x1: 342.0 },
    code: { x0: 342.0, x1: 449.1 },
    amt:  { x0: 449.1, x1: 537.2 },
  },
  // body rows, top -> bottom rule
  rows: [[587.3, 559.8], [559.8, 532.3], [532.3, 504.8], [504.8, 477.2]],
  totalBaseline: 466,          // preprinted "$" sits at x=455, baseline 467
  totalRightEdge: 530,
  checkbox: {                  // exact 10.3pt squares from the vector layer
    check:       { x: 187.2, y: 465.0, s: 10.3 },
    cash:        { x: 290.2, y: 465.0, s: 10.3 },
    attached:    { x: 174.3, y: 395.8, s: 10.3 },
    notAttached: { x: 322.0, y: 395.8, s: 10.3 },
  },
  payee:     { x: 143, baseline: 372.5 },   // underline y=369.7
  address:   { x: 143, baseline: 358.2 },   // underline y=355.4
  requester: { x: 135, baseline: 332.4 },   // underline y=329.6
  // the blank form has "/ / 2020" preprinted here; we white it out and reprint
  reqDate:   { x: 472, baseline: 332.4, mask: { x: 468, y: 330.4, w: 64, h: 12 } },
  // the cash section's year is likewise preprinted; we leave the section blank but
  // hide the stale "2020" so the sheet matches the form the church already uses
  recvDateMask: { x: 494, y: 268.4, w: 34, h: 12 },
};
