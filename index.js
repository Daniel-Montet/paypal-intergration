const express = require("express");
const createOrder = require("./paypal/createOrder");
const captureOrder = require("./paypal/captureOrder");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/pay", async (req, res) => {
  let response = await createOrder();
  console.log("Creating Order...");
  let orderId = "";

  if (response.statusCode === 201) {
    console.log("Created Successfully");
    orderId = response.result.id;
    console.log("Links:");
    response.result.links.forEach((item, index) => {
      let rel = item.rel;
      let href = item.href;
      let method = item.method;
      let message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);

      if (rel === "approve") {
        res.redirect(href);
      }
    });
  } else {
    res.send("Failed to create Order");
    return;
  }
});

app.get("/success", async (req, res) => {
  const orderId = req.query.token;
  const PayerId = req.query.PayerID;

  const response = await captureOrder(orderId, (debug = true));
  let captureId = "";
  if (response.statusCode === 201) {
    console.log("Captured Successfully");
    console.log("Status Code: " + response.statusCode);
    console.log("Status: " + response.result.status);
    console.log("Order ID: " + response.result.id);
    console.log("Capture Ids:");
    response.result.purchase_units.forEach((item, index) => {
      item.payments.captures.forEach((item, index) => {
        console.log("\t" + item.id);
        captureId = item.id;
      });
    });
    console.log("Links: ");
    response.result.links.forEach((item, index) => {
      let rel = item.rel;
      let href = item.href;
      let method = item.method;
      let message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    /**
     * At this point the payment is successful
     * @Todo log the transaction to a database :)
     */
    res.redirect("/thankyou");
  }

  res.send("there was an issue processing your payment");
});

app.listen(port, (err) => {
  console.log(`server running on port ${port}`);
});
