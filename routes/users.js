var express = require("express");
var User = require("../models/user");
const bodyParser = require("body-parser");
var passport = require("passport");
var authenticate = require("../authenticate");
const cors = require("./cors");

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.options("*", cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
});
router.get(
    "/",
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    function (req, res, next) {
        User.find({})
            .then(
                (users) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(users);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    }
);

router.post("/signup", cors.corsWithOptions, function (req, res, next) {
    User.register(
        new User({ username: req.body.username }),
        req.body.password,
        (err, user) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.json({ err: err });
            } else {
                if (req.body.firstname) user.lastname = req.body.lastname;
                if (req.body.lastname) user.firstname = req.body.firstname;
                user.save((err, user) => {
                    if (err) {
                        res.statusCode = 500;
                        res.setHeader("Content-Type", "application/json");
                        res.json({ err: err });
                        return;
                    }
                    passport.authenticate("local")(req, res, () => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json({
                            status: "Registration Successful!",
                            success: true,
                        });
                    });
                });
            }
        }
    );
});

router.post("/login", cors.corsWithOptions, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.json({
                status: "Login unsuccessful.",
                success: false,
                err: info,
            });
        }

        req.logIn(user, (err) => {
            if (err) {
                res.statusCode = 401;
                res.setHeader("Content-Type", "application/json");
                res.json({
                    status: "Login unsuccessful.",
                    success: false,
                    err: "Could not log in user.",
                });
            }

            var token = authenticate.getToken({ _id: req.user._id });
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.json({
                status: "Login successful!",
                success: true,
                token: token,
            });
        });
    })(req, res, next);
});

router.get("/checkJWTtoken", cors.corsWithOptions, (req, res) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            return res.json({
                status: "JWT invalid!",
                success: false,
                err: info,
            });
        } else {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            return res.json({
                status: "JWT valid!",
                success: true,
                user: user,
            });
        }
    })(req, res);
});

router.get("/logout", cors.cors, function (req, res, next) {
    if (req.session) {
        req.session.destroy();
        res.clearCookie("session-id");
        res.redirect("/");
    } else {
        var err = new Error("You are not logged in!");
        err.status = 403;
        next(err);
    }
});

module.exports = router;
