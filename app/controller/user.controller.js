const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const Branch = require("../model/branch.model");
const saltRounds = 5;
const { Sequelize, Op } = require("sequelize");
const Membership = require("../model/membership.model");
//Register a User | guest
exports.createUser = async (req, res) => {
  if (req.body) {
    console.log("Create user");
    User.create(req.body)
      .then((user) => {
        res.send({
          success: "true",
          data: user,
        });
      })
      .catch((err) => {
        res.status(400).send({
          success: "false",
          message: "Error in Create User",
          description: err.message,
        });
      });
  }
};

// //Register a User | guest
// exports.createUser = async (req, res) => {
//   if (req.body) {
//     console.log("Create user");
//     bcrypt.genSalt(saltRounds, function (err, salt) {
//       bcrypt.hash(req.body.password, salt, function (err, hash) {
//         req.body.password = hash;
//         User.create(req.body)
//           .then((user) => {
//             res.send({
//               success: "true",
//               data: user,
//             });
//           })
//           .catch((err) => {
//             res.status(400).send({
//               success: "false",
//               message: "Error in Create User",
//               description: err.message,
//             });
//           });
//       });
//     });
//   }
// };

//login Validate
exports.validateUser = async (req, res) => {
  User.findOne({
    where: { email: req.body.email },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    bcrypt.compare(req.body.password, user.password, function (err, result) {
      // result == true
      console.log(result);
      if (result) {
        console.log(user);
        res.send({
          success: "true",
          data: user,
        });
      } else {
        console.log("Credentials Does Not Matched");
        res.status(400).send({
          success: "false",
          message: "Credentials Does Not Matched",
          description: "Entered credentials does not matched",
        });
      }
    });
  });
};

//login Validate by email and fireUID
exports.validateUserByFireUIDAndEmail = async (req, res) => {
  User.findOne({
    where: { email: req.body.email, fireUID: req.body.fireUID },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    console.log("dfgsfsdfsdfsdf0");

    if (user.type == "Customer") {
      console.log("dfgsfsdfsdfsdf0.1");

      checkMemberStatus(user.id, (err, member) => {
        if (err)
          return res.status(400).send({
            success: "false",
            data: err,
          });
        console.log("user");
        console.log(member);
        console.log(user);
        res.send({
          success: "true",
          data: user,
        });
      });
    } else {
      console.log(user);
      res.send({
        success: "true",
        data: user,
      });
    }
  });
};

function checkMemberStatus(userId, callback) {
  console.log("dfgsfsdfsdfsdf1");
  Membership.findAll({
    where: { userId: userId },
  })
    .then(async (member) => {
      const tody = new Date();
      const date = new Date(tody.setDate(tody.getDate() - 7));
      try {
        const promises = member.map((element) => {
          const expireDate = new Date(element.expireDate);
          console.log("dfgsfsdfsdfsdf1.1");
          console.log(date.toISOString());
          console.log(date.getTime());
          console.log(expireDate.toISOString());
          console.log(expireDate.getTime());
          console.log('expireDate.getTime() > date.getDate()');
          console.log(expireDate.getTime() > date.getTime());
          console.log('expireDate.getTime() < date.getDate()');
          console.log(expireDate.getTime() < date.getTime());

          if (expireDate.getTime() < date.getTime()) {
            console.log("dfgsfsdfsdfsdf2");

            Membership.update(
              { isActive: 0 },
              {
                where: {
                  id: element.id,
                },
              }
            )
              .then((membership) => {
                const newMember = membership;
                newMember.isActive = null;
                console.log(newMember);
              })
              .catch((err) => {
                callback(err);
              });
          }
        });
        await Promise.all(promises);

        callback(null, member);
      } catch (error) {
        callback(err);
      }
    })
    .catch((err) => {
      callback(err);
    });
}

//validate JWT and getUserDetail
exports.validateUserByJWT = async (req, res) => {
  User.findOne({
    where: { fireUID: req.user.uid },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    console.log(user);
    res.send({
      success: "true",
      data: user,
    });
  });
};

//login Find by email
exports.findUserByEmail = async (req, res) => {
  User.findOne({
    where: { email: req.params.email },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    console.log(user);
    res.send({
      success: "true",
      data: "User Found",
    });
  });
};

// remove all staff by branch
exports.removeAllStaffByBranchId = async (req, res) => {
  const userIdArr = [];
  User.findAll({
    where: { branchId: req.params.id },
  }).then(async (user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    await user.map((element) => {
      userIdArr.push({ id: element.id, branchId: null });
    });

    User.bulkCreate(userIdArr, { updateOnDuplicate: ["branchId"] })
      .then((attendItem) => {
        res.send({
          success: "true",
          data: attendItem,
          message: "Succesfully Remove Branch Staff",
        });
      })
      .catch((err) => {
        res.status(400).send({
          success: "false",
          message: "Error in Remove Branch Staff",
          description: err.message,
        });
      });
  });
};

//update User Details
exports.updateUser = async (req, res) => {
  if (req.body) {
    if (!req.params.id) return res.status(500).send("Id is missing");
    let id = req.params.id;
    updateDetails(id, req, (err, user) => {
      if (err)
        return res.status(400).send({
          success: "false",
          data: err,
        });
      console.log("user");
      console.log(user);
      res.status(200).send({
        success: user[0] == 1 ? "true" : "false",
        data: user[0] == 1 ? "Updated Successfully" : "Update Not Successful",
      });
    });
    console.log(req.body);
  }
};

// exports.updateUser = async (req, res) => {
//   if (req.body) {
//     if (!req.params.id) return res.status(500).send("Id is missing");
//     let id = req.params.id;
//     if (req.body.password != null) {
//       bcrypt.genSalt(saltRounds, function (err, salt) {
//         bcrypt.hash(req.body.password, salt, async function (err, hash) {
//           req.body.password = hash;
//           updateDetails(id, req, (err, user) => {
//             if (err)
//               return res.status(400).send({
//                 success: "false",
//                 data: err,
//               });
//             console.log("user");
//             console.log(user);
//             res.status(200).send({
//               success: user[0] == 1 ? "true" : "false",
//               data:
//                 user[0] == 1 ? "Updated Successfully" : "Update Not Successful",
//             });
//           });
//         });
//       });
//     } else {
//       updateDetails(id, req, (err, user) => {
//         if (err)
//           return res.status(400).send({
//             success: "false",
//             data: err,
//           });
//         console.log("user");
//         console.log(user);
//         res.status(200).send({
//           success: user[0] == 1 ? "true" : "false",
//           data: user[0] == 1 ? "Updated Successfully" : "Update Not Successful",
//         });
//       });
//     }
//     console.log(req.body);
//   }
// };

function updateDetails(id, req, callback) {
  User.update(req.body, {
    where: {
      id: id,
    },
  })
    .then((user) => {
      callback(null, user);
    })
    .catch((err) => {
      callback(err);
    });
}

//get All User
exports.getAllUser = (req, res) => {
  console.log("get All");
  User.findAll({})
    .then((user) => {
      res.send({
        success: "true",
        data: user,
      });
    })
    .catch((err) => {
      console.log(err.toString());
      res.status(400).send({
        success: "false",
        message: "Error in Getting All User",
        description: err.message,
      });
    });
};

exports.getUserById = (req, res) => {
  console.log("get One User");
  User.findOne({
    where: {
      id: req.params.id,
    },
  })
    .then((user) => {
      res.send({
        success: "true",
        data: user,
      });
    })
    .catch((err) => {
      res.status(400).send({
        success: "false",
        message: "Error in Getting SubscriptionType By ID",
        description: err.message,
      });
    });
};

//Get All users by branchID
exports.findUserByBranchId = async (req, res) => {
  User.findAll({
    where: { branchId: req.params.id },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    console.log(user);
    res.send({
      success: "true",
      data: user,
    });
  });
};

//Get All no branch staff
exports.findNullBranchStaff = async (req, res) => {
  User.findAll({
    where: {
      [Op.or]: [{ type: "Trainer" }, { type: "Manager" }],
      branchId: {
        [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }],
      },
    },
  }).then((user) => {
    if (!user) {
      console.log("User Not Found");
      return res.status(400).send({
        success: "false",
        message: "User Not Found",
        description: "Entered details does not found in database",
      });
    }
    console.log(user);
    res.send({
      success: "true",
      data: user,
    });
  });
};

//delete User
exports.deleteUser = async (req, res) => {
  console.log("Delete user");
  User.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((user) => {
      console.log(user);
      res.status(200).send({
        success: user == 1 ? "true" : "false",
        data: user == 1 ? "Deleted Successfully" : "Delete Not Successful",
      });
    })
    .catch((err) => {
      res.status(400).send({
        success: "false",
        message: "Error in Delete User",
        description: err.message,
      });
    });
};
