const axios = require("axios");

const GOOGLE_API_KEY = "AIzaSyByeL4973jLw5-DqyPtVl79I3eDN4uAuAQ";

const getAddressFromCoordinates = async (lat, lng) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
  const response = await axios.get(url);

  if (response.data.status === "OK" && response.data.results.length > 0) {
    return response.data.results[0].formatted_address;
  } else {
    throw new Error("Unable to fetch address from coordinates");
  }
};

module.exports = { getAddressFromCoordinates };
