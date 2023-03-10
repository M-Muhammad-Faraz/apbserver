const express = require("express");
const lecture = require("../../model/lecture.model");
const router = express.Router();
const { connection, auth, db } = require("../../settings/setting");

router.post("/", (req, res) => {
  const teacherID = req.body.teacherID;
  const query = `
    SELECT l.*, c.course_name FROM lectures l
    JOIN courses c ON l.course_code = c.course_code
    WHERE teacher_id = ?`;

  connection.query(query, [teacherID], (err, results) => {
    if (err) throw err;
    const lectures = new lecture(results);
    res.status(200).json({ msg: lectures.getAllLectures() });
  });
});
module.exports = router;
