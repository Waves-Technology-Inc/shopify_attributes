const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());


mongoose.connect('mongodb+srv://roger:ue8E3N7bKrcF7j5v@waves.nri60mg.mongodb.net/ShopifyAttributes', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.once('open', () => {
    console.log('Connected to MongoDB');
});

const saleSchema = new mongoose.Schema({
    userId: String, 
    affiliateId: String,
    campaignId: String, 
    events: Array // {event_name, event_data};
});

const webhook_sale_data = mongoose.model('Sale', saleSchema);

app.use(bodyParser.json());

app.get('/pixel.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'pap.txt'));
});

app.post('/webhooks/orders/create', async (req, res) => {
    try {
        const data = req.body;

        const sale_data = new webhook_sale_data({
            hook: data
        });

        await sale_data.save();

        res.status(200).send('OK');
    } catch (error) {
        res.status(500).json({ error: `Error: ${error}` });
    };
});

app.post('/events', async (req, res) => {
    try {
        await mongoose.connect('mongodb+srv://roger:ue8E3N7bKrcF7j5v@waves.nri60mg.mongodb.net/ShopifyAttributes', { useNewUrlParser: true, useUnifiedTopology: true });

        const {event_name, event_data, userId, affiliateId, browserData} = req.body.data;

        const sale_data = await webhook_sale_data.findOne({userId: userId});
        
        if (sale_data) {
            sale_data.events.push({event_name: event_name, event_data: event_data, ts: new Date().getTime(), browserData: browserData});
            await sale_data.save();
        } else {
            const new_sale_data = new webhook_sale_data({
                userId: userId,
                affiliateId: affiliateId,
                events: [{event_name: event_name, event_data: event_data, ts: new Date().getTime(), browserData: browserData}]
            });

            await new_sale_data.save();
        };

        res.status(200).send('OK');
    } catch (error) {
        res.status(500).json({ error: `Error: ${error}` });
    };
});


app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});