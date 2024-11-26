require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');

const app = express();
app.use(cors());
app.use(express.json());

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET
});

app.get('/api/flights', async (req, res) => {
  console.log('Search request:', req.query);
  try {
    const { origin, destination, date } = req.query;
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: date,
      adults: '1',
      max: '20'
    });

    const formattedFlights = response.data.map(flight => ({
      id: flight.id,
      priceMXN: Math.round(parseFloat(flight.price.total) * 17.05),
      airline: flight.validatingAirlineCodes[0],
      departure: {
        time: flight.itineraries[0].segments[0].departure.at,
        airport: flight.itineraries[0].segments[0].departure.iataCode
      },
      arrival: {
        time: flight.itineraries[0].segments[0].arrival.at,
        airport: flight.itineraries[0].segments[0].arrival.iataCode
      },
      duration: flight.itineraries[0].duration,
      stops: flight.itineraries[0].segments.length - 1,
      bookingLinks: {
        airline: `https://www.${flight.validatingAirlineCodes[0].toLowerCase()}.com`,
        skyscanner: `https://www.skyscanner.com.mx/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${date}`,
        kayak: `https://www.kayak.com.mx/flights/${origin}-${destination}/${date}`
      }
    }));

    res.json({
      flights: formattedFlights,
      bestPrice: Math.min(...formattedFlights.map(f => f.priceMXN))
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
