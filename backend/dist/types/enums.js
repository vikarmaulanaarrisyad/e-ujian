"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemesterType = exports.SubjectGroup = exports.Gender = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["ADMIN"] = "ADMIN";
    Role["GURU"] = "GURU";
    Role["STAFF"] = "STAFF";
})(Role || (exports.Role = Role = {}));
var Gender;
(function (Gender) {
    Gender["L"] = "L";
    Gender["P"] = "P";
})(Gender || (exports.Gender = Gender = {}));
var SubjectGroup;
(function (SubjectGroup) {
    SubjectGroup["KELOMPOK_A"] = "KELOMPOK_A";
    SubjectGroup["KELOMPOK_B"] = "KELOMPOK_B";
    SubjectGroup["KELOMPOK_C"] = "KELOMPOK_C"; // Ciri Khas Madrasah
})(SubjectGroup || (exports.SubjectGroup = SubjectGroup = {}));
var SemesterType;
(function (SemesterType) {
    SemesterType["ODD"] = "ODD";
    SemesterType["EVEN"] = "EVEN";
})(SemesterType || (exports.SemesterType = SemesterType = {}));
