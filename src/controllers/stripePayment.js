const PUBLISHABLE_KEY =
  "pk_test_51ReFpHHK0mOzH3eWINAHHUHzgPK4q9fk7GjLUes7e9YrgRIzjva30wBXoyjWAm9FSUCbqv8u32oC4uNdn0q5M4rh00BmN9uPYP";
const SECRET_KEY =
  "sk_test_51ReFpHHK0mOzH3eWo5cH02nmk9QYASx4OgDTO4YkJtQ3GHgWvavfMd3RDF93DuFr48wCtJ1HXvkofcUvzzCGeUF500pUrdItP5";
const stripe = require("stripe")(SECRET_KEY);

exports.paymentSecret = async (req, res) => {
  console.log(`-----Payment Secret-----`);
  try {
    const amountInLKR = 1000.5;
    const paymentInten = await stripe.paymentIntents.create({
      amount: Math.round(amountInLKR * 100),
      currency: "LKR",
      payment_method_types: ["card"],
    });
    const clientSecret = paymentInten.client_secret;
    res.status(200).json({
      clientSecret: clientSecret,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.paymentSheet = async (req, res) => {
  console.log(`-----Payment Sheet-----`);
  const amount = 1099;
  const amountInCents = amount * 100;
  try {
    // Use an existing Customer ID if this is a returning customer.
    const customer = await stripe.customers.create();
    // const customer = {
    //   id: "cus_SZknmmE10EHWcv",
    // };
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2025-05-28.basil" }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "LKR",
      customer: customer.id,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter
      // is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey:
        "pk_test_51ReFpHHK0mOzH3eWINAHHUHzgPK4q9fk7GjLUes7e9YrgRIzjva30wBXoyjWAm9FSUCbqv8u32oC4uNdn0q5M4rh00BmN9uPYP",
    });
    console.log(`Customer ID: ${customer.id}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};
