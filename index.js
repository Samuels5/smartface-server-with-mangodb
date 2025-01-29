const express = require("express");
const app = express();
const mangoose = require("mongoose");
const fetch = require("node-fetch");
const bodyparser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require("cors");
const User = require("./models/user.model.js");
app.use(bodyparser.json());
app.use(cors());

mangoose
  .connect(
    "mongodb+srv://samuels5:samuels5@smartface.4hb9l.mongodb.net/?retryWrites=true&w=majority&appName=smartface"
  )
  .then(() => {
    console.log("conected to database");
  })
  .catch(() => {
    console.log("connection failed");
  });

app.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email: email });
    // If user not found, return an error
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password
    const isMatch = bcrypt.compareSync(password, user.hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // If email and password are valid, respond with user data (excluding the password hash)
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      entries: JSON.stringify(user.entries), // include other fields as necessary
      joined: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get("/profile/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    // If user not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with user data (excluding the password hash)
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      entries: JSON.stringify(user.entries), // include other fields as necessary
      joined: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});
app.put("/image", async (req, res) => {
  const { id } = req.body; // Expecting userId in the request body

  try {
    // Increment the entries field by 1
    const user = await User.findByIdAndUpdate(
      id,
      { $inc: { entries: 1 } }, // Increment entries by 1
      { new: true } // Return the updated document
    );

    // If user not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with the updated number of entries
    res.status(200).json(JSON.stringify(user.entries));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.delete("/delete", async (req, res) => {
  const { email } = req.body; // Expecting email in the request body

  try {
    // Find and delete the user by email
    const result = await User.findOneAndDelete({ email: email });

    // If user not found, return a 404 error
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with a success message
    res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put("/update", async (req, res) => {
  const { email, name, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email: email });

    // If user not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's name
    user.name = name;

    // Hash the new password before saving
    if (password) {
      user.hash = bcrypt.hashSync(password); // Use a salt rounds parameter
    }

    // Save the updated user information
    await user.save();

    // Respond with the updated user data (excluding the password hash)
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      entries: JSON.stringify(user.entries), // include other fields as necessary
      joined: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/register", async (req, res) => {
  // console.log('register called')
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
  try {
    const user = await User.create({ name: name, email: email, hash: hash });
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      entries: JSON.stringify(user.entries),
      joined: user.createdAt,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/analyze", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  // const { modelId, modelVersionId, user_app_id, inputs } = req.body;
  const { IMAGE_URL } = req.body;
  const USER_ID = "clarifai";
  const APP_ID = "main";
  const MODEL_ID = "face-detection";
  const MODEL_VERSION_ID = "6dc7e46bc9124c5c8824be4822abe105";
  const modelId = MODEL_ID;
  const modelVersionId = MODEL_VERSION_ID;
  const user_app_id = {
    user_id: USER_ID,
    app_id: APP_ID,
  };
  // console.log("Request Body:", req.body); // Log the request body

  try {
    const response = await fetch(
      `https://api.clarifai.com/v2/models/${modelId}/versions/${modelVersionId}/outputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Key 8c694cbc06244d128411b68082b403e3`, // Replace with your actual API key
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_app_id: user_app_id, // Include the user_app_id here
          inputs: [
            {
              data: {
                image: {
                  url: IMAGE_URL,
                },
              },
            },
          ], // Pass the inputs received from the request
        }),
      }
    );
    // console.log(response);

    if (!response.ok) {
      const errorText = await response.text(); // Get the response text for debugging
      throw new Error(`Error from Clarifai API: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server runing on port 3000");
});
