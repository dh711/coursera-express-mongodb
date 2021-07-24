const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require("../authenticate");
const Favorites = require("../models/favorites");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .populate("user")
            .populate("dishes")
            .then(
                (favorites) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorites);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }).then(
            (favorite) => {
                if (favorite == null) {
                    const dishes = [];

                    req.body.forEach((object) => {
                        dishes.push(object._id);
                    });

                    Favorites.create({
                        user: req.user._id,
                        dishes: dishes,
                    })
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                        .catch((err) => next(err));
                } else if (favorite != null) {
                    req.body.forEach((object) => {
                        if (favorite.dishes.indexOf(object._id) === -1) {
                            favorite.dishes.push(object._id);
                        }
                    });
                    favorite.save().then((favorite) => {
                        Favorites.findById(favourite._id)
                            .populate("user")
                            .populate("dishes")
                            .then((favourites) => {
                                console.log("Favorite created ", favorite);
                                res.statusCode = 200;
                                res.setHeader(
                                    "Content-Type",
                                    "application/json"
                                );
                                res.json(favorite);
                            });
                    });
                } else {
                    err = new Error("Something went wrong.");
                    err.status = 404;
                    return next(err);
                }
            },
            (err) => next(err)
        );
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites");
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user._id })
            .then(
                (resp) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp);
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

favoriteRouter
    .route("/:favoriteId")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorites) => {
                    if (!favorites) {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({
                            exists: false,
                            favorites: favorites,
                        });
                    } else {
                        if (
                            favorites.dishes.indexOf(req.params.favoriteId) < 0
                        ) {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({
                                exists: false,
                                favorites: favorites,
                            });
                        } else {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({
                                exists: true,
                                favorites: favorites,
                            });
                        }
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (!favorite) {
                        Favorites.create({
                            user: req.user._id,
                        })
                            .then(
                                (favorite) => {
                                    favorite.dishes.push(req.params.favoriteId);
                                    favorite.save().then((favorite) => {
                                        console.log(
                                            "Favorite created ",
                                            favorite
                                        );
                                        res.statusCode = 200;
                                        res.setHeader(
                                            "Content-Type",
                                            "application/json"
                                        );
                                        res.json(favorite);
                                    });
                                },
                                (err) => next(err)
                            )
                            .catch((err) => next(err));
                    } else {
                        if (
                            favorite.dishes.indexOf(req.params.favoriteId) < 0
                        ) {
                            favorite.dishes.push(req.params.favoriteId);
                            favorite.save().then((favorite) => {
                                Favorites.findById(favourite._id)
                                    .populate("user")
                                    .populate("dishes")
                                    .then((favourites) => {
                                        console.log(
                                            "Favorite created ",
                                            favorite
                                        );
                                        res.statusCode = 200;
                                        res.setHeader(
                                            "Content-Type",
                                            "application/json"
                                        );
                                        res.json(favorite);
                                    });
                            }),
                                (err) => next(err);
                        } else {
                            err = new Error("Favorite already added.");
                            err.status = 200;
                            return next(err);
                        }
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(
            "PUT operation not supported on /favorites/" +
                req.params.favoriteId +
                "\n"
        );
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (
                        favorite != null &&
                        favorite.dishes.indexOf(req.params.favoriteId) !== -1
                    ) {
                        const i = favorite.dishes.indexOf(
                            req.params.favoriteId
                        );

                        if (i > -1) favorite.dishes.splice(i, 1);

                        favorite.save().then((favorite) => {
                            Favorites.findById(favourite._id)
                                .populate("user")
                                .populate("dishes")
                                .then((favourites) => {
                                    console.log("Favorite created ", favorite);
                                    res.statusCode = 200;
                                    res.setHeader(
                                        "Content-Type",
                                        "application/json"
                                    );
                                    res.json(favorite);
                                });
                        }),
                            (err) => next(err);
                    } else if (
                        favorite.dishes.indexOf(req.params.favoriteId) === -1
                    ) {
                        err = new Error("Dish does not exist in favorites.");
                        err.status = 404;
                        return next(err);
                    } else if (dish == null) {
                        err = new Error(
                            "Favorites " + req.params.dishId + " not found."
                        );
                        err.status = 404;
                        return next(err);
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;
