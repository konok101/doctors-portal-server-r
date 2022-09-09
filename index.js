const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8gvjjte.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');
    const bookingsCollection = client.db('doctors_portal').collection('booked');

    app.get('/service', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);

    });

    //available appainment slots
    app.get('/available', async (req, res) => {
      const date = req.query.date;

      // step 1:  get all services
      const q={};
      const services = await serviceCollection.find(q).toArray();

      //step 2: get the booking of the day
      const query = { date: date };
      const bookings = await bookingsCollection.find(query).toArray();

      //  const query = {};
      //  const cursor =  bookingsCollection.find(query);
      //  const  abc = await cursor.toArray();
      //  res.send(abc);

      //step 3: for each service
      services.forEach(service => {
        //  step 4  find bookings for each service
        const serviceBooking = bookings.filter(book => book.treatment === service.name);
        //step 5: select slots for the service bookings
        const bookedSlots = serviceBooking.map(book => book.slot);
        // step:6 seletet those slots that are not in booked slots
        const available = service.slots.filter(slot => ! bookedSlots.includes(slot));
        //step 7: 
        service.slots = available;
      })

      res.send(services);





    })


    /**
     * API Naming convention
     * app.get('/booking') //get all booking in this collection
     * app.get('/booking/:id') // get a specific booking
     * app.post('/booking') //add a new booking
     * app.patch('/booking/:id') // update booking signle person information
     * app.delete('/booking/:id')//for delete
     * 
     * 
    */

    // Bookings patient
    app.get('/bookings', async (req, res) => {
      const patinent = req.query.patient;
       console.loxg("sas");
      const query = { patient: patinent };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);

    })

    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
      const exists = await bookingsCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send({ success: true, result });
    })
  }
  finally {

  }

}
run().catch(console.dir);

console.log(uri)
app.get('/', (req, res) => {
  res.send('Hello Doctors!')
})

app.listen(port, () => {
  console.log(` doctors port no ${port}`)
})