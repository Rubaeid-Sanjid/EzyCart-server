const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://ezycart-c0012.web.app"],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b8fibtq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const productCollection = client.db("EzyCart").collection("products");

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.items);

      const searchText = req.query.search;

      const brand = req.query.brand;
      const category = req.query.category;

      const minPrice = parseFloat(req.query.minPrice);
      const maxPrice = parseFloat(req.query.maxPrice);

      const sortBy = req.query.sortBy;

      let query = {};

      if (searchText) {
        query.Product_Name = { $regex: searchText, $options: "i" };
      }

      if (brand) {
        query.Brand_Name = { $regex: brand, $options: "i" };
      }

      if (category) {
        query.Category = { $regex: category, $options: "i" };
      }

      if (minPrice || maxPrice) {
        query.Price = { $gte: minPrice, $lte: maxPrice };
      }

      // For Sorting
      let sort = {};
      if (sortBy === "priceLowToHigh") {
        sort.Price = 1;
      } else if (sortBy === "priceHighToLow") {
        sort.Price = -1;
      } else if (sortBy === "newestFirst") {
        sort.Product_Creation_date = -1;
      }

      const products = await productCollection
        .find(query)
        .sort(sort)
        .skip(page * size)
        .limit(size)
        .toArray();

      const totalProducts = await productCollection.estimatedDocumentCount();

      res.send({ products, totalProducts });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("EzyCart server is running");
});

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
