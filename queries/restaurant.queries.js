const mongoose = require('mongoose');

const fs = require('fs');

const jsonData = fs.readFileSync('restaurant.json', 'utf8');

const Restaurant = require("../models/restaurant.models.js")

const restaurantsData = JSON.parse(jsonData);

// const addNewRestaurantData = {
//   "name": "Lajwaab Dhaba",
//   "cuisine": "Desi Punjabi ",
//   "address": "Urban",
//   "city": "Phagwara",
//   "rating": 3,
//   "menu": [
//     { "name": "Dal Makhni", "price": 140 },
//     { "name": "Tandoori Roti", "price": 8 }
//   ]
// }


async function seedDatabase() {
  try {
    for (const restaurantData of restaurantsData) {
      const newRestaurant = new Restaurant({
        name: restaurantData.name,
        cuisine: restaurantData.cuisine,
        address: restaurantData.address,
        city: restaurantData.city,
        rating: restaurantData.rating,
        menu: restaurantData.menu,
        reviews: restaurantData.reviews
      });

      await newRestaurant.save();
      console.log(`Restaurant "${newRestaurant.name}" seeded.`);
    }
    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
}




//ADD NEW RESTAURANT TO DATABASE:

async function addNewRestaurant(newRestaurantData) {
  try {
    const newRestaurant = new Restaurant(newRestaurantData)
    await newRestaurant.save();
    console.log(`Restaurant "${newRestaurant.name}" added.`);
    return newRestaurant
  }

  catch (error) {
    console.error('Error in adding Restaurant database:', error);
    throw error;
  }
}



//Retrieve restaurant details by name.

async function getRestaurantByName(name) {
  try {
    const findRes = await Restaurant.find({ name: name })
    console.log(`${name} Restaurant is found`, findRes)
    return findRes;
  }
  catch (error) {
    console.error('Error in finding Restaurant by NAME:', error);
    throw error;
  }
}


//Retrieve restaurants by cuisine type
async function getRestaurantByCuisine(cuisineName) {
  try {
    const findRes = await Restaurant.find({ cuisine: cuisineName });  // Fixed query here
    console.log(`Restaurants of ${cuisineName} cuisine found`, findRes);
    return findRes;
  } catch (error) {
    console.error('Error in finding Restaurant by CUISINE:', error);
    throw error;
  }
}



//Delete a restaurant by ID.
async function deleteResByID(ID) {
  try {
    const deleteRes = await Restaurant.findByIdAndDelete(ID)
    console.log(`Restaurants of ${ID} cuisine deleted`, deleteRes);
    return deleteRes;
  }
  catch (error) {
    console.error('Error in DELETING Restaurant by ID:', error);
    throw error;
  }
}



//Search for restaurants by location (city or address).
async function getResByLocation(location) {
  try {
    const findRes = await Restaurant.find({
      $or: [
        { address: new RegExp(location, 'i') },
        { city: new RegExp(location, 'i') }
      ]
    });

    console.log(`Restaurants found for location "${location}":`, findRes);
    return findRes;

  } catch (error) {
    console.error('Error in finding Restaurant by location:', error);
    throw error;
  }
}



//Update restaurant information (e.g., rating, address) by ID.
async function updateResDetailsById(ID, newDetails) {
  try {
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: ID },
      { rating: newDetails.rating },
      { new: true, useFindAndModify: false }
    );

    if (!updatedRestaurant) {
      console.log("Restaurant not found with the given ID.");
      return null;
    }

    console.log("Data updated", updatedRestaurant);
    return updatedRestaurant;

  } catch (error) {
    console.log("Error in updating the details", error);
    throw error;
  }
}



//Filtering Restaurants by Rating

async function filterRestaurantsByRating(minRating) {
  try {
    const restaurants = await Restaurant.find({ rating: { $gte: minRating } });
    console.log(restaurants);
    return restaurants;
  } catch (error) {
    console.error("Error in filtering restaurants by rating:", error);
    throw error;
  }
}




//Reading a Restaurant API
async function getAllRestaurant() {
  try {
    const allRes = await Restaurant.find({})
    if (allRes) {
      console.log("All Restaurant Found", allRes);
      return allRes;
    }
    else {
      console.log("No Restaurant in your database");
    }
  }
  catch (error) {
    console.error("Error in getting restaurants:", error);
    throw error;
  }
}




//Add a Dish to a Restaurant's Menu

async function addDishToMenu(restaurantId, newDish) {
  try {

    newDish._id = new mongoose.Types.ObjectId();


    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $push: { menu: newDish } },
      { new: true, useFindAndModify: false }
    );

    if (!updatedRestaurant) {
      console.log("Restaurant not found with the given ID.");
      return null;
    }

    console.log("Dish added successfully:", newDish);
    return updatedRestaurant;

  } catch (error) {
    console.error("Error in adding dish to menu:", error);
    throw error;
  }
}



//Remove a Dish from a Restaurant's Menu

async function removeDishFromRes(resId, menuName) {
  try {
    // Find the restaurant by ID
    const findRes = await Restaurant.findById(resId);
    console.log(resId);
    if (!findRes) {
      console.log("Restaurant not found");
      return null;
    }


    findRes.menu = findRes.menu.filter(dish => dish.name.toLowerCase() !== menuName.toLowerCase());

    const updatedRes = await findRes.save();

    console.log("Restaurant menu updated!", updatedRes);
    return updatedRes;

  } catch (error) {
    console.error("Error in removing dish from menu:", error);
    throw error;
  }
}




//Add a User Review and Rating for a Restaurant

async function addRestaurantReviewAndRating(restaurantId, reviewData) {
  try {

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      console.log("Restaurant not found with the given ID.");
      return null;
    }


    const existingReview = restaurant.reviews.find(review => review.username === reviewData.username);
    if (existingReview) {
      console.log("User has already reviewed this restaurant.");
      return null;
    }


    restaurant.reviews.push(reviewData);


    const totalRatings = restaurant.reviews.reduce((acc, review) => acc + review.rating, 0);
    restaurant.rating = (totalRatings / restaurant.reviews.length).toFixed(1);
    await restaurant.save();

    console.log("Review added successfully.");
    return restaurant;

  } catch (error) {
    console.error("Error in adding review and rating:", error);
    throw error;
  }
}



// Retrieving User Reviews for a Specific Restaurant

async function getUserReviewsForRestaurant(restaurantId) {
  try {

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      console.log("Restaurant not found with the given ID.");
      return null;
    }


    return restaurant.reviews;

  } catch (error) {
    console.error("Error in fetching reviews:", error);
    throw error;
  }
}





















module.exports = { seedDatabase, addNewRestaurant, getRestaurantByName, getRestaurantByCuisine, deleteResByID, getResByLocation, updateResDetailsById, filterRestaurantsByRating, getAllRestaurant, addDishToMenu, removeDishFromRes, addRestaurantReviewAndRating, getUserReviewsForRestaurant };