const express = require("express");
const router = express.Router();
const { connection } = require("../../settings/setting");
const crypto = require("crypto");
const qr = require("../../model/qr.model");
function generateRandomString(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  let bytes = crypto.randomBytes(length);
  for (let i = 0; i < bytes.length; i++) {
    result += charset[bytes.readUInt8(i) % charset.length];
  }
  return result;
}

router.post("/:lectureId", (req, res) => {
  const lecture_id = req.params.lectureId;
  const randomString = generateRandomString(8);
  console.log(randomString);
  const code_id = randomString;
  const sql = `SELECT students.* FROM lecture_students
  JOIN students ON lecture_students.stud_id = students.stud_id
  WHERE lecture_id = ?`;

  connection.query(sql, [lecture_id], (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    const Qr = new qr(code_id);
    Qr.generateQR(results, lecture_id, res);
  });
});

module.exports = router;
