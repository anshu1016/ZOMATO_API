const express = require('express');

const app = express();
const Restaurant = require("./models/restaurant.models.js")
const { initializeDatabase } = require("./db/db.js");
const {
  seedDatabase,
  addNewRestaurant,
  getRestaurantByName,
  getRestaurantByCuisine,
  deleteResByID,
  getResByLocation,
  updateResDetailsById,
  filterRestaurantsByRating,
  getAllRestaurant,
  addDishToMenu,
  removeDishFromRes,
  addRestaurantReviewAndRating,
  getUserReviewsForRestaurant
} = require("./queries/restaurant.queries.js")

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.listen(3000, () => {
  console.log('server started');
});


initializeDatabase();


//Add All Restaurant in to Mongoose DB
// seedDatabase();




//adding new Restaurant to database
// addNewRestaurant(); 
//API FOR ADDING NEW RESTAURANT TO DATABASE

app.post("/newRestaurant", async (req, res) => {
  try {
    const newRestaurantData = req.body;
    const savedRestaurant = await
      addNewRestaurant(newRestaurantData)
    res.status(201).json({ message: "Restaurant Added", data: savedRestaurant })
  } catch (err) {
    res.status(500).json({ status: "error", message: "Error in adding Restaurant", details: err.message })
  }
})




//Retrieve restaurant details by name.
// getRestaurantByName("Punjabi Dhaba");
app.get("/getRestaurantByName", async (req, res) => {
  try {
    const resName = req.query.name
    const findResByName = await getRestaurantByName(resName);
    res.status(201).json({ message: "Restaurant Found", data: findResByName })
  }
  catch (error) {

    res.status(500).json({ status: "error", message: "Error in finding Restaurant By cuisine", details: err.message })
  }
})




//Retrieve restaurants by cuisine type
// getRestaurantByCuisine("Antarctican");
app.get("/getCuisine", async (req, res) => {
  try {
    const cuisineType = req.query.cuisine;
    console.log(cuisineType)
    const findResByCuisine = await getRestaurantByCuisine(cuisineType);
    if (findResByCuisine && findResByCuisine.length > 0) {
      res.status(200).json({ message: "Restaurant Found By Cuisine", data: findResByCuisine });
    } else {
      res.status(404).json({ message: "No restaurants found for the specified cuisine." });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error in finding Restaurant By Cuisine", details: error.message });  // Fixed error reference
  }
});




//Delete a restaurant by ID.
// deleteResByID("6502de934bb3e290fb695277");
app.post("/deleteById", async (req, res) => {
  try {
    const ID = req.query.ID
    const delRes = await deleteResByID(ID)
    res.status(201).json({
      message: "Restaurant Deleted Successfully"
    })
  }
  catch (error) {
    res.status(500).json({ status: "error", message: "Error in deleting Restaurant By ID OR DOESNT EXIST IN DATABASE", details: error.message });
  }
})



//Search for restaurants by location (city or address).
// getResByLocation("Urban");
app.get('/restaurantsByLocation/:location', async (req, res) => {
  try {
    const location = req.params.location;

    if (!location) {
      return res.status(400).json({ message: "Please provide a location parameter (city or address)." });
    }

    const restaurants = await getResByLocation(location);

    if (restaurants && restaurants.length > 0) {
      return res.status(200).json({ message: "Restaurants fetched successfully.", data: restaurants });
    } else {
      return res.status(404).json({ message: "No restaurants found for the given location." });
    }

  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants.", details: error.message });
  }
});




//Update restaurant information (e.g., rating, address) by ID.
// updateResDetailsById("6502de914bb3e290fb695249",{rating:5});
app.post('/restaurant/:resId', async (req, res) => {
  try {
    const restaurantId = req.params.resId;
    const newDetails = req.body;

    const updatedRestaurant = await updateResDetailsById(restaurantId, newDetails);

    if (!updatedRestaurant) {
      return res.status(404).json({ message: "Restaurant not found with the given ID." });
    }

    res.status(200).json({ message: "Data updated successfully", data: updatedRestaurant });

  } catch (error) {
    res.status(500).json({ message: "Error updating the restaurant details", details: error.message });
  }
});




//Filtering Restaurants by Rating
// filterRestaurantsByRating(4);
app.get('/restaurants/rating/:minRating', async (req, res) => {
  try {
    const minRating = parseFloat(req.params.minRating);
    if (isNaN(minRating)) {
      return res.status(400).json({ message: "Invalid minRating value." });
    }

    const filteredRestaurants = await filterRestaurantsByRating(minRating);
    if (filteredRestaurants.length > 0) {
      res.status(200).json({ message: "Filtered restaurants fetched successfully.", data: filteredRestaurants });
    } else {
      res.status(404).json({ message: `No restaurants found with a rating of ${minRating} or higher.` });
    }

  } catch (error) {
    res.status(500).json({ message: "Error retrieving restaurants.", details: error.message });
  }
});




//Reterive All Restaurants
// getAlRestaurant();
app.get("/getRestaurants", async (req, res) => {
  try {
    const getAllRes = await getAllRestaurant();
    if (getAllRes) {
      res.status(201).json({ message: "All Restaurants Reterived", data: getAllRes })

    }
  }
  catch (error) {
    res.status(500).json({ message: "Error retrieving restaurants.", details: error.message });
  }
})




//Add a Dish to a Restaurant's Menu
// const newDish = {
//   name: "New Delight",
//   price: 8.50
// };
// addDishToMenu("65040028d16108e563ca775a",newDish);
app.post("/addMenu/:resId", async (req, res) => {
  try {
    const resId = req.params.resId;
    const newDishData = req.body;
    console.log(resId)
    const restaurantBeforeUpdate = await Restaurant.findById(resId);
    if (!restaurantBeforeUpdate) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const previousMenuLength = restaurantBeforeUpdate.menu.length;

    const addNewDishToRes = await addDishToMenu(resId, newDishData);

    if (addNewDishToRes && addNewDishToRes.menu.length > previousMenuLength) {
      res.status(201).json({ message: "Menu added successfully to restaurant", data: addNewDishToRes });
    } else {
      res.status(400).json({ message: "Unable to add menu to the restaurant." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in adding menu to restaurant.", details: error.message });
  }
});




//Remove a Dish from a Restaurant's Menu
// removeDishFromRes("65040028d16108e563ca775a","Grilled Cheese Sandwich");

app.post("/removeDish/:resId", async (req, res) => {
  try {
    const resId = req.params.resId;
    const menuDataToDelete = req.body.name
    const removeMenuFromRes = await removeDishFromRes(resId, menuDataToDelete);
    if (!removeMenuFromRes) {
      res.status(400).json({ message: "THis Restaurant doesn't exist." })

    }
    res.status(201).json({ message: "Menu Deleted Successfullly", resMenu: removeMenuFromRes })
  }
  catch (error) {
    res.status(500).json({ message: "Error in deleting menu from restaurant.", details: error.message });
  }
})




//Add a User Review and Rating for a Restaurant
// const newReview = {
//   username: "johnDoe",
//   comment: "Great ambiance and tasty food!",
//   rating: 4
// };
// addRestaurantReviewAndRating("65040028d16108e563ca7762", newReview);  // replace with a valid restaurantId from your db

app.post("/restaurant/:restaurantId/review", async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const reviewData = req.body;

    const updatedRestaurant = await addRestaurantReviewAndRating(restaurantId, reviewData);

    if (!updatedRestaurant) {
      return res.status(400).json({ message: "Review not added. Maybe the restaurant doesn't exist or user has already reviewed." });
    }

    res.status(200).json({ message: "Review added successfully", data: updatedRestaurant });

  } catch (error) {
    res.status(500).json({ message: "Error in adding review and rating.", details: error.message });
  }
});



//Retrieving User Reviews for a Specific Restaurant
// getUserReviewsForRestaurant();
app.get("/restaurants/:restaurantId/reviews", async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;

    const reviews = await getUserReviewsForRestaurant(restaurantId);

    if (!reviews) {
      return res.status(404).json({ message: "No reviews found for the specified restaurant or the restaurant doesn't exist." });
    }

    res.status(200).json({ message: "Reviews fetched successfully", data: reviews });

  } catch (error) {
    res.status(500).json({ message: "Error in fetching reviews.", details: error.message });
  }
});
