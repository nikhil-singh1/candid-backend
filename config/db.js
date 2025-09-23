// const mongoose = require('mongoose');
// const connectDB = async () => {
// try {
// await mongoose.connect(process.env.MONGO_URI, {
// useNewUrlParser: true,
// useUnifiedTopology: true,
// });
// console.log('MongoDB connected');
// } catch (err) {
// console.error(err);
// process.exit(1);
// }
// };

// module.exports = connectDB;


const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
