const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const mongoclient = new MongoClient('mongodb+srv://roger:ue8E3N7bKrcF7j5v@waves.nri60mg.mongodb.net/');

const db = mongoclient.db('InternalData');
const collection = db.collection('accounts');


collection.updateMany({}, {$set: {affiliateId: null}}, (err, result) => {
    if (err) {
        console.log(err);
    } else {
        console.log(result);
    }
});