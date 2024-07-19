const express = require("express");
const axios = require("axios");
const { createClient } = require("redis");

const app = express();
const port = process.env.PORT || 3000;

let redisClient;

(async () => {
  redisClient = createClient();

  redisClient.on("error", (error) => {
    console.error(`Redis client error: ${error}`);
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`Could not establish a connection with Redis. ${error}`);
    process.exit(1);
  }
})();

async function fetchApiData(species) {
  const apiResponse = await axios.get(
    `https://www.fishwatch.gov/api/species/${species}`
  );
  console.log("Request sent to the API");
  return apiResponse.data;
}

async function getSpeciesData(req, res) {
  const species = req.params.species;
  let results;
  let isCached = false;

  try {
    const cacheResults = await redisClient.get(species);
    if (cacheResults) {
      isCached = true;
      results = JSON.parse(cacheResults);
    } else {
      results = await fetchApiData(species);
      if (results.length === 0) {
        throw new Error("API returned an empty array");
      }
      await redisClient.set(species, JSON.stringify(results), {
        EX: 3600, // Cache expiry time in seconds (optional)
      });
    }

    res.send({
      fromCache: isCached,
      data: results,
    });
  } catch (error) {
    console.error(`Error fetching species data: ${error}`);
    res.status(500).send("Data unavailable");
  }
}

app.get("/fish/:species", getSpeciesData);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
