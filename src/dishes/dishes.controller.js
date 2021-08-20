const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish id does not exist: ${dishId}.`,
    });
}

function dishIdValidation(req, res, next) {
    const { dishId } = req.params;
    const {data: {id} = {} } = req.body;
    if(!id || dishId === id){
        return next();
    } 
    next({
        status: 400,
        message: `Dish id: ${id} and Route id: ${dishId} do not match.`,
    });
}

function dishHasNameProperty(req, res, next) {
    const { data: { name } = {} } = req.body;
    if(!name || name === "") {
        next({
            status: 400,
            message: "A name is required"
        });
    } else {
        return next();
    }
}

function dishHasDescriptionProperty(req, res, next) {
    const { data: { description } = {} } = req.body;
    if(!description || description === "") {
        next({
            status: 400,
            message: "A description is required"
        });
    } else {
        return next();
    }
}

function dishHasPriceProperty(req, res, next) {
    const { data: { price } = {} } = req.body;
    if(!price || price <= 0) {
        next({
            status: 400,
            message: "A price greater than 0 is required"
        });
    } else {
        return next();
    }
}

function dishHasImageProperty(req, res, next) {
    const { data: {image_url} = {} } = req.body;
    if(!image_url || image_url === ""){
        next({
            status: 400,
            message: `An image_url is required. Received ${image_url}`,
        })
    }
    return next();
}

function priceNumValidation(req, res, next) {
    const { data: { price } = {} } = req.body;
    if(Number.isInteger(price)) {
        return next();
    } else {
        next({
            status: 400,
            message: `Price must be a number. Received: ${price}`,
        });
    }
}

function create(req, res){
    const { data: {name, description, price, image_url } = {} } = req.body;
    const newId = new nextId();
    const newDish = {
        id: newId,
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish);
    res.status(201).json({data: newDish });
}

function list(req, res) {
    res.json({ data: dishes });
}

function read(req, res){
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const dish = res.locals.dish;
    const originalName = dish.name;
    const originalDescription = dish.description;
    const originalPrice = dish.price;
    const originalImageUrl = dish.image_url;
    const { data: {name, description, price, image_url } = {} } = req.body;
    if(originalName !== name){
        dish.name = name;
    }
    if(originalDescription !== description){
        dish.description = description;
    }
    if(originalPrice !== price){
        dish.price = price;
    }
    if(originalImageUrl !== image_url){
        dish.image_url = image_url;
    }
    res.json({ data: dish });
}

module.exports = {
    list, 
    read: [dishExists, read],
    create: [
        dishHasNameProperty,
        dishHasDescriptionProperty,
        dishHasPriceProperty,
        dishHasImageProperty,
        priceNumValidation,
        create
    ],
    update: [
        dishExists,
        dishHasNameProperty,
        dishHasDescriptionProperty,
        dishHasPriceProperty,
        dishHasImageProperty,
        priceNumValidation,
        dishIdValidation,
        update
    ]
}