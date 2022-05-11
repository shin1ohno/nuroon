"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.volumeGlyphs = exports.controlGlyphs = void 0;
const rocket_nuimo_1 = require("rocket-nuimo");
const pauseGlyph = rocket_nuimo_1.Glyph.fromString([
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
    "  ** **  ",
]);
const playingGlyph = rocket_nuimo_1.Glyph.fromString([
    "  **     ",
    "  ***    ",
    "  ****   ",
    "  *****  ",
    "  ****** ",
    "  *****  ",
    "  ****   ",
    "  ***    ",
    "  **     ",
]);
const rightGlyphStrings = [
    " **    *",
    " ***   *",
    " ****  *",
    " ***** *",
    " *******",
    " ***** *",
    " ****  *",
    " ***   *",
    " **    *",
];
const rightGlyph = rocket_nuimo_1.Glyph.fromString(rightGlyphStrings);
const leftGlyph = rocket_nuimo_1.Glyph.fromString(rightGlyphStrings.map((r) => r.split("").reverse().join("")));
const volume1 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "    *    ",
]);
const volume2 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "    *    ",
    "    *    ",
]);
const volume3 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume4 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "         ",
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume5 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume6 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume7 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume8 = rocket_nuimo_1.Glyph.fromString([
    "         ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
const volume9 = rocket_nuimo_1.Glyph.fromString([
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
    "    *    ",
]);
exports.controlGlyphs = {
    playing: playingGlyph,
    paused: pauseGlyph,
    stopped: rocket_nuimo_1.stopGlyph,
    loading: rocket_nuimo_1.errorGlyph,
    next: rightGlyph,
    previous: leftGlyph,
};
exports.volumeGlyphs = {
    volume0: rocket_nuimo_1.emptyGlyph,
    volume1: volume1,
    volume2: volume2,
    volume3: volume3,
    volume4: volume4,
    volume5: volume5,
    volume6: volume6,
    volume7: volume7,
    volume8: volume8,
    volume9: volume9,
};
