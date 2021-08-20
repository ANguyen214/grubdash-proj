const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists (req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order does not exist: ${orderId}.`,
    });
}

function orderHasMobileNumberProperty(req, res, next){
    const { data: { mobileNumber } = {} } = req.body;
    if(!mobileNumber || mobileNumber === ""){
        next({
            status: 400, 
            message: 'A mobile number must be required.'
        });
    }
    return next();
}

function orderHasDeliverToProperty(req, res, next) {
    const { data: { deliverTo } = {} } = req.body;
    if(!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: "deliverTo is required.",
        });
    }
    return next();
}

function orderHasStatusProperty(req, res, next){
    const { data: { status } = {} } = req.body;
    if(!status){
        next({
            status: 400,
            message: 'Order status is required.'
        });
    }
    return next();
}

function orderHasValidStatusProperty(req, res, next) {
    const { data: { status } = {} } = req.body;
    if(status === "preparing" || status === "out-for-delivery" || status === "delivered" || status === "pending"){
        return next();
    }
    next({
        status: 400,
        message: "Order must have a valid status.",
    });
}

function orderHasDishesProperty(req, res, next){
    const {data: {dishes} = {}} = req.body;
    if(!dishes || dishes.length <= 0){
        next({
            status: 400,
            message: 'Order must include at least one dish.'
        });
    }
    return next();
}

function dishesArrayValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if(Array.isArray(dishes)){
        return next();
    }
    next({
        status: 400, 
        message: "dishes must be array.",
    });
}

function orderHasQuantityProperty(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    const missingQuantity = dishes.find((dish) => !dish.quantity);
    if(missingQuantity){
        const index = dishes.indexOf(missingQuantity);
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0.`
        });
    }
    return next();
}

function validOrderQuantity(req, res, next) {
    const { data: { dishes } = {}} = req.body;
    const invalidInteger = dishes.find((dish) => !Number.isInteger(dish.quantity));
    if(invalidInteger){
        const index = dishes.indexOf(invalidInteger);
        next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0.`
        });
    }
    return next();
}

function pendingStatusCheck(req, res, next) {
    const order = res.locals.order;
    const { status } = order;
    if(status !== "pending"){
        next({
            status: 400,
            message: "Order is currently pending and cannot be deleted.",
        });
    }
    return next();
}

function orderIdMatch(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if(!id || orderId === id){
        return next();
    }
    next({
        status: 400, 
        message: `Order id: ${id} does not match the route id: ${orderId}`,
    });
}

function create(req, res){
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newId = new nextId();
    const newOrder = {
        id: newId,
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes,
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function list(req, res){
    res.json({ data: orders });
}

function read(req, res){
    res.json({ data: res.locals.order });
}

function update(req, res){
    const order = res.locals.order;
    const originalDeliverTo = order.deliverTo;
    const originalMobileNumber = order.mobileNumber;
    const originalStatus = order.status;
    const originalDishes = order.dishes;
    const originalQuantity = order.dishes.quantity;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const { data: { dishes: { quantity } } = {} } = req.body;
    if(originalDeliverTo !== deliverTo){
        order.deliverTo = deliverTo;
    }
    if(originalMobileNumber !== mobileNumber){
        order.mobileNumber = mobileNumber;
    }
    if(originalStatus !== status){
        order.status = status;
    }
    if(originalDishes !== dishes){
        order.dishes = dishes;
    }
    if(originalQuantity !== quantity){
        order.dishes.quantity = quantity;
    }
    res.json({ data: order });
}

function destroy(req, res){
    const {orderId} = req.params;
    const index = orders.findIndex((order) => Number(order.id) === Number(orderId));
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        orderHasDeliverToProperty, 
        orderHasMobileNumberProperty, 
        orderHasDishesProperty,
        dishesArrayValid, 
        orderHasQuantityProperty, 
        validOrderQuantity,
        create
    ],
    update: [
        orderExists, 
        orderHasDeliverToProperty, 
        orderHasMobileNumberProperty, 
        orderHasStatusProperty, 
        orderHasValidStatusProperty,
        orderHasDishesProperty, 
        dishesArrayValid,
        orderHasQuantityProperty, 
        validOrderQuantity,
        orderIdMatch,
        update
    ],
    delete: [orderExists, pendingStatusCheck, destroy]
}