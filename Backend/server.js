const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const filePath = './users.json';

// Read users
app.get('/users', (req, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    const users = JSON.parse(data);
    res.json(users);
  });
});

// Add user
app.post('/signup', (req, res) => {
  const newUser = req.body;

  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send('Error reading file');

    let users = JSON.parse(data);
    const exists = users.some(user => user.email === newUser.email);
    if (exists) return res.status(400).send('Email already exists');

    users.push(newUser);
    fs.writeFile(filePath, JSON.stringify(users, null, 2), err => {
      if (err) return res.status(500).send('Error writing file');
      res.status(201).send('User registered');
    });
  });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", 
      line_items: req.body.items.map(item => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name
            },
            unit_amount: (item.price),
          },
          quantity: item.quantity
        }
      }),
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/error'
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("Error creating checkout session:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});