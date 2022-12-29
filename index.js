const express = require("express");
const cors = require("cors");
const connection = require("./settings/sql_connection");
const auth = require("firebase-admin/auth");
const db = require("./settings/firebase_setup");
const PORT = 8000;

// Initializing Server
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

//Requests
app.post("/register-new-teacher", (req, res) => {
  const creds = req.body;
  if (creds) {
    if (
      (creds.teacher_name != "" ||
        creds.teacher_phone != "" ||
        creds.teacher_email != "" ||
        creds.teacher_password != "") &&
      creds.teacher_name &&
      creds.teacher_phone &&
      creds.teacher_email &&
      creds.teacher_password
    ) {
      auth
        .getAuth()

        .createUser({
          email: creds.teacher_email,
          phoneNumber: creds.teacher_phone,
          password: creds.teacher_password,
          displayName: creds.teacher_name,
        })
        .then((userRecord) => {
          console.log("Successfully created new teacher:", userRecord.uid);
          const docRef = db.collection("pending").doc(userRecord.uid);
          docRef
            .set({
              teacher_uid: userRecord.uid,
              teacher_name: userRecord.displayName,
              teacher_phone: userRecord.phoneNumber,
              teacher_email: userRecord.email,
              teacher_password: creds.teacher_password,
            })
            .then(() => {
              res.status(200).json({
                code: 200,
                message:
                  "Account Created Successfully. Please contact admin for approval. ",
              });
            })
            .catch((e) => {
              console.log("Error Adding to Database time to roll back");
              auth
                .getAuth()
                .deleteUser(userRecord.uid)
                .then(() => {
                  const deldoc = db.collection("pending").doc(userRecord.uid);
                  deldoc.delete().then(() => {
                    console.log("Teacher Account ROLLBACKED");
                  });
                });
              res.status(400).json({
                err: "System error: Couldn't Create Account at this time",
              });
            });
        })
        .catch((error) => {
          console.log("Error creating new user:", error);
          res.status(400).json({
            err: "System error: ERMERRWHLADDTOAUTH",
            actualERR: error,
          });
        });
    } else {
      res.status(400).json({ err: "Incomplete Credentials" });
    }
  } else {
    res.status(400).json({ err: "Empty Credentials" });
  }
});
app.post("/teacher-action", (req, resp) => {
  const pending = req.body;
  if (pending) {
    if (pending.action == "approved") {
      connection.query(
        `INSERT INTO teachers VALUES (?, ?, ?, ?);`,
        [
          pending.teacher.teacher_uid,
          pending.teacher.teacher_name,
          pending.teacher.teacher_email,
          pending.teacher.teacher_phone,
        ],
        (err, res) => {
          if (err) {
            console.log(err);
            res.status(500).json({ err: "Error approving teacher!" });
            throw err;
          }
        }
      );
      db.collection("pending")
        .doc(pending.teacher.teacher_uid)
        .delete()
        .then((res) => {
          resp.status(200).json({
            message: "teacher approved",
          });
        })
        .catch((e) => {
          throw e;
        });
    } else {
      db.collection("pending")
        .doc(pending.teacher.teacher_uid)
        .delete()
        .then((res) => {
          auth
            .getAuth()
            .deleteUser(pending.teacher.teacher_uid)
            .then(() => {
              console.log("Successfully Teacher disapproved");

              resp.status(200).json({
                msg: "teacher  disapproved",
              });
            })
            .catch((error) => {
              throw error;
            });
        });
    }
  } else {
    resp.status(400).json({
      err: "No Action Provided",
    });
  }
});
app.post("/add-new-student", (req, resp) => {
  const studInfo = req.body;
  if (studInfo) {
    auth
      .getAuth()
      .createUser({
        email: studInfo.reg_no + "@cust.pk",
        password: studInfo.password,
        displayName: studInfo.name,
      })
      .then((userRecord) => {
        console.log("Successfully created new user:", userRecord.uid);
        connection
          .query(`INSERT INTO students VALUES (?, ?, ?, ?, ?);`, [
            userRecord.uid,
            studInfo.reg_no,
            studInfo.name,
            studInfo.degree,
            studInfo.reg_no + "@cust.pk",
          ])
          .on("error", (e) => {
            console.log(e);
            auth
              .getAuth()
              .deleteUser(userRecord.uid)
              .then(() => {
                console.log("Successfully Student Removed");
              })
              .catch((error) => {
                console.log("Error deleting user:", error);
              });
            resp.status(500).json({ err: "Error Adding Student!" });
          });
        resp.status(400).json({ err: "Added Student!" });
      })
      .catch((error) => {
        console.log("Error creating new user:", error);
      });
  } else {
    resp.status(400).json({ err: "Info Not provided" });
  }
});

app.post("/auth-admin", (req, res) => {});
app.post("/auth-teacher", (req, res) => {});
app.post("/auth-student", (req, res) => {});
//Running Server
app.listen(PORT, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", PORT);
});
